#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PGDATA_DIR="${PGDATA_DIR:-$(pwd)/.pgdata}"

if ! command -v pg_ctl >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1 && brew list postgresql@16 >/dev/null 2>&1; then
    export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
  fi
fi

if [[ -d "$PGDATA_DIR" ]] && pg_ctl -D "$PGDATA_DIR" status >/dev/null 2>&1; then
  pg_ctl -D "$PGDATA_DIR" stop >/dev/null
  echo "PostgreSQL stopped"
else
  echo "PostgreSQL is not running for $PGDATA_DIR"
fi
