#!/usr/bin/env python3
"""
Extrai as duas séries anuais de carga tributária bruta em % do PIB (FGV/Ibre e
Tesouro) e escreve `data-bruto/carga-tributaria.csv`, uma coluna por régua.

As duas medem a mesma coisa e divergem todo ano (2024: 34,24% contra 32,22%),
por metodologia. Nunca emendar numa linha só. Antes de 1990 não existe nenhuma
das duas; a série Varsano/Ipea de `historical.json` é uma terceira régua.

Fontes:
  FGV/Ibre — Observatório de Política Fiscal, Carga Tributária no Brasil
  https://observatorio-politica-fiscal.ibre.fgv.br/series-historicas/carga-tributaria/carga-tributaria-no-brasil-1990-2024

  Tesouro Nacional — Estimativa da Carga Tributária Bruta do Governo Geral
  https://www.tesourotransparente.gov.br/publicacoes/carga-tributaria-do-governo-geral/2025/114
"""

import csv
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

RAIZ = Path(__file__).resolve().parents[2]
BRUTO = RAIZ / "data-bruto"
FGV = BRUTO / "fgv-ctb-1990-2024.xlsx"
TESOURO = BRUTO / "tesouro-ctb-governo-geral.xlsx"
SAIDA = BRUTO / "carga-tributaria.csv"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def textos(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    raiz = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
    return ["".join(no.itertext()) for no in raiz.findall(f"{NS}si")]


def linhas(zf: zipfile.ZipFile, caminho: str, tabela: list[str]):
    """Cada linha como lista de valores, na ordem das colunas A, B, C…"""
    folha = ElementTree.fromstring(zf.read(caminho))
    for linha in folha.iter(f"{NS}row"):
        celulas: dict[int, object] = {}
        for celula in linha.findall(f"{NS}c"):
            letras = re.match(r"[A-Z]+", celula.get("r") or "")
            if not letras:
                continue
            indice = 0
            for caractere in letras.group(0):
                indice = indice * 26 + (ord(caractere) - 64)
            indice -= 1
            valor = celula.find(f"{NS}v")
            if valor is None or valor.text is None:
                continue
            if celula.get("t") == "s":
                celulas[indice] = tabela[int(valor.text)]
            else:
                try:
                    celulas[indice] = float(valor.text)
                except ValueError:
                    celulas[indice] = valor.text
        if celulas:
            yield [celulas.get(i) for i in range(max(celulas) + 1)]


def aba(zf: zipfile.ZipFile, nome_procurado: str) -> str:
    wb = ElementTree.fromstring(zf.read("xl/workbook.xml"))
    rels = ElementTree.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    alvo = {r.get("Id"): r.get("Target") for r in rels}
    rid = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    for folha in wb.find(f"{NS}sheets"):
        if nome_procurado in (folha.get("name") or ""):
            return f"xl/{alvo[folha.get(rid)].lstrip('/')}"
    raise SystemExit(f"aba com '{nome_procurado}' nao encontrada")


def serie_fgv() -> dict[int, float]:
    with zipfile.ZipFile(FGV) as zf:
        tabela = textos(zf)
        anos: list[int] = []
        for linha in linhas(zf, aba(zf, "% do PIB"), tabela):
            if linha and linha[0] == "Tributo":
                anos = [int(c) for c in linha[1:] if isinstance(c, float)]
            elif linha and isinstance(linha[0], str) and linha[0].strip().startswith("Total da Receita Tribut"):
                valores = linha[1 : 1 + len(anos)]
                # A planilha guarda a fração (0,3424), não o percentual.
                return {a: round(v * 100, 2) for a, v in zip(anos, valores) if isinstance(v, float)}
    raise SystemExit("linha 'Total da Receita Tributaria' nao encontrada na planilha do FGV")


def serie_tesouro() -> dict[int, float]:
    with zipfile.ZipFile(TESOURO) as zf:
        tabela = textos(zf)
        anos: list[int] = []
        visto_reais = False
        for linha in linhas(zf, aba(zf, "Tabela 1"), tabela):
            if not linha:
                continue
            if linha[0] == "Esfera de governo":
                anos = [int(c) for c in linha[1:] if isinstance(c, float)]
            elif linha[0] == "Governo Geral" and anos:
                valores = linha[1 : 1 + len(anos)]
                # A Tabela 1 repete o rótulo: o primeiro bloco "Governo Geral"
                # é em R$ milhões, o segundo em fração do PIB.
                if not visto_reais:
                    visto_reais = True
                    continue
                return {a: round(v * 100, 2) for a, v in zip(anos, valores) if isinstance(v, float)}
    raise SystemExit("linha 'Governo Geral' em % do PIB nao encontrada na planilha do Tesouro")


def main() -> int:
    for arquivo in (FGV, TESOURO):
        if not arquivo.exists():
            print(f"Falta {arquivo.relative_to(RAIZ)} — ver o cabecalho deste script.", file=sys.stderr)
            return 1

    fgv = serie_fgv()
    tesouro = serie_tesouro()
    if not fgv or not tesouro:
        print("uma das series veio vazia", file=sys.stderr)
        return 1

    # Sem ano em comum, uma das duas mudou de metodologia.
    comum = sorted(set(fgv) & set(tesouro))
    if not comum:
        print("as duas series nao se sobrepoem em ano nenhum", file=sys.stderr)
        return 1

    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.writer(arquivo, delimiter=";")
        escritor.writerow(["ano", "fgv_pct_pib", "tesouro_pct_pib"])
        for ano in sorted(set(fgv) | set(tesouro)):
            escritor.writerow([ano, fgv.get(ano, ""), tesouro.get(ano, "")])

    distancias = [tesouro[a] - fgv[a] for a in comum]
    print(
        f"{len(fgv)} anos de FGV ({min(fgv)}-{max(fgv)}) e {len(tesouro)} do Tesouro "
        f"({min(tesouro)}-{max(tesouro)}) escritos em {SAIDA.relative_to(RAIZ)}"
    )
    print(
        f"Sobrepostos em {len(comum)} anos; o Tesouro fica de "
        f"{min(distancias):+.2f} a {max(distancias):+.2f} p.p. em relacao ao FGV."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
