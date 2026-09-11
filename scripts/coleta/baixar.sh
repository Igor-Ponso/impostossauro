#!/usr/bin/env bash
# Baixa as fontes de fontes.tsv para data-bruto/ e escreve RELATORIO.md.
# Nada é interpretado ou transformado: só o arquivo original, status, tipo e tamanho.

set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FONTES="$RAIZ/scripts/coleta/fontes.tsv"
DESTINO="$RAIZ/data-bruto"
RELATORIO="$DESTINO/RELATORIO.md"

mkdir -p "$DESTINO"

{
  echo "# Coleta de fontes primárias"
  echo
  echo "Gerado por \`scripts/coleta/baixar.sh\` no GitHub Actions."
  echo
  echo "| fonte | status | tipo | bytes | arquivo |"
  echo "| --- | --- | --- | --- | --- |"
} > "$RELATORIO"

while IFS=$'\t' read -r apelido url; do
  [[ -z "${apelido// }" || "${apelido:0:1}" == "#" ]] && continue

  arquivo="$DESTINO/$apelido"
  meta=$(curl -sS -L --max-time 180 --retry 2 --retry-delay 3 \
    -A 'Mozilla/5.0 (compatible; impostossauro-coleta/1.0)' \
    -o "$arquivo" -w '%{http_code}|%{content_type}|%{size_download}' \
    "$url" 2>/dev/null) || meta="000|erro-de-rede|0"

  status="${meta%%|*}"
  resto="${meta#*|}"
  tipo="${resto%%|*}"
  bytes="${resto##*|}"

  case "$tipo" in
    *json*) mv "$arquivo" "$arquivo.json"; nome="$apelido.json" ;;
    *csv*)  mv "$arquivo" "$arquivo.csv";  nome="$apelido.csv" ;;
    *html*) mv "$arquivo" "$arquivo.html"; nome="$apelido.html" ;;
    *sheet*|*excel*) mv "$arquivo" "$arquivo.xlsx"; nome="$apelido.xlsx" ;;
    *) nome="$apelido" ;;
  esac

  echo "| $apelido | $status | ${tipo:-—} | $bytes | $nome |" >> "$RELATORIO"
  echo "[$status] $apelido ($bytes bytes, $tipo)"
done < "$FONTES"

{
  echo
  echo "## Primeiros bytes de cada resposta"
  echo
} >> "$RELATORIO"

for f in "$DESTINO"/*; do
  [[ "$f" == "$RELATORIO" ]] && continue
  {
    echo "### $(basename "$f")"
    echo
    echo '```'
    head -c 600 "$f" | tr -d '\000'
    echo
    echo '```'
    echo
  } >> "$RELATORIO"
done

echo "Relatório em $RELATORIO"
