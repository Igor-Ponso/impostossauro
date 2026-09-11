#!/usr/bin/env python3
"""
Le os arquivos abertos do Cartao de Pagamento do Governo Federal (CPGF) e
escreve `data-bruto/cartao-corporativo.csv`, agregado por orgao.

Por orgao, nunca por pessoa: o arquivo traz o nome de cada portador, e a
denuncia e sobre a maquina, nao sobre individuos.

Fonte, sem token nem cadastro (a API do Portal exige chave; os arquivos abertos, nao):
https://portaldatransparencia.gov.br/download-de-dados/cpgf/{AAAAMM}

Uso:
  python3 scripts/coleta/cartao-corporativo.py 2025
  python3 scripts/coleta/cartao-corporativo.py 2025 --baixar
"""

import csv
import io
import sys
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
BRUTO = RAIZ / "data-bruto" / "cpgf"
SAIDA = RAIZ / "data-bruto" / "cartao-corporativo.csv"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"


def baixar(ano: int) -> None:
    BRUTO.mkdir(parents=True, exist_ok=True)
    for mes in range(1, 13):
        destino = BRUTO / f"{ano}{mes:02d}.zip"
        if destino.exists() and destino.stat().st_size > 10_000:
            continue
        url = f"https://portaldatransparencia.gov.br/download-de-dados/cpgf/{ano}{mes:02d}"
        pedido = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(pedido, timeout=300) as r, destino.open("wb") as f:
            f.write(r.read())
        print(f"  baixado {destino.name} ({destino.stat().st_size} bytes)")


# O CSV do Portal trunca o nome do orgao em 43 caracteres. Completar e seguro
# porque so um ministerio comeca por cada prefixo; truncamento novo sai no aviso do fim.
TRUNCADOS = {
    "Ministério do Meio Ambiente e Mudança do Cl": "Ministério do Meio Ambiente e Mudança do Clima",
    "Ministério do Desenvolvimento Agrário e Agr": "Ministério do Desenvolvimento Agrário e Agricultura Familiar",
}


def orgao_completo(nome: str) -> str:
    return TRUNCADOS.get(nome, nome)


def numero(bruto: str) -> float | None:
    """O arquivo usa ponto de milhar e virgula decimal. Valor ilegivel vira None
    em vez de zero: zero somaria calado e sumiria da conta."""
    try:
        return float(bruto.strip().replace(".", "").replace(",", "."))
    except (AttributeError, ValueError):
        return None


def main() -> int:
    ano = int(sys.argv[1]) if len(sys.argv) > 1 else 2025
    if "--baixar" in sys.argv:
        baixar(ano)

    arquivos = sorted(BRUTO.glob(f"{ano}*.zip"))
    if not arquivos:
        print(f"nenhum zip de {ano} em {BRUTO.relative_to(RAIZ)} — rode com --baixar", file=sys.stderr)
        return 1

    total = defaultdict(float)
    sigilo = defaultdict(float)
    saque = defaultdict(float)
    transacoes = 0
    ilegiveis = 0
    meses = set()

    for zip_path in arquivos:
        with zipfile.ZipFile(zip_path) as zf:
            nome = next(n for n in zf.namelist() if n.upper().endswith(".CSV"))
            with zf.open(nome) as bruto:
                leitor = csv.DictReader(io.TextIOWrapper(bruto, encoding="latin-1"), delimiter=";")
                for linha in leitor:
                    valor = numero(linha["VALOR TRANSAÇÃO"])
                    if valor is None:
                        ilegiveis += 1
                        continue
                    orgao = orgao_completo(linha["NOME ÓRGÃO SUPERIOR"].strip())
                    tipo = linha["TRANSAÇÃO"].strip()
                    total[orgao] += valor
                    if "sigilo" in tipo.lower():
                        sigilo[orgao] += valor
                    if "SAQUE" in tipo.upper():
                        saque[orgao] += valor
                    transacoes += 1
                    meses.add((linha["ANO EXTRATO"], linha["MÊS EXTRATO"]))

    if ilegiveis:
        print(f"  {ilegiveis} valores ilegiveis, fora da conta", file=sys.stderr)
    cortados = [o for o in total if len(o) == 43 and o not in TRUNCADOS.values()]
    if cortados:
        print(f"  nomes possivelmente truncados, sem entrada em TRUNCADOS: {cortados}", file=sys.stderr)
    if len(meses) != 12:
        print(f"  ATENCAO: {len(meses)} meses, nao 12 — o ano nao esta fechado", file=sys.stderr)

    linhas = [
        {
            "orgao": o,
            "total": f"{total[o]:.2f}",
            "sigilo": f"{sigilo.get(o, 0.0):.2f}",
            "saque": f"{saque.get(o, 0.0):.2f}",
            "pct_sigilo": f"{sigilo.get(o, 0.0) / total[o] * 100:.1f}",
        }
        for o in sorted(total, key=lambda k: -total[k])
    ]
    with SAIDA.open("w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=list(linhas[0]), delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas)

    T, S, Q = sum(total.values()), sum(sigilo.values()), sum(saque.values())
    print(
        f"{transacoes:,} transacoes em {len(meses)} meses de {ano}\n"
        f"  total  R$ {T:,.2f}\n"
        f"  sigilo R$ {S:,.2f}  ({S / T * 100:.1f}%)\n"
        f"  saque  R$ {Q:,.2f}  ({Q / T * 100:.1f}%)\n"
        f"  sem destino identificavel: {(S + Q) / T * 100:.1f}%\n"
        f"  {len(linhas)} orgaos em {SAIDA.relative_to(RAIZ)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
