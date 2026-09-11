#!/usr/bin/env python3
"""
Série anual da cesta básica de São Paulo, dos boletins de dezembro do DIEESE,
em `data-bruto/cesta-basica.csv`: valor em reais correntes, % do salário mínimo
líquido e horas de trabalho.

Fonte: https://www.dieese.org.br/analisecestabasica/{ano}/{ano}12cestabasica.pdf
Dezembro fecha o ano e o boletim traz o mínimo vigente no mês.

O layout da tabela muda de ano para ano e a ordem das colunas no texto muda
junto; ler por posição devolve número errado sem avisar. Cada campo é
reconhecido pela forma: tempo é o único com "h" e "m"; valor, o único entre
150 e 1500; % mínimo, o único entre 30 e 100 que não é o valor.

Depende de `pdf-texto.swift` (PDFKit do macOS); não roda no runner Linux.
"""

import csv
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
BRUTO = RAIZ / "data-bruto" / "dieese"
SAIDA = RAIZ / "data-bruto" / "cesta-basica.csv"
EXTRATOR = RAIZ / "scripts" / "coleta" / "pdf-texto.swift"

PRIMEIRO, ULTIMO = 2010, 2025
CAPITAL = "São Paulo"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36"

TEMPO = re.compile(r"(\d{2,3})h\s?(\d{1,2})\s*m(?:in)?\b")
NUMERO = re.compile(r"-?\d{1,4},\d{2}")


def baixar(ano: int) -> Path:
    destino = BRUTO / f"{ano}12.pdf"
    if destino.exists() and destino.stat().st_size > 50_000:
        return destino
    url = f"https://www.dieese.org.br/analisecestabasica/{ano}/{ano}12cestabasica.pdf"
    destino.parent.mkdir(parents=True, exist_ok=True)
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=60) as resposta, destino.open("wb") as arquivo:
        arquivo.write(resposta.read())
    return destino


def texto(pdf: Path) -> str:
    saida = subprocess.run(
        ["swift", str(EXTRATOR), str(pdf)], capture_output=True, text=True, check=False
    )
    if saida.returncode != 0:
        raise SystemExit(f"nao consegui ler {pdf.name}: {saida.stderr.strip()}")
    return saida.stdout


def linha_da_capital(conteudo: str) -> str | None:
    for linha in conteudo.split("\n"):
        limpa = re.sub(r"\s+", " ", linha).strip()
        if CAPITAL in limpa and TEMPO.search(limpa):
            return limpa
    return None


def ler(ano: int) -> dict | None:
    linha = linha_da_capital(texto(baixar(ano)))
    if not linha:
        return None
    tempo = TEMPO.search(linha)
    assert tempo
    horas = int(tempo.group(1)) + int(tempo.group(2)) / 60
    numeros = [float(n.replace(".", "").replace(",", ".")) for n in NUMERO.findall(linha)]
    valor = next((n for n in numeros if 150 <= n <= 1500), None)
    pct = next((n for n in numeros if 30 <= n <= 100 and n != valor), None)
    if valor is None or pct is None:
        return None
    return {
        "ano": ano,
        "valor_brl": f"{valor:.2f}",
        "pct_minimo_liquido": f"{pct:.2f}",
        "horas_trabalho": f"{horas:.2f}",
        "tempo_rotulo": f"{tempo.group(1)}h{int(tempo.group(2)):02d}",
    }


def main() -> int:
    if not EXTRATOR.exists():
        print(f"falta {EXTRATOR.relative_to(RAIZ)}", file=sys.stderr)
        return 1

    linhas, falhas = [], []
    for ano in range(PRIMEIRO, ULTIMO + 1):
        registro = ler(ano)
        (linhas if registro else falhas).append(registro or ano)

    if falhas:
        print(f"anos que nao deram para ler: {falhas}", file=sys.stderr)
        return 1

    with SAIDA.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=list(linhas[0]), delimiter=";")
        escritor.writeheader()
        escritor.writerows(linhas)

    primeiro, ultimo = linhas[0], linhas[-1]
    print(
        f"{len(linhas)} anos ({primeiro['ano']}-{ultimo['ano']}) escritos em "
        f"{SAIDA.relative_to(RAIZ)}\n"
        f"  a cesta de {CAPITAL} saiu de {primeiro['tempo_rotulo']} para "
        f"{ultimo['tempo_rotulo']} de trabalho"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
