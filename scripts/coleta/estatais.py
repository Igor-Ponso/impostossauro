#!/usr/bin/env python3
"""
Le a planilha desagregada do Boletim Trimestral da SEST e escreve
`data-bruto/estatais.csv`, uma linha por estatal federal, com o que cada uma
recebeu do Tesouro e devolveu em dividendos a Uniao.

A planilha e acumulada no ano (o 3T traz nove meses); o rotulo do periodo vai
junto.

Fonte: https://www.gov.br/gestao/pt-br/assuntos/estatais/transparencia/boletim-trimestral-sest
A pagina e um shell de JavaScript, mas o href do .xlsx esta no HTML dela — e o
que `--baixar` raspa.

Uso:
  python3 scripts/coleta/estatais.py
  python3 scripts/coleta/estatais.py --baixar
"""

import csv
import re
import sys
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree

RAIZ = Path(__file__).resolve().parents[2]
XLSX = RAIZ / "data-bruto" / "estatais" / "sest-3t25.xlsx"
SAIDA = RAIZ / "data-bruto" / "estatais.csv"
PAGINA = "https://www.gov.br/gestao/pt-br/assuntos/estatais/transparencia/boletim-trimestral-sest"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Rotulos exatos da linha 1, como a SEST publica.
COLUNAS = {
    "sigla": "Empresa (sigla)",
    "nome": "Empresa (nome)",
    "setor": "Setor",
    "dependencia": "Dependência do Tesouro Nacional",
    "resultado": "Resultado Líquido",
    "dividendos_uniao": "Dividendos e JCP pagos à União",
    "recebido_tesouro": "Recursos recebidos do Tesouro Nacional",
    "empregados": "Empregados",
}


def baixar() -> None:
    pedido = urllib.request.Request(PAGINA, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=120) as resposta:
        html = resposta.read().decode("utf-8", "replace")
    casado = re.search(r'href="([^"]*dados-desagregados[^"]*\.xlsx)"', html)
    if not casado:
        raise SystemExit("nao achei o link do arquivo desagregado na pagina da SEST")
    XLSX.parent.mkdir(parents=True, exist_ok=True)
    pedido = urllib.request.Request(casado.group(1), headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=300) as resposta, XLSX.open("wb") as arquivo:
        arquivo.write(resposta.read())
    print(f"baixado: {casado.group(1).rsplit('/', 1)[-1]}")


def celulas(zf: zipfile.ZipFile, aba: str, compartilhadas: list[str]) -> dict[str, str]:
    livro = ElementTree.fromstring(zf.read("xl/workbook.xml"))
    indice = next(
        i for i, f in enumerate(livro.iter(f"{NS}sheet"), start=1) if f.get("name") == aba
    )
    folha = ElementTree.fromstring(zf.read(f"xl/worksheets/sheet{indice}.xml"))
    saida: dict[str, str] = {}
    for c in folha.iter(f"{NS}c"):
        ref, tipo, v = c.get("r"), c.get("t"), c.find(f"{NS}v")
        if ref is None or v is None or v.text is None:
            continue
        saida[ref] = compartilhadas[int(v.text)] if tipo == "s" else v.text
    return saida


def main() -> int:
    if "--baixar" in sys.argv or not XLSX.exists():
        baixar()

    with zipfile.ZipFile(XLSX) as zf:
        livro = ElementTree.fromstring(zf.read("xl/workbook.xml"))
        abas = [f.get("name") for f in livro.iter(f"{NS}sheet")]
        # a aba mais recente e a primeira; o nome carrega o trimestre (ex.: 3T25)
        aba = abas[0]
        ss = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
        compartilhadas = ["".join(t.text or "" for t in si.iter(f"{NS}t")) for si in ss]
        grade = celulas(zf, aba, compartilhadas)

    coluna_de: dict[str, str] = {}
    for ref, valor in grade.items():
        col, linha = re.match(r"([A-Z]+)(\d+)", ref).groups()
        if linha == "1":
            coluna_de[valor.strip()] = col

    faltando = [r for r in COLUNAS.values() if r not in coluna_de]
    if faltando:
        print(f"colunas ausentes em {aba}: {faltando}", file=sys.stderr)
        print(f"disponiveis: {sorted(coluna_de)}", file=sys.stderr)
        return 1

    ultima = max(int(re.match(r"[A-Z]+(\d+)", r).group(1)) for r in grade)
    linhas = []
    for n in range(2, ultima + 1):
        registro = {}
        for chave, rotulo in COLUNAS.items():
            registro[chave] = grade.get(f"{coluna_de[rotulo]}{n}", "")
        if not registro["sigla"]:
            continue
        linhas.append(registro)

    if not linhas:
        print("nenhuma empresa lida — o arquivo mudou de forma?", file=sys.stderr)
        return 1

    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=list(COLUNAS), delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas)

    def num(v: str) -> float:
        # A SEST escreve "-" onde nao ha valor; vale zero.
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0
    recebeu = sum(num(l["recebido_tesouro"]) for l in linhas)
    devolveu = sum(num(l["dividendos_uniao"]) for l in linhas)
    lucro = sum(num(l["resultado"]) for l in linhas)
    dependentes = sum(1 for l in linhas if l["dependencia"] == "Dependente")

    print(
        f"{len(linhas)} empresas da aba {aba} em {SAIDA.relative_to(RAIZ)}\n"
        f"  dependentes do Tesouro : {dependentes}\n"
        f"  recebido do Tesouro    : R$ {recebeu / 1e9:,.1f} bi\n"
        f"  dividendos a Uniao     : R$ {devolveu / 1e9:,.1f} bi\n"
        f"  resultado liquido      : R$ {lucro / 1e9:,.1f} bi"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
