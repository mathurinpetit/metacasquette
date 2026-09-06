#!/usr/bin/env python3
import os
import sys
from pathlib import Path


GOOGLE_VOICES = {
    "fr": ("fr-FR", "fr-FR-Neural2-D"),
    "en": ("en-US", "en-US-Neural2-D"),
}


def _temporary_path(output_path):
    return Path(str(output_path) + ".tmp")


def _create_google_mp3(text_value, output_path, language, credentials_path):
    from google.cloud import texttospeech
    from google.oauth2 import service_account

    language_code, default_voice = GOOGLE_VOICES[language]
    voice_name = os.environ.get(
        f"METACASQUETTE_GOOGLE_TTS_VOICE_{language.upper()}",
        default_voice,
    )
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = texttospeech.TextToSpeechClient(credentials=credentials)

    try:
        response = client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text_value),
            voice=texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
            ),
            audio_config=texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
            ),
        )
    finally:
        if hasattr(client, "close"):
            client.close()

    temporary_path = _temporary_path(output_path)
    temporary_path.write_bytes(response.audio_content)
    temporary_path.replace(output_path)


def _create_openai_mp3(text_value, output_path, language, openai_client, instructions):
    temporary_path = _temporary_path(output_path)

    with openai_client.audio.speech.with_streaming_response.create(
        model=os.environ.get("METACASQUETTE_OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
        voice=os.environ.get("METACASQUETTE_OPENAI_TTS_VOICE", "coral"),
        input=text_value,
        instructions=instructions,
        response_format="mp3",
    ) as response:
        response.stream_to_file(temporary_path)

    temporary_path.replace(output_path)


def synthesize_speech_to_mp3(
    text_value,
    output_path,
    language,
    google_credentials_path="",
    openai_client=None,
    openai_instructions="",
):
    language = "en" if language == "en" else "fr"
    errors = []

    if google_credentials_path:
        try:
            _create_google_mp3(
                text_value,
                Path(output_path),
                language,
                google_credentials_path,
            )
            return "google"
        except Exception as exc:
            errors.append(f"google:{type(exc).__name__}")
            print(f"Google TTS unavailable: {type(exc).__name__}: {exc}", file=sys.stderr)

    if openai_client is not None:
        try:
            _create_openai_mp3(
                text_value,
                Path(output_path),
                language,
                openai_client,
                openai_instructions,
            )
            return "openai"
        except Exception as exc:
            errors.append(f"openai:{type(exc).__name__}")

    raise RuntimeError("Speech synthesis failed (" + ",".join(errors or ["noProviderConfigured"]) + ")")
