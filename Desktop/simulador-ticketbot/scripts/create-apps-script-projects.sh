#!/usr/bin/env bash
# Crea los proyectos Apps Script DEV y PROD con clasp y sube el código.
# Requisitos:
#   1) Habilitar Apps Script API: https://script.google.com/home/usersettings
#   2) npx clasp login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLASP="$ROOT/node_modules/.bin/clasp"

if [[ ! -x "$CLASP" ]]; then
  echo "Instalando clasp..."
  (cd "$ROOT" && npm install)
fi

if ! "$CLASP" show-authorized-user --json 2>/dev/null | grep -q '"loggedIn": true'; then
  echo "No hay sesión de Google."
  echo "Ejecuta primero:"
  echo "  cd \"$ROOT\""
  echo "  npx clasp login"
  echo "Luego vuelve a correr este script."
  exit 1
fi

create_and_push() {
  local env_name="$1"
  local title="$2"
  local dir="$ROOT/apps-script/$env_name"

  echo ""
  echo "=== Creando proyecto $env_name: $title ==="
  cd "$dir"

  if [[ -f .clasp.json ]]; then
    echo "Ya existe .clasp.json en $env_name. Se omite create y se hace push."
  else
    # Guarda archivos locales: clasp create puede sobrescribir appsscript.json
    mkdir -p .backup
    cp -f appsscript.json Code.gs Config.gs Orchestrator.gs Ticketing.gs .backup/ 2>/dev/null || true

    "$CLASP" create-script --title "$title" --type standalone --rootDir .

    # Restaura nuestro manifest/código si clasp generó stubs
    cp -f .backup/* . 2>/dev/null || true
  fi

  "$CLASP" push --force

  local script_id
  script_id="$(node -e "console.log(JSON.parse(require('fs').readFileSync('.clasp.json','utf8')).scriptId)")"
  local url="https://script.google.com/d/${script_id}/edit"
  echo "OK $env_name → $url"
  echo "$url" > "$dir/SCRIPT_URL.txt"
}

create_and_push "dev" "Prometeo Aprobologia DEV"
create_and_push "prod" "Prometeo Aprobologia PROD"

echo ""
echo "=============================="
echo "Proyectos listos"
echo "DEV:  $(cat "$ROOT/apps-script/dev/SCRIPT_URL.txt")"
echo "PROD: $(cat "$ROOT/apps-script/prod/SCRIPT_URL.txt")"
echo "=============================="
echo "Copia esos links al PRD (Link de AppScript Dev / Prod)."
