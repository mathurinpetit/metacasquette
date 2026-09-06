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
  bash bin/test_metacasquette_from_audio.sh <audio_file> [fr|en] [test_id]

Description:
  Teste exactement le pipeline MetaCasquette utilise par le jeu :
  1. conversion et sauvegarde de l'enregistrement original en MP3
  2. identification du nom et de ce que la personne aime
  3. creation du PNG transparent, du PNG sur fond noir et des MP3 OpenAI
  4. creation et verification de la video verticale avec ffmpeg

Environment:
  OPENAI_API_KEY ou APP_OPENAIKEY dans .env.local / .env

Example:
  bash bin/test_metacasquette_from_audio.sh /tmp/test.webm fr cli_demo_001
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

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

AUDIO_INPUT="$1"
LANGUAGE="${2:-fr}"
TEST_ID="${3:-cli_$(date +%Y%m%d_%H%M%S)}"
VIDEO_SCRIPT="${ROOT_DIR}/bin/createVideoForInsta.sh"
VIDEO_PATH="${ROOT_DIR}/jeudatas/${TEST_ID}_insta.mp4"
VIDEO_LOG="${ROOT_DIR}/jeudatas/${TEST_ID}_video_job.log"

if [[ "${LANGUAGE}" != "fr" && "${LANGUAGE}" != "en" ]]; then
  echo "Language must be 'fr' or 'en'." >&2
  exit 1
fi

if [[ ! -f "${AUDIO_INPUT}" ]]; then
  echo "Audio file not found: ${AUDIO_INPUT}" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffmpeg and ffprobe are required." >&2
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
  echo "Install them with: ${ROOT_DIR}/.venv-metacasquette-ai/bin/pip install -r ${ROOT_DIR}/requirements-ai.txt" >&2
  exit 1
fi

PIPELINE_JSON="$(PYTHON_BIN="${PYTHON_BIN}" bash "${ROOT_DIR}/bin/process_metacasquette_audio.sh" "${AUDIO_INPUT}" "${LANGUAGE}" "${TEST_ID}" "${OPENAI_KEY}" "" "${VIDEO_SCRIPT}")"

PIPELINE_SUCCESS="$(printf '%s' "${PIPELINE_JSON}" | php -r '$data=json_decode(stream_get_contents(STDIN), true); echo !empty($data["success"]) ? "1" : "0";')"
if [[ "${PIPELINE_SUCCESS}" != "1" ]]; then
  printf '%s\n' "${PIPELINE_JSON}"
  exit 1
fi

video_is_valid() {
  [[ -s "${VIDEO_PATH}" ]] && ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${VIDEO_PATH}" >/dev/null 2>&1
}

for _attempt in $(seq 1 30); do
  if video_is_valid; then
    break
  fi
  sleep 1
done

if ! video_is_valid; then
  bash "${VIDEO_SCRIPT}" "${TEST_ID}"
fi

if ! video_is_valid; then
  echo "Video was not generated: ${VIDEO_PATH}" >&2
  if [[ -f "${VIDEO_LOG}" ]]; then
    tail -n 30 "${VIDEO_LOG}" >&2
  fi
  exit 1
fi

VIDEO_DURATION="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${VIDEO_PATH}")"
VIDEO_DIMENSIONS="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${VIDEO_PATH}")"

php -r '
  $pipeline = json_decode($argv[1], true);
  if (!is_array($pipeline)) {
    fwrite(STDERR, "Invalid pipeline JSON".PHP_EOL);
    exit(1);
  }

  $pipeline["id"] = $argv[2];
  $pipeline["language"] = $argv[3];
  $pipeline["videoPath"] = $argv[4];
  $pipeline["videoDuration"] = (float) $argv[5];
  $pipeline["videoDimensions"] = $argv[6];
  echo json_encode($pipeline, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE).PHP_EOL;
' "${PIPELINE_JSON}" "${TEST_ID}" "${LANGUAGE}" "${VIDEO_PATH}" "${VIDEO_DURATION}" "${VIDEO_DIMENSIONS}"
