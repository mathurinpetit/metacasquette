#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-}"

if [[ -z "${PYTHON_BIN}" && -x "${ROOT_DIR}/.venv-metacasquette-ai/bin/python3" ]]; then
  PYTHON_BIN="${ROOT_DIR}/.venv-metacasquette-ai/bin/python3"
fi

if [[ -z "${PYTHON_BIN}" ]]; then
  PYTHON_BIN="python3"
fi

usage() {
  cat <<'EOF'
Usage:
  bash bin/test_metacasquette_assets.sh <name> <whatilove> [fr|en] [test_id]

Examples:
  bash bin/test_metacasquette_assets.sh Camille stylos fr
  bash bin/test_metacasquette_assets.sh Steve "video games" en cli_assets_001
EOF
}

read_dotenv_value() {
  local key="$1"
  local file=""
  local line=""
  local value=""

  for file in "${ROOT_DIR}/.env.local" "${ROOT_DIR}/.env"; do
    if [[ ! -f "${file}" ]]; then
      continue
    fi

    line="$(grep -E "^${key}=" "${file}" | tail -n 1 || true)"
    if [[ -z "${line}" ]]; then
      continue
    fi

    value="${line#*=}"
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    printf '%s' "${value}"
    return 0
  done

  return 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 2 ]]; then
  usage
  exit 0
fi

NAME="$1"
WHAT_I_LOVE="$2"
LANGUAGE="${3:-fr}"
TEST_ID="${4:-cli_assets_$(date +%Y%m%d_%H%M%S)}"
VIDEO_SCRIPT="${ROOT_DIR}/bin/createVideoForInsta.sh"

if [[ "${LANGUAGE}" != "fr" && "${LANGUAGE}" != "en" ]]; then
  echo "Language must be 'fr' or 'en'." >&2
  exit 1
fi

OPENAI_KEY="${OPENAI_API_KEY:-}"
if [[ -z "${OPENAI_KEY}" ]]; then
  OPENAI_KEY="$(read_dotenv_value "APP_OPENAIKEY" || true)"
fi

if [[ -z "${OPENAI_KEY}" ]]; then
  echo "OpenAI key not found. Set OPENAI_API_KEY or APP_OPENAIKEY in .env.local." >&2
  exit 1
fi

if ! "${PYTHON_BIN}" -c 'import openai, PIL, rembg' >/dev/null 2>&1; then
  echo "Python AI dependencies are missing for ${PYTHON_BIN}." >&2
  echo "Install them with:" >&2
  echo "  cd ${ROOT_DIR} && python3 -m venv .venv-metacasquette-ai && .venv-metacasquette-ai/bin/pip install --upgrade pip && .venv-metacasquette-ai/bin/pip install -r requirements-ai.txt" >&2
  exit 1
fi

"${PYTHON_BIN}" "${ROOT_DIR}/bin/createMetacasquetteAssets.py" \
  "${OPENAI_KEY}" \
  "" \
  "${TEST_ID}" \
  "${NAME}" \
  "${WHAT_I_LOVE}" \
  "${LANGUAGE}" \
  "${VIDEO_SCRIPT}"
