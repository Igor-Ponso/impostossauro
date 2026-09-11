#!/usr/bin/env bash
# Transferências da União a cada governo estadual, ano a ano, do RREO Anexo 01
# do SICONFI. É o lado "recebeu" da conta; o "enviou" vem do CSV da Receita.
#
# Só o 6º bimestre fecha o exercício, e só "Até o Bimestre (c)" é o realizado —
# nunca a previsão. Entra o caixa do governo do estado; o que a União repassa
# direto às prefeituras (FPM) não está aqui.

set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESTINO="$RAIZ/data-bruto"
SAIDA="$DESTINO/siconfi-transferencias.jsonl"
LOG="$DESTINO/siconfi-log.tsv"

mkdir -p "$DESTINO"
: > "$SAIDA"
printf 'exercicio\tuf\tid_ente\tstatus\tlinhas_totais\tlinhas_guardadas\n' > "$LOG"

# Código IBGE de cada UF, que é o id_ente do estado no SICONFI.
ENTES="12:AC 27:AL 13:AM 16:AP 29:BA 23:CE 53:DF 32:ES 52:GO 21:MA 31:MG 50:MS \
51:MT 15:PA 25:PB 26:PE 22:PI 41:PR 33:RJ 24:RN 11:RO 14:RR 43:RS 42:SC 28:SE \
35:SP 17:TO"

CONTAS_DE_INTERESSE='(Transferências da União|RECEITAS \(EXCETO INTRA|Transferências Correntes|Receita Tributária)'

for ano in 2015 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025; do
  for par in $ENTES; do
    ente="${par%%:*}"
    uf="${par##*:}"
    url="https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${ano}&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&co_esfera=E&id_ente=${ente}"

    corpo=$(curl -sS -L --max-time 120 --retry 2 --retry-delay 3 -w '\n%{http_code}' "$url" 2>/dev/null) || corpo=$'\n000'
    status="${corpo##*$'\n'}"
    json="${corpo%$'\n'*}"

    if [[ "$status" != "200" ]]; then
      printf '%s\t%s\t%s\t%s\t0\t0\n' "$ano" "$uf" "$ente" "$status" >> "$LOG"
      continue
    fi

    totais=$(printf '%s' "$json" | jq '.items | length' 2>/dev/null || echo 0)
    guardadas=$(printf '%s' "$json" \
      | jq -c --arg re "$CONTAS_DE_INTERESSE" \
          '.items[]? | select(.conta | test($re))' 2>/dev/null \
      | tee -a "$SAIDA" | wc -l)

    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$ano" "$uf" "$ente" "$status" "$totais" "$guardadas" >> "$LOG"
    echo "[$status] $ano $uf — $guardadas de $totais linhas"
    sleep 0.4
  done
done

echo "Linhas guardadas: $(wc -l < "$SAIDA")"
