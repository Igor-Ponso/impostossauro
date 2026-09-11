#!/usr/bin/env python3
"""
Serie anual da despesa com pessoal do Governo Central e da receita liquida, da
Tabela 1.1-A do "Resultado do Tesouro Nacional - Serie Historica", em
`data-bruto/folha-federal.csv`.

A 1.1-A, e nao a 1.1: ela ja vem deflacionada pelo IPCA pelo proprio Tesouro.
O rotulo da base ("Valores de Mai/2026") sai do cabecalho e vai junto para o
JSON; sem ele o numero nao significa nada.

Fonte: https://www.tesourotransparente.gov.br/ckan/dataset/resultado-do-tesouro-nacional

Uso:
  python3 scripts/coleta/serie-folha.py            # usa o arquivo ja baixado
  python3 scripts/coleta/serie-folha.py --baixar   # busca a versao mais nova
"""

import csv
import re
import sys
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree

RAIZ = Path(__file__).resolve().parents[2]
XLSX = RAIZ / "data-bruto" / "tesouro" / "rtn.xlsx"
SAIDA = RAIZ / "data-bruto" / "folha-federal.csv"
CKAN = "https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=resultado-do-tesouro-nacional"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Casadas por prefixo numerado, nao pelo rotulo inteiro: o Tesouro varia o
# espacamento e acrescenta sufixo entre edicoes ("3. RECEITA LIQUIDA  (1-2)").
RECEITA_LIQUIDA = "3. RECEITA LÍQUIDA"
PESSOAL = "4.2  Pessoal e Encargos Sociais"

# So ano fechado: onze meses desenham uma queda que nao existe.
MESES_DO_ANO = 12


def baixar() -> None:
    import json

    pedido = urllib.request.Request(CKAN, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=120) as resposta:
        catalogo = json.load(resposta)["result"]["resources"]
    url = next(r["url"] for r in catalogo if r["format"] == "XLSX" and "Mensal" in r["name"])
    XLSX.parent.mkdir(parents=True, exist_ok=True)
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=600) as resposta, XLSX.open("wb") as arquivo:
        arquivo.write(resposta.read())
    print(f"baixado: {XLSX.relative_to(RAIZ)} ({XLSX.stat().st_size} bytes)")


def celulas(zf: zipfile.ZipFile, alvo: str, compartilhadas: list[str]) -> dict[str, str]:
    """{'A6': 'texto', 'B6': '123.4', ...} da aba pedida."""
    nomes = ElementTree.fromstring(zf.read("xl/workbook.xml"))
    indice = next(
        i
        for i, f in enumerate(nomes.iter(f"{NS}sheet"), start=1)
        if f.get("name") == alvo
    )
    folha = ElementTree.fromstring(zf.read(f"xl/worksheets/sheet{indice}.xml"))
    saida: dict[str, str] = {}
    for c in folha.iter(f"{NS}c"):
        ref, tipo = c.get("r"), c.get("t")
        v = c.find(f"{NS}v")
        if ref is None or v is None or v.text is None:
            continue
        saida[ref] = compartilhadas[int(v.text)] if tipo == "s" else v.text
    return saida


def main() -> int:
    if "--baixar" in sys.argv or not XLSX.exists():
        baixar()

    with zipfile.ZipFile(XLSX) as zf:
        raiz_ss = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
        compartilhadas = ["".join(t.text or "" for t in si.iter(f"{NS}t")) for si in raiz_ss]
        grade = celulas(zf, "1.1-A", compartilhadas)

    # coluna A: rotulo -> numero da linha. Linha 5 e o cabecalho com as datas.
    linha_de = {}
    for ref, valor in grade.items():
        col, num = re.match(r"([A-Z]+)(\d+)", ref).groups()
        if col == "A":
            linha_de[valor.strip()] = int(num)

    base = next((k for k in linha_de if "Valores de" in k), "")
    def linha(prefixo: str) -> int | None:
        alvo = re.sub(r"\s+", " ", prefixo)
        casados = [n for k, n in linha_de.items() if re.sub(r"\s+", " ", k).startswith(alvo)]
        return casados[0] if len(casados) == 1 else None

    onde = {rotulo: linha(rotulo) for rotulo in (RECEITA_LIQUIDA, PESSOAL)}
    for rotulo, num in onde.items():
        if num is None:
            print(f"nao achei UMA linha para {rotulo!r} na aba 1.1-A", file=sys.stderr)
            print(f"rotulos disponiveis: {sorted(linha_de)[:40]}", file=sys.stderr)
            return 1

    # Serial de data do Excel: a epoca e 1899-12-30.
    import datetime

    anos_por_coluna = {}
    for ref, valor in grade.items():
        col, num = re.match(r"([A-Z]+)(\d+)", ref).groups()
        if int(num) != 5 or col == "A":
            continue
        try:
            dia = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(valor)))
        except ValueError:
            continue
        anos_por_coluna[col] = dia.year

    somas: dict[int, list[float]] = {}
    for col, ano in anos_por_coluna.items():
        pessoal = grade.get(f"{col}{onde[PESSOAL]}")
        receita = grade.get(f"{col}{onde[RECEITA_LIQUIDA]}")
        if pessoal is None or receita is None:
            continue
        acc = somas.setdefault(ano, [0.0, 0.0, 0])
        acc[0] += float(pessoal)
        acc[1] += float(receita)
        acc[2] += 1

    linhas = []
    for ano in sorted(somas):
        pessoal, receita, meses = somas[ano]
        if meses != MESES_DO_ANO:
            print(f"  {ano}: {meses} meses — fora da serie (so ano fechado)", file=sys.stderr)
            continue
        linhas.append(
            {
                "ano": ano,
                "pessoal_bi": f"{pessoal / 1000:.1f}",
                "receita_liquida_bi": f"{receita / 1000:.1f}",
                "pct_da_receita": f"{pessoal / receita * 100:.1f}",
            }
        )

    if not linhas:
        print("nenhum ano fechado — o arquivo mudou de forma?", file=sys.stderr)
        return 1

    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=list(linhas[0]), delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas)

    primeiro, ultimo = linhas[0], linhas[-1]
    print(
        f"{len(linhas)} anos ({primeiro['ano']}-{ultimo['ano']}) em {SAIDA.relative_to(RAIZ)}\n"
        f"  base: {base}\n"
        f"  folha   R$ {primeiro['pessoal_bi']} bi -> R$ {ultimo['pessoal_bi']} bi\n"
        f"  receita R$ {primeiro['receita_liquida_bi']} bi -> R$ {ultimo['receita_liquida_bi']} bi\n"
        f"  fatia   {primeiro['pct_da_receita']}% -> {ultimo['pct_da_receita']}%"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
