#!/usr/bin/env python3
"""
Baixa a serie do salario minimo do Banco Central e escreve
`data-bruto/salario-minimo.csv` com o valor vigente em 1º de janeiro de cada ano.

So janeiro, para todos os anos: o minimo as vezes muda no meio do ano (2020:
1.039 em janeiro e 1.045 em fevereiro; 2023: 1.302 e 1.320 em maio), e misturar
"valor de janeiro" com "maior valor do ano" trocaria a regua no meio da serie.

Fonte: serie 1619 do SGS/Banco Central, mensal, desde 1994.
https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados

Uso:
  python3 scripts/coleta/salario-minimo.py [ano_inicial]
"""

import csv
import json
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / "data-bruto" / "salario-minimo.csv"
SGS = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json&dataInicial=01/01/1994"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"


def main() -> int:
    desde = int(sys.argv[1]) if len(sys.argv) > 1 else 1994
    pedido = urllib.request.Request(SGS, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=120) as resposta:
        pontos = json.load(resposta)

    janeiros = {}
    for p in pontos:
        dia, mes, ano = p["data"].split("/")
        if dia == "01" and mes == "01" and int(ano) >= desde:
            janeiros[int(ano)] = float(p["valor"])

    if not janeiros:
        print("a serie 1619 nao devolveu nenhum janeiro — a API mudou?", file=sys.stderr)
        return 1

    linhas = [{"ano": a, "minimo_brl": f"{v:.2f}"} for a, v in sorted(janeiros.items())]
    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=["ano", "minimo_brl"], delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas)

    print(
        f"{len(linhas)} anos ({linhas[0]['ano']}-{linhas[-1]['ano']}) em "
        f"{SAIDA.relative_to(RAIZ)}\n"
        f"  R$ {linhas[0]['minimo_brl']} -> R$ {linhas[-1]['minimo_brl']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
