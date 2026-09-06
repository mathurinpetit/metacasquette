#!/usr/bin/env bash
set -u
set +e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-}"
PHP_BIN="${PHP_BIN:-/usr/bin/php}"
TMP_DIR=""

cleanup() {
  if [[ -n "${TMP_DIR}" && -d "${TMP_DIR}" ]]; then
    rm -rf "${TMP_DIR}"
  fi
}

trap cleanup EXIT

json_escape() {
  "${PHP_BIN}" -r 'echo json_encode($argv[1], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);' "$1"
}

emit_failure() {
  local stage="$1"
  local exit_code="$2"
  local stderr_text="$3"
  local raw_result="$4"
  local audio_input="$5"

  printf '{'
  printf '"success":false,'
  printf '"stage":%s,' "$(json_escape "${stage}")"
  printf '"exitCode":%s,' "$(json_escape "${exit_code}")"
  printf '"stderr":%s,' "$(json_escape "${stderr_text}")"
  printf '"rawResult":%s,' "$(json_escape "${raw_result}")"
  printf '"audioInput":%s' "$(json_escape "${audio_input}")"
  printf '}\n'
}

if [[ -z "${PYTHON_BIN}" && -x "${ROOT_DIR}/.venv-metacasquette-ai/bin/python3" ]]; then
  PYTHON_BIN="${ROOT_DIR}/.venv-metacasquette-ai/bin/python3"
fi

if [[ -z "${PYTHON_BIN}" ]]; then
  PYTHON_BIN="python3"
fi

if [[ $# -lt 5 ]]; then
  emit_failure "usage" "2" "Usage: process_metacasquette_audio.sh <audio_input> <language> <recording_id> <openai_key> <google_credentials> [video_script] [sync|async]" "" ""
  exit 0
fi

AUDIO_INPUT="$1"
LANGUAGE="$2"
RECORDING_ID="$3"
OPENAI_KEY="$4"
GOOGLE_CREDENTIALS_PATH="$5"
VIDEO_SCRIPT="${6:-${ROOT_DIR}/bin/createVideoForInsta.sh}"
PROCESS_MODE="${7:-sync}"
FFMPEG_BIN="${FFMPEG_BIN:-/usr/bin/ffmpeg}"

if [[ ! -f "${AUDIO_INPUT}" ]]; then
  emit_failure "input" "2" "Audio file not found" "" "${AUDIO_INPUT}"
  exit 0
fi

if [[ ! -x "${PYTHON_BIN}" && "${PYTHON_BIN}" != "python3" ]]; then
  emit_failure "python" "2" "Python binary not executable" "" "${AUDIO_INPUT}"
  exit 0
fi

TMP_DIR="$(mktemp -d /tmp/metacasquette-process.XXXXXX)"
TMP_WAV="${TMP_DIR}/input.wav"
CONVERSION_STDERR="${TMP_DIR}/ffmpeg.stderr"
MP3_CONVERSION_STDERR="${TMP_DIR}/ffmpeg-mp3.stderr"
IDENTIFY_STDERR="${TMP_DIR}/identify.stderr"
ASSETS_STDERR="${TMP_DIR}/assets.stderr"
RESPONSE_STDERR="${TMP_DIR}/response.stderr"
RECORDING_MP3_RELATIVE="jeudatas/${RECORDING_ID}_recording.mp3"
RECORDING_MP3="${ROOT_DIR}/${RECORDING_MP3_RELATIVE}"
IDENTIFY_METADATA="${ROOT_DIR}/jeudatas/${RECORDING_ID}_identify.json"
ASSETS_JOB_RESULT="${ROOT_DIR}/jeudatas/${RECORDING_ID}_assets_job.json"
ASSETS_JOB_LOG="${ROOT_DIR}/jeudatas/${RECORDING_ID}_assets_job.log"

INPUT_EXTENSION="${AUDIO_INPUT##*.}"
INPUT_EXTENSION="$(printf '%s' "${INPUT_EXTENSION}" | tr '[:upper:]' '[:lower:]')"

if [[ "${INPUT_EXTENSION}" == "wav" ]]; then
  cp "${AUDIO_INPUT}" "${TMP_WAV}"
else
  "${FFMPEG_BIN}" -y -i "${AUDIO_INPUT}" -ar 44100 -ac 2 "${TMP_WAV}" >/dev/null 2>"${CONVERSION_STDERR}"
  CONVERSION_EXIT=$?

  if [[ ${CONVERSION_EXIT} -ne 0 || ! -s "${TMP_WAV}" ]]; then
    STDERR_TEXT="$(cat "${CONVERSION_STDERR}" 2>/dev/null || true)"
    emit_failure "conversion" "${CONVERSION_EXIT}" "${STDERR_TEXT}" "" "${AUDIO_INPUT}"
    exit 0
  fi
fi

"${FFMPEG_BIN}" -y -i "${TMP_WAV}" -vn -codec:a libmp3lame -q:a 2 "${RECORDING_MP3}" >/dev/null 2>"${MP3_CONVERSION_STDERR}"
MP3_CONVERSION_EXIT=$?

if [[ ${MP3_CONVERSION_EXIT} -ne 0 || ! -s "${RECORDING_MP3}" ]]; then
  STDERR_TEXT="$(cat "${MP3_CONVERSION_STDERR}" 2>/dev/null || true)"
  emit_failure "recording-mp3" "${MP3_CONVERSION_EXIT}" "${STDERR_TEXT}" "" "${AUDIO_INPUT}"
  exit 0
fi

IDENTIFY_JSON="$("${PYTHON_BIN}" "${ROOT_DIR}/bin/identify.py" "${OPENAI_KEY}" "${GOOGLE_CREDENTIALS_PATH}" "${RECORDING_ID}" "${TMP_WAV}" "${LANGUAGE}" 2>"${IDENTIFY_STDERR}")"
IDENTIFY_EXIT=$?

if [[ ${IDENTIFY_EXIT} -ne 0 || -z "${IDENTIFY_JSON}" ]]; then
  STDERR_TEXT="$(cat "${IDENTIFY_STDERR}" 2>/dev/null || true)"
  emit_failure "identify" "${IDENTIFY_EXIT}" "${STDERR_TEXT}" "${IDENTIFY_JSON}" "${AUDIO_INPUT}"
  exit 0
fi

NAME="$(printf '%s' "${IDENTIFY_JSON}" | "${PHP_BIN}" -r '$data=json_decode(stream_get_contents(STDIN), true); if (!is_array($data) || !isset($data["name"])) { exit(2); } echo $data["name"];')"
NAME_EXIT=$?
WHAT_I_LOVE="$(printf '%s' "${IDENTIFY_JSON}" | "${PHP_BIN}" -r '$data=json_decode(stream_get_contents(STDIN), true); if (!is_array($data) || !isset($data["whatilove"])) { exit(2); } echo $data["whatilove"];')"
WHAT_EXIT=$?

if [[ ${NAME_EXIT} -ne 0 || ${WHAT_EXIT} -ne 0 || -z "${NAME}" || -z "${WHAT_I_LOVE}" ]]; then
  emit_failure "identify-json" "2" "identify.py returned invalid JSON" "${IDENTIFY_JSON}" "${AUDIO_INPUT}"
  exit 0
fi

IDENTIFY_METADATA_TEMP="${IDENTIFY_METADATA}.tmp.$$"
printf '%s\n' "${IDENTIFY_JSON}" > "${IDENTIFY_METADATA_TEMP}"
mv -f "${IDENTIFY_METADATA_TEMP}" "${IDENTIFY_METADATA}"

if [[ "${PROCESS_MODE}" == "async" ]]; then
  RESPONSE_JSON="$("${PYTHON_BIN}" "${ROOT_DIR}/bin/createMetacasquetteResponse.py" "${OPENAI_KEY}" "${RECORDING_ID}" "${NAME}" "${WHAT_I_LOVE}" "${LANGUAGE}" "${GOOGLE_CREDENTIALS_PATH}" 2>"${RESPONSE_STDERR}")"
  RESPONSE_EXIT=$?
  RESPONSE_SUCCESS="$(printf '%s' "${RESPONSE_JSON}" | "${PHP_BIN}" -r '$data=json_decode(stream_get_contents(STDIN), true); echo is_array($data) && !empty($data["success"]) ? "1" : "0";')"

  if [[ ${RESPONSE_EXIT} -ne 0 || "${RESPONSE_SUCCESS}" != "1" ]]; then
    STDERR_TEXT="$(cat "${RESPONSE_STDERR}" 2>/dev/null || true)"
    emit_failure "response-audio" "${RESPONSE_EXIT}" "${STDERR_TEXT}" "${RESPONSE_JSON}" "${AUDIO_INPUT}"
    exit 0
  fi

  nohup "${PYTHON_BIN}" "${ROOT_DIR}/bin/createMetacasquetteAssets.py" \
    "${OPENAI_KEY}" "${GOOGLE_CREDENTIALS_PATH}" "${RECORDING_ID}" "${NAME}" "${WHAT_I_LOVE}" "${LANGUAGE}" "${VIDEO_SCRIPT}" \
    >"${ASSETS_JOB_RESULT}" 2>"${ASSETS_JOB_LOG}" </dev/null &
  ASSETS_PID=$!

  "${PHP_BIN}" -r '
    $identify = json_decode($argv[1], true);
    $response = json_decode($argv[2], true);
    if (!is_array($identify) || !is_array($response)) {
      echo json_encode(["success" => false, "stage" => "async-json-merge"]);
      exit(0);
    }

    echo json_encode([
      "success" => true,
      "identify" => $identify,
      "assets" => $response,
      "assetsPending" => true,
      "assetsPid" => (int) $argv[3],
      "audioInput" => $argv[4],
      "recordingMp3" => $argv[5],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  ' "${IDENTIFY_JSON}" "${RESPONSE_JSON}" "${ASSETS_PID}" "${AUDIO_INPUT}" "${RECORDING_MP3_RELATIVE}"
  exit 0
fi

ASSETS_JSON="$("${PYTHON_BIN}" "${ROOT_DIR}/bin/createMetacasquetteAssets.py" "${OPENAI_KEY}" "${GOOGLE_CREDENTIALS_PATH}" "${RECORDING_ID}" "${NAME}" "${WHAT_I_LOVE}" "${LANGUAGE}" "${VIDEO_SCRIPT}" 2>"${ASSETS_STDERR}")"
ASSETS_EXIT=$?

if [[ ${ASSETS_EXIT} -ne 0 || -z "${ASSETS_JSON}" ]]; then
  STDERR_TEXT="$(cat "${ASSETS_STDERR}" 2>/dev/null || true)"
  emit_failure "assets" "${ASSETS_EXIT}" "${STDERR_TEXT}" "${ASSETS_JSON}" "${AUDIO_INPUT}"
  exit 0
fi

"${PHP_BIN}" -r '
  $identify = json_decode($argv[1], true);
  $assets = json_decode($argv[2], true);
  if (!is_array($identify) || !is_array($assets)) {
    echo json_encode([
      "success" => false,
      "stage" => "json-merge",
      "exitCode" => 2,
      "stderr" => "Invalid JSON returned by identify.py or createMetacasquetteAssets.py",
      "rawResult" => ["identify" => $argv[1], "assets" => $argv[2]],
      "audioInput" => $argv[3],
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
  }

  echo json_encode([
    "success" => true,
    "identify" => $identify,
    "assets" => $assets,
    "audioInput" => $argv[3],
    "recordingMp3" => $argv[4],
  ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
' "${IDENTIFY_JSON}" "${ASSETS_JSON}" "${AUDIO_INPUT}" "${RECORDING_MP3_RELATIVE}"
