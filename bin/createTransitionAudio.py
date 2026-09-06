#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path

from openai import OpenAI

from metacasquette_tts import synthesize_speech_to_mp3


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "public" / "sound"
TRANSITIONS = {
    "fr": {
        "text": (
            "J’ai bien pris en compte ce que tu m’as dit. "
            "Je vais créer la MétaCasquette que tu demandes. "
            "J’ai besoin d’un petit instant, reste en ligne…"
        ),
        "instructions": (
            "Parle naturellement en français avec une voix chaleureuse et rassurante "
            "d’animateur de jeu. Marque une courte pause entre chaque phrase."
        ),
    },
    "en": {
        "text": (
            "I’ve taken into account what you told me. "
            "I’m going to create the MetaCasquette you asked for. "
            "I just need a moment, stay with me…"
        ),
        "instructions": (
            "Speak naturally in English with a warm, reassuring game host voice. "
            "Pause briefly between each sentence."
        ),
    },
}

INSTAGRAM_INVITATIONS = {
    "fr": {
        "text": (
            "Viens découvrir sur Instagram le résultat de la MétaCasquette "
            "que tu as créée !"
        ),
        "instructions": (
            "Parle naturellement en français avec une voix chaleureuse, enthousiaste "
            "et complice d’animateur de jeu."
        ),
    },
    "en": {
        "text": (
            "Come and discover the result of the MetaCasquette you created on Instagram!"
        ),
        "instructions": (
            "Speak naturally in English with a warm, enthusiastic and friendly game host voice."
        ),
    },
}


INTRODUCTIONS = {
    "fr": {
        "intro1": "Bonjour, la participation au jeu est très simple : Dans un premier temps, je te conseille de monter le volume de ton téléphone afin de mieux communiquer avec moi ! Je te propose de créer ta propre MétaCasquette. Si elle est réussie, je la fabriquerai dans la vraie vie et tu pourras la gagner !",
        "intro2": "Pour concevoir ta propre MétaCasquette, tu auras juste à me dire quel est ton prénom et ce que tu aimes dans la vie. Je m'occupe du reste !",
        "speak_explaination": "Clique sur le cercle pour parler. Donne-moi ton prénom et ce que tu aimes dans la vie. Tu peux dire ce que tu veux, cela pourrait être : je m’appelle Francis et j’aime les assiettes, ou encore : je suis Anna et j’aime les guitares.",
    },
    "en": {
        "intro1": "Hello, participating in the game is very simple: First of all, we advise you to turn up the volume on your phone in order to better communicate with me! You will create your own MetaCasquette. If it is successful, I will make it in real life and you can win it!",
        "intro2": "To design your own MetaCasquette, you just have to tell me what your first name is and what you love in life. I take care of the rest!",
        "speak_explaination": "Tap the circle to speak. Tell me your first name and what you love in life. You can say: my name is Francis and I love plates, or: I am Anna and I love guitars.",
    },
}


def main():
    parser = argparse.ArgumentParser(description="Generate the game's fixed messages with the same TTS helper as the result.")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--google-only", action="store_true", help="Fail instead of switching to a different voice provider.")
    parser.add_argument("--message", choices=["intro1", "intro2", "speak_explaination", "transitionSendingRecord", "selfieInstagram"], help="Generate only this message in both languages.")
    args = parser.parse_args()
    openai_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("APP_OPENAIKEY")
    google_credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or os.environ.get("APP_GOOGLEAPIFILE", "")

    if not google_credentials_path and (args.google_only or not openai_key):
        print("Set APP_GOOGLEAPIFILE before generating Google game audio.", file=sys.stderr)
        return 2

    client = OpenAI(api_key=openai_key) if openai_key and not args.google_only else None
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for language, introductions in INTRODUCTIONS.items():
        messages = dict(introductions)
        messages["transitionSendingRecord"] = TRANSITIONS[language]["text"]
        messages["selfieInstagram"] = INSTAGRAM_INVITATIONS[language]["text"]
        for stem, text in messages.items():
            if args.message and stem != args.message:
                continue
            output_path = args.output_dir / f"{stem}_{language}.mp3"
            provider = synthesize_speech_to_mp3(
                text,
                output_path,
                language,
                google_credentials_path=google_credentials_path,
                openai_client=client,
                openai_instructions=TRANSITIONS[language]["instructions"],
            )
            print(f"{output_path.name} ({provider})", flush=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
