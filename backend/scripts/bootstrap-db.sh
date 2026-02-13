#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PGDATA_DIR="${PGDATA_DIR:-$(pwd)/.pgdata}"
PGPORT="${PGPORT:-5433}"
DB_NAME="${DB_NAME:-snowball_analytics}"
DB_USER="${DB_USER:-$USER}"
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"

ensure_postgres_tools() {
  if command -v initdb >/dev/null 2>&1 && command -v pg_ctl >/dev/null 2>&1; then
    return 0
  fi

  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Install PostgreSQL manually and re-run."
    exit 1
  fi

  if ! brew list postgresql@16 >/dev/null 2>&1; then
    echo "Installing PostgreSQL via Homebrew (postgresql@16)..."
    brew install postgresql@16
  fi

  local pg_bin
  pg_bin="$(brew --prefix postgresql@16)/bin"
  export PATH="$pg_bin:$PATH"

  if ! command -v initdb >/dev/null 2>&1 || ! command -v pg_ctl >/dev/null 2>&1; then
    echo "PostgreSQL tools are still not available on PATH."
    exit 1
  fi
}

ensure_postgres_tools

mkdir -p "$PGDATA_DIR"

if [[ ! -f "$PGDATA_DIR/PG_VERSION" ]]; then
  echo "Initializing PostgreSQL data directory at $PGDATA_DIR"
  initdb -D "$PGDATA_DIR" --locale=en_US.UTF-8 >/dev/null
fi

if ! pg_ctl -D "$PGDATA_DIR" status >/dev/null 2>&1; then
  echo "Starting PostgreSQL on port $PGPORT"
  pg_ctl -D "$PGDATA_DIR" -l "$PGDATA_DIR/postgres.log" -o "-p $PGPORT" start >/dev/null
else
  echo "PostgreSQL is already running"
fi

# Wait for DB readiness
for _ in {1..20}; do
  if pg_isready -h localhost -p "$PGPORT" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

createdb -h localhost -p "$PGPORT" -U "$DB_USER" "$DB_NAME" >/dev/null 2>&1 || true

cat > .env <<ENVVARS
DATABASE_URL="postgresql://$DB_USER@localhost:$PGPORT/$DB_NAME?schema=public"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
ENVVARS

echo "Database ready. Wrote backend/.env with DATABASE_URL on port $PGPORT"
