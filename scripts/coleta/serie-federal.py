#!/usr/bin/env python3
"""
Extrai a serie anual da arrecadacao federal da planilha oficial da Receita e
escreve `data-bruto/receita-serie-historica.csv`, que `consolidar.mjs` le para
montar `federalRevenueSeries`.

Nao se soma o CSV por estado: la a receita previdenciaria so existe de 2013 em
diante e a de outros orgaos de 2010, e antes disso o ano sai ~30% menor sem
que nada acuse. Esta planilha traz as tres parcelas separadas, mes a mes, de
1994 a 2025; onde as duas se sobrepoem (2013-2024) fecham em 0,05%.

Fonte:
  Receita Federal — ReceitaData, Serie Historica
  https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitadata/arrecadacao/serie-historica
"""

import csv
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

RAIZ = Path(__file__).resolve().parents[2]
PLANILHA = RAIZ / "data-bruto" / "receita-serie-historica-1994-2025.xlsx"
SAIDA = RAIZ / "data-bruto" / "receita-serie-historica.csv"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Linhas de fechamento de cada aba; o rotulo declara a aritmetica: [C]=[A]+[B], [E]=[C]+[D].
LINHAS = {
    "subtotal": "SUBTOTAL [A]",
    "previdenciaria": "RECEITA PREVIDENCIÁRIA [B]",
    "outros_orgaos": "ADMINISTRADAS POR OUTROS ÓRGÃOS [D]",
    "total": "TOTAL GERAL [E]",
}


def textos_compartilhados(zf: zipfile.ZipFile) -> list[str]:
    """A tabela de strings do xlsx: as celulas de texto guardam so o indice."""
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    raiz = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
    return ["".join(no.itertext()) for no in raiz.findall(f"{NS}si")]


def celulas(linha, textos: list[str]) -> dict[int, object]:
    """Mapeia coluna (0 = A) para o valor da celula, ja resolvendo texto."""
    saida: dict[int, object] = {}
    for celula in linha.findall(f"{NS}c"):
        ref = celula.get("r") or ""
        letras = re.match(r"[A-Z]+", ref)
        if not letras:
            continue
        indice = 0
        for caractere in letras.group(0):
            indice = indice * 26 + (ord(caractere) - 64)
        indice -= 1

        valor_no = celula.find(f"{NS}v")
        if valor_no is None or valor_no.text is None:
            continue
        bruto = valor_no.text
        if celula.get("t") == "s":
            saida[indice] = textos[int(bruto)]
        elif celula.get("t") == "inlineStr":
            saida[indice] = "".join(celula.itertext())
        else:
            try:
                saida[indice] = float(bruto)
            except ValueError:
                saida[indice] = bruto
    return saida


def abas(zf: zipfile.ZipFile) -> list[tuple[str, str]]:
    """(nome da aba, caminho do xml), na ordem do workbook."""
    wb = ElementTree.fromstring(zf.read("xl/workbook.xml"))
    rels = ElementTree.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    alvo = {
        r.get("Id"): r.get("Target")
        for r in rels
    }
    saida = []
    rid = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    for folha in wb.find(f"{NS}sheets"):
        destino = alvo[folha.get(rid)]
        saida.append((folha.get("name"), f"xl/{destino.lstrip('/')}"))
    return saida


def main() -> int:
    if not PLANILHA.exists():
        print(
            f"Falta {PLANILHA.relative_to(RAIZ)}.\n"
            "Baixe de https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/"
            "dados-abertos/receitadata/arrecadacao/serie-historica/"
            "arrecadacao-das-receitas-federais-1994-a-2025.xlsx",
            file=sys.stderr,
        )
        return 1

    with zipfile.ZipFile(PLANILHA) as zf:
        textos = textos_compartilhados(zf)
        linhas_saida = []

        for nome, caminho in abas(zf):
            if not re.fullmatch(r"\d{4}", nome or ""):
                continue
            folha = ElementTree.fromstring(zf.read(caminho))
            achados: dict[str, list[float]] = {}

            for linha in folha.iter(f"{NS}row"):
                mapa = celulas(linha, textos)
                rotulo = mapa.get(0)
                if not isinstance(rotulo, str):
                    continue
                rotulo = rotulo.strip()
                for chave, esperado in LINHAS.items():
                    if rotulo.startswith(esperado):
                        # B..M sao os doze meses; N e o total da propria planilha, conferido abaixo.
                        meses = [mapa.get(i) for i in range(1, 13)]
                        achados[chave] = [m for m in meses if isinstance(m, float)]
                        achados[f"{chave}_n"] = mapa.get(13)

            faltando = [c for c in LINHAS if c not in achados]
            if faltando:
                print(f"aba {nome}: faltam as linhas {faltando}", file=sys.stderr)
                return 1

            meses_total = len(achados["total"])
            soma = sum(achados["total"])
            coluna_n = achados.get("total_n")
            if isinstance(coluna_n, float) and abs(soma - coluna_n) > 1:
                print(
                    f"aba {nome}: a soma dos meses ({soma:.1f}) nao bate com a "
                    f"coluna de total da planilha ({coluna_n:.1f})",
                    file=sys.stderr,
                )
                return 1

            linhas_saida.append(
                {
                    "ano": nome,
                    "meses": meses_total,
                    # Contagem de meses com valor, nao a soma: um mes solto faz a soma passar de zero.
                    "meses_previdenciaria": sum(1 for v in achados["previdenciaria"] if v),
                    "meses_outros_orgaos": sum(1 for v in achados["outros_orgaos"] if v),
                    "subtotal_milhoes": round(sum(achados["subtotal"]), 3),
                    "previdenciaria_milhoes": round(sum(achados["previdenciaria"]), 3),
                    "outros_orgaos_milhoes": round(sum(achados["outros_orgaos"]), 3),
                    "total_milhoes": round(soma, 3),
                }
            )

    if not linhas_saida:
        print("nenhuma aba de ano encontrada na planilha", file=sys.stderr)
        return 1

    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=list(linhas_saida[0]), delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas_saida)

    print(
        f"{len(linhas_saida)} anos ({linhas_saida[0]['ano']}-{linhas_saida[-1]['ano']}) "
        f"escritos em {SAIDA.relative_to(RAIZ)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
