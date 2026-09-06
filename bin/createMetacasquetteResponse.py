#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

from openai import OpenAI

from metacasquette_tts import synthesize_speech_to_mp3


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "jeudatas"


def build_response_text(name, theme, language):
    if language == "en":
        return (
            f"Thank you {name}, I am preparing your {theme} MetaCasquette. "
            "Meanwhile, take a look at what the other players have made."
        )

    return (
        f"Merci {name}, je suis en train de préparer ta MétaCasquette en {theme}. "
        "En attendant, regarde ce que les autres ont fait."
    )


def main():
    if len(sys.argv) < 6:
        print(json.dumps({
            "success": "0",
            "error": "Usage: createMetacasquetteResponse.py <openai_key> <id> <name> <theme> <language> [google_credentials]",
        }))
        return 2

    openai_key = sys.argv[1]
    file_id = sys.argv[2]
    name = sys.argv[3]
    theme = sys.argv[4]
    language = "en" if sys.argv[5] == "en" else "fr"
    google_credentials_path = sys.argv[6] if len(sys.argv) > 6 else ""
    response_text = build_response_text(name, theme, language)
    output_path = OUTPUT_DIR / f"{file_id}_response.mp3"
    instructions = (
        "Speak naturally in English with a warm, reassuring game host voice."
        if language == "en"
        else "Parle naturellement en français, avec une voix chaleureuse et rassurante d'animateur de jeu."
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=openai_key)

    tts_provider = synthesize_speech_to_mp3(
        response_text,
        output_path,
        language,
        google_credentials_path=google_credentials_path,
        openai_client=client,
        openai_instructions=instructions,
    )

    print(json.dumps({
        "success": "1",
        "responseText": response_text,
        "responseMp3": str(output_path.relative_to(ROOT_DIR)),
        "ttsProvider": tts_provider,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
