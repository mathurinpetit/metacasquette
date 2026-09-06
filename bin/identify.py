#!/usr/bin/env python3
import json
import sys

from openai import OpenAI


def transcribe_user_audio(client, audio_path):
    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )

    return response.text


def extract_user_choice(client, user_text):
    system_prompt = (
        "You are a helpful assistant designed to output JSON. "
        "The output JSON has 'name' and 'whatilove'. The first parameter "
        "'name' is the name of the user. The second parameter 'whatilove' "
        "is what the user says they love, in a maximum of 4 words without articles."
    )
    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "The name and the theme: " + user_text},
        ],
    )

    result = json.loads(response.choices[0].message.content)
    name = str(result.get("name", "")).strip()
    what_i_love = str(result.get("whatilove", "")).strip()

    if not name or not what_i_love:
        raise ValueError("OpenAI response is missing name or whatilove")

    return {"name": name, "whatilove": what_i_love}


def build_response_payload(user_choice, file_id, language):
    name = user_choice["name"]
    what_i_love = user_choice["whatilove"]

    if language == "en":
        response_text = (
            f"In any case, what a great idea {name} ! {what_i_love}, you love, "
            f"{what_i_love}, you will have ! I can't wait to build this awesome "
            f"{what_i_love} MetaCasquette."
        )
        response_sections = (
            "<p class='animate-text animate-text-response'>In any case, what a great idea </p>"
            f"<p class='animate-text animate-text-response warm'>{name} !</p>"
            f"<p class='animate-text animate-text-response highlight'>{what_i_love},</p>"
            "<p class='animate-text animate-text-response'> you love, </p>"
            f"<p class='animate-text animate-text-response highlight'>{what_i_love},</p>"
            "<p class='animate-text animate-text-response'> you will have !</p>"
            "<p class='animate-text animate-text-response'>I can't wait to build this awesome </p>"
            f"<p class='animate-text animate-text-response highlight'>{what_i_love}</p>"
            "<p class='animate-text animate-text-response lastOne'>MetaCasquette !</p>"
        )
        ready_sections = (
            f"<p class='animate-text animate-text-ready warm'>{name},</p>"
            "<p class='animate-text animate-text-ready'>your MetaCasquette built in</p>"
            f"<p class='animate-text animate-text-ready highlight'>{what_i_love}</p>"
            "<p class='animate-text animate-text-ready lastOne'>is ready !</p>"
        )
    else:
        response_text = (
            f"Mais quelle bonne idée {name} ! {what_i_love}, tu aimes, "
            f"{what_i_love}, tu auras ! J'ai hâte de construire cette superbe "
            f"MétaCasquette en {what_i_love} !"
        )
        response_sections = (
            "<p class='animate-text animate-text-response'>Mais quelle bonne idée </p>"
            f"<p class='animate-text animate-text-response warm'>{name}!</p>"
            f"<p class='animate-text animate-text-response highlight'>{what_i_love},</p>"
            "<p class='animate-text animate-text-response'> tu aimes, </p>"
            f"<p class='animate-text animate-text-response highlight'>{what_i_love},</p>"
            "<p class='animate-text animate-text-response'> tu auras ! </p>"
            "<p class='animate-text animate-text-response'>J'ai hâte de construire cette superbe MétaCasquette en </p>"
            f"<p class='animate-text animate-text-response highlight lastOne'>{what_i_love}</p>"
        )
        ready_sections = (
            f"<p class='animate-text animate-text-ready warm'>{name},</p>"
            "<p class='animate-text animate-text-ready'>ta MétaCasquette en</p>"
            f"<p class='animate-text animate-text-ready highlight'>{what_i_love}</p>"
            "<p class='animate-text animate-text-ready lastOne'>est prête !</p>"
        )

    return {
        **user_choice,
        "textReponse": response_text,
        "textReponseSections": response_sections,
        "textReadySections": ready_sections,
        "idUser": file_id,
    }


def main():
    if len(sys.argv) < 6:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "Usage: identify.py <openai_key> <legacy_unused_arg> <id> <audio_file> <language>",
                }
            )
        )
        return 2

    openai_key = sys.argv[1]
    # sys.argv[2] remains reserved for the legacy Google credentials argument so
    # existing PHP and shell callers keep the same command-line contract.
    file_id = sys.argv[3]
    audio_path = sys.argv[4]
    language = "en" if sys.argv[5] == "en" else "fr"

    client = OpenAI(api_key=openai_key)
    transcript = transcribe_user_audio(client, audio_path)
    user_choice = extract_user_choice(client, transcript)
    payload = build_response_payload(user_choice, file_id, language)
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
