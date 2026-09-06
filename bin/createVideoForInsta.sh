#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ID_USER="${1:-}"

if [[ -z "${ID_USER}" ]]; then
  echo "Usage: bash bin/createVideoForInsta.sh <idUser>" >&2
  exit 1
fi

LAYER_PATH="${ROOT_DIR}/jeudatas/${ID_USER}_layer.png"
CAPTION_PATH="${ROOT_DIR}/jeudatas/${ID_USER}_videoCaption.png"
AUDIO_PATH="${ROOT_DIR}/jeudatas/${ID_USER}_videoInstaMp3.mp3"
OUTPUT_PATH="${ROOT_DIR}/jeudatas/${ID_USER}_insta.mp4"
TEMP_OUTPUT_PATH="${ROOT_DIR}/jeudatas/.${ID_USER}_insta_${$}.tmp.mp4"

cleanup() {
  if [[ -f "${TEMP_OUTPUT_PATH}" ]]; then
    rm -f "${TEMP_OUTPUT_PATH}"
  fi
}

trap cleanup EXIT

if [[ ! -f "${LAYER_PATH}" ]]; then
  echo "Missing image: ${LAYER_PATH}" >&2
  exit 1
fi

wait_for_generated_file() {
  local path="$1"
  local label="$2"

  for _ in $(seq 1 240); do
    if [[ -s "${path}" ]]; then
      return 0
    fi
    sleep 1
  done

  echo "Missing ${label} after waiting: ${path}" >&2
  return 1
}

wait_for_generated_file "${CAPTION_PATH}" "caption"
wait_for_generated_file "${AUDIO_PATH}" "audio"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required." >&2
  exit 1
fi

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe is required." >&2
  exit 1
fi

DURATION="$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${AUDIO_PATH}" | awk '{print int($1 + 1)}')"

if [[ -z "${DURATION}" || "${DURATION}" -le 0 ]]; then
  DURATION=6
fi

VIDEO_FILTER="color=c=black:s=1080x1920:d=${DURATION}[bg];[0:v]scale=920:900:force_original_aspect_ratio=decrease,format=rgba[cap];[1:v]scale=1000:480:force_original_aspect_ratio=decrease,format=rgba[caption];[bg][cap]overlay=(W-w)/2:270:shortest=1[withcap];[withcap][caption]overlay=(W-w)/2:1260:shortest=1,format=yuv420p[v]"

ffmpeg -y \
  -loop 1 -t "${DURATION}" -i "${LAYER_PATH}" \
  -loop 1 -t "${DURATION}" -i "${CAPTION_PATH}" \
  -i "${AUDIO_PATH}" \
  -filter_complex "${VIDEO_FILTER}" \
  -map "[v]" \
  -map 2:a \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -c:a aac \
  -ar 48000 \
  -b:a 128k \
  -r 25 \
  -movflags +faststart \
  -shortest \
  "${TEMP_OUTPUT_PATH}" >/dev/null

mv -f "${TEMP_OUTPUT_PATH}" "${OUTPUT_PATH}"

# Runs in the existing background video job, after the MP4 is complete.
python3 "${ROOT_DIR}/bin/instagram_reel.py" --publish "${ID_USER}" --auto
