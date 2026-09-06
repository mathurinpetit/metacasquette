#!/usr/bin/env python3
import base64
import json
import os
import random
import subprocess
import sys
from pathlib import Path

from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont
from rembg import remove

from metacasquette_tts import synthesize_speech_to_mp3


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "jeudatas"
DEFAULT_PROMPT_MODE = os.environ.get("METACASQUETTE_PROMPT_MODE", "legacy")
DEFAULT_IMAGE_MODEL = os.environ.get("METACASQUETTE_IMAGE_MODEL", "gpt-image-2")


def normalize_language(value):
    return "en" if value == "en" else "fr"


def build_legacy_cap_prompt(theme):
    return (
        f"Product photo of a baseball cap made entirely from {theme}. "
        f"The cap floats in front view on a pure white background, well lit, with no floor and no surrounding shadow. "
        f"The visor points forward and there is only one visor. "
        f"The cap keeps the rounded volume of a classic baseball cap but it is entirely built from large, visible, upcycled pieces of {theme}. "
        f"Use around 6 to 10 big pieces of {theme}, clearly identifiable, with different sizes and volumes. "
        f"The final object must feel believable, sculptural, upcycled, rounded and frontal."
    )


def build_fast_cap_prompt(theme):
    return (
        f"Studio packshot of an upcycled baseball cap made of {theme}. "
        f"Centered, front view, white background, single visor forward, crisp lighting, no shadow, no hands, no person. "
        f"The object is realistic, premium, rounded and entirely assembled from clearly recognizable pieces of {theme}."
    )


def build_prompt(theme, prompt_mode):
    if prompt_mode == "fast":
        return build_fast_cap_prompt(theme)

    return build_legacy_cap_prompt(theme)


def create_mp3(client, file_id, text_value, suffix, language, google_credentials_path):
    output_path = OUTPUT_DIR / f"{file_id}_{suffix}.mp3"
    instructions = (
        "Speak naturally in English with a warm, enthusiastic game host voice."
        if language == "en"
        else "Parle naturellement en francais, avec une voix chaleureuse et enthousiaste d'animateur de jeu."
    )

    provider = synthesize_speech_to_mp3(
        text_value,
        output_path,
        language,
        google_credentials_path=google_credentials_path,
        openai_client=client,
        openai_instructions=instructions,
    )

    return output_path, provider


def create_all_audio_files(
    client,
    file_id,
    texts,
    language,
    google_credentials_path,
    warnings,
):
    audio_files = {}
    providers = set()
    audio_specs = (
        ("videoInstaMp3", texts["videoVoiceover"], "videoInstaMp3"),
        ("responseMp3", texts["response"], "response"),
        ("smallDescriptionMp3", texts["smallDescription"], "smallDescription"),
        ("readyMp3", texts["ready"], "ready"),
    )

    try:
        for result_key, text_value, suffix in audio_specs:
            existing_path = OUTPUT_DIR / f"{file_id}_{suffix}.mp3"

            if result_key == "responseMp3" and existing_path.is_file() and existing_path.stat().st_size > 0:
                audio_files[result_key] = existing_path
            else:
                audio_path, provider = create_mp3(
                    client,
                    file_id,
                    text_value,
                    suffix,
                    language,
                    google_credentials_path,
                )
                audio_files[result_key] = audio_path
                providers.add(provider)

                if provider == "openai" and google_credentials_path:
                    warnings.append(f"googleTtsFallback:{suffix}")

        return audio_files, "+".join(sorted(providers)) if providers else "existing"
    except Exception as exc:
        warnings.append(f"speechTtsFailed:{type(exc).__name__}")
        return {}, "unavailable"


def download_generated_image(client, prompt_value, output_path):
    result = client.images.generate(
        model=DEFAULT_IMAGE_MODEL,
        prompt=prompt_value,
        n=1,
        size="1024x1024",
        quality=os.environ.get("METACASQUETTE_IMAGE_QUALITY", "medium"),
        background="transparent",
        output_format="png",
    )
    image_base64 = result.data[0].b64_json

    if not image_base64:
        raise ValueError("OpenAI image response did not contain b64_json")

    Path(output_path).write_bytes(base64.b64decode(image_base64, validate=True))


def remove_background_and_crop(source_path, cropped_path, layer_path):
    source_image = Image.open(source_path).convert("RGBA")
    alpha_minimum, _ = source_image.getchannel("A").getextrema()

    if alpha_minimum < 255:
        background_removed = source_image
    else:
        background_removed = remove(source_image)

    background_removed.save(cropped_path)
    bbox = background_removed.getbbox()

    if bbox:
        final_image = background_removed.crop(bbox)
    else:
        final_image = background_removed

    final_image.save(layer_path)


def create_black_background_image(layer_path, output_path):
    canvas_width = 1080
    canvas_height = 1920
    max_cap_width = 900
    max_cap_height = 1500

    with Image.open(layer_path).convert("RGBA") as layer:
        layer.thumbnail((max_cap_width, max_cap_height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 255))
        x_position = (canvas_width - layer.width) // 2
        y_position = (canvas_height - layer.height) // 2
        canvas.alpha_composite(layer, (x_position, y_position))
        canvas.convert("RGB").save(output_path, "PNG")


def wrap_caption_text(draw, text_value, font, max_width):
    lines = []
    current_line = ""

    for word in text_value.split():
        candidate = f"{current_line} {word}".strip()
        candidate_width = draw.textbbox((0, 0), candidate, font=font, stroke_width=1)[2]

        if current_line and candidate_width > max_width:
            lines.append(current_line)
            current_line = word
        else:
            current_line = candidate

    if current_line:
        lines.append(current_line)

    return lines


def create_video_caption_image(text_value, output_path):
    width = 1000
    height = 480
    padding = 32
    font_path = os.environ.get(
        "METACASQUETTE_VIDEO_FONT",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    )
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    # Keep short captions large while shrinking longer jokes enough to avoid
    # clipping at the bottom of the vertical video.
    for font_size in range(58, 35, -2):
        font = ImageFont.truetype(font_path, font_size)
        lines = wrap_caption_text(draw, text_value, font, width - (padding * 2))
        line_height = int(font_size * 1.34)

        if len(lines) * line_height <= height - (padding * 2):
            break

    total_height = len(lines) * line_height
    y_position = max(padding, (height - total_height) // 2)

    for line in lines:
        bounds = draw.textbbox((0, 0), line, font=font, stroke_width=2)
        line_width = bounds[2] - bounds[0]
        draw.text(
            ((width - line_width) // 2, y_position),
            line,
            font=font,
            fill=(255, 255, 255, 255),
            stroke_width=2,
            stroke_fill=(0, 0, 0, 255),
        )
        y_position += line_height

    canvas.save(output_path, "PNG")


def choose_response_text(name, theme, language):
    if language == "en":
        return (
            f"Thank you {name}, I am preparing your {theme} MetaCasquette. "
            "Meanwhile, take a look at what the other players have made."
        )

    return (
        f"Merci {name}, je suis en train de préparer ta MétaCasquette en {theme}. "
        "En attendant, regarde ce que les autres ont fait."
    )


def choose_small_description_text(name, theme, language):
    if language == "en":
        return f"{name} chose a MetaCasquette made of {theme}!"

    return f"{name} a choisi une MétaCasquette en {theme} !"


def choose_ready_text(name, theme, language):
    if language == "en":
        return (
            f"Well done {name}! "
            f"Your {theme} MetaCasquette is ready! "
            "Would you wear it?"
        )

    return (
        f"Bravo {name} ! "
        f"Ta MétaCasquette en {theme} est prête ! "
        "Est-ce que tu la porterais ?"
    )


def choose_video_voiceover_text(name, theme, language):
    if language == "en":
        variants = [
            f"Well done {name}! You are going to wear a MetaCasquette made of {theme}. Fashion has just resigned, but it is the most beautiful MetaCasquette I have ever seen!",
            f"{name} plus {theme}: a cap nobody asked for, but everybody deserves.",
            f"Lady Gaga wanted that one! {name}, your idea is incredible: a MetaCasquette made of {theme}. Never seen before!",
            f"{name}'s {theme} MetaCasquette is approved by absolutely nobody, and that is what makes it beautiful.",
            f"Even the pigeons respect {name}'s {theme} MetaCasquette.",
            f"This {theme} MetaCasquette is superb. {name}'s good taste is getting out of control.",
            f"Brilliant {name}, this may be the finest MetaCasquette I have ever seen! {theme} is officially back in fashion!",
            f"{name} proves you can keep a cool head under a whole lot of {theme}.",
            f"Hats off, {name}! A MetaCasquette made of {theme} is a truly extraordinary idea.",
            f"High fashion is calling: it wants to borrow {name}'s idea to create this MetaCasquette made of {theme}.",
        ]
    else:
        variants = [
            f"Bravo {name} ! Tu vas mettre une MétaCasquette en {theme} sur ta tête. La mode vient de démissionner, mais c’est la plus belle MétaCasquette que je connaisse !",
            f"{name} plus {theme} : une casquette que personne n’avait demandée, mais que tout le monde mérite.",
            f"Lady Gaga la voulait, celle-là ! Ton idée, {name}, est incroyable : une MétaCasquette en {theme}, du jamais-vu !",
            f"La MétaCasquette en {theme} de {name} n’est homologuée par personne, et c’est ça qui est beau.",
            f"Même les pigeons respectent la MétaCasquette en {theme} de {name}.",
            f"Cette MétaCasquette en {theme} est superbe. Le bon goût de {name} devient incontrôlable.",
            f"Génial {name}, c’est sûrement la plus belle MétaCasquette que j’aie jamais vue ! Et maintenant, {theme}, c’est tendance !",
            f"{name} prouve qu’on peut garder la tête froide sous beaucoup de {theme}.",
            f"Chapeau {name} ! La MétaCasquette en {theme} est vraiment une idée extraordinaire.",
            f"La haute couture appelle : elle veut récupérer l’idée de {name} pour créer cette MétaCasquette en {theme}.",
        ]

    return random.choice(variants)


def launch_background_video_job(video_script_path, file_id):
    if not video_script_path:
        return {"started": False, "reason": "videoScriptMissing"}

    script_path = Path(video_script_path)

    if not script_path.is_file():
        return {"started": False, "reason": "videoScriptMissing"}

    log_path = OUTPUT_DIR / f"{file_id}_video_job.log"

    try:
        with log_path.open("ab") as error_handle:
            process = subprocess.Popen(
                ["bash", str(script_path), file_id],
                stdout=subprocess.DEVNULL,
                stderr=error_handle,
                start_new_session=True,
                cwd=str(ROOT_DIR),
            )
    except Exception as exc:
        return {"started": False, "reason": f"videoLaunchFailed:{exc}"}

    return {"started": True, "pid": process.pid, "log": str(log_path.relative_to(ROOT_DIR))}


def write_metadata(file_id, metadata):
    metadata_path = OUTPUT_DIR / f"{file_id}_assets.json"
    metadata_path.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def main():
    if len(sys.argv) < 6:
        print(json.dumps({
            "success": "0",
            "error": "Usage: createMetacasquetteAssets.py <openai_key> <google_credentials> <id> <name> <theme> [language] [video_script]",
        }))
        return 1

    openai_key = sys.argv[1]
    google_credentials_path = sys.argv[2]
    file_id = sys.argv[3]
    name = sys.argv[4]
    theme = sys.argv[5]
    language = normalize_language(sys.argv[6] if len(sys.argv) > 6 else "fr")
    video_script = sys.argv[7] if len(sys.argv) > 7 else ""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    warnings = []
    client = OpenAI(api_key=openai_key)

    prompt_mode = DEFAULT_PROMPT_MODE
    prompt_value = build_prompt(theme, prompt_mode)

    dalle_path = OUTPUT_DIR / f"{file_id}_dalle.png"
    cropped_path = OUTPUT_DIR / f"{file_id}_cropped.png"
    layer_path = OUTPUT_DIR / f"{file_id}_layer.png"
    black_path = OUTPUT_DIR / f"{file_id}_black.png"
    video_caption_path = OUTPUT_DIR / f"{file_id}_videoCaption.png"

    try:
        download_generated_image(client, prompt_value, str(dalle_path))
        remove_background_and_crop(dalle_path, cropped_path, layer_path)
        create_black_background_image(layer_path, black_path)
    except Exception as exc:
        print(json.dumps({
            "success": "0",
            "filename": "Error",
            "error": f"imageGenerationFailed: {exc}",
        }))
        return 1

    # Start the Instagram video pipeline as soon as the generated image exists.
    # The background job waits for the caption and voice-over files below.
    video_job = launch_background_video_job(video_script, file_id)

    response_text = choose_response_text(name, theme, language)
    small_description_text = choose_small_description_text(name, theme, language)
    ready_text = choose_ready_text(name, theme, language)
    video_voiceover_text = choose_video_voiceover_text(name, theme, language)

    texts = {
        "response": response_text,
        "smallDescription": small_description_text,
        "ready": ready_text,
        "videoVoiceover": video_voiceover_text,
    }
    create_video_caption_image(video_voiceover_text, video_caption_path)
    audio_files, tts_provider = create_all_audio_files(
        client,
        file_id,
        texts,
        language,
        google_credentials_path,
        warnings,
    )
    response_mp3 = str(audio_files["responseMp3"].relative_to(ROOT_DIR)) if "responseMp3" in audio_files else ""
    small_description_mp3 = str(audio_files["smallDescriptionMp3"].relative_to(ROOT_DIR)) if "smallDescriptionMp3" in audio_files else ""
    ready_mp3 = str(audio_files["readyMp3"].relative_to(ROOT_DIR)) if "readyMp3" in audio_files else ""
    video_insta_mp3 = str(audio_files["videoInstaMp3"].relative_to(ROOT_DIR)) if "videoInstaMp3" in audio_files else ""

    (OUTPUT_DIR / f"{file_id}.txt").write_text(small_description_text, encoding="utf-8")

    if not video_job.get("started", False) and video_job.get("reason"):
        warnings.append(video_job["reason"])

    metadata = {
        "id": file_id,
        "name": name,
        "theme": theme,
        "language": language,
        "promptMode": prompt_mode,
        "prompt": prompt_value,
        "imageModel": DEFAULT_IMAGE_MODEL,
        "ttsProvider": tts_provider,
        "files": {
            "dalle": str(dalle_path.relative_to(ROOT_DIR)),
            "cropped": str(cropped_path.relative_to(ROOT_DIR)),
            "layer": str(layer_path.relative_to(ROOT_DIR)),
            "black": str(black_path.relative_to(ROOT_DIR)),
            "videoCaption": str(video_caption_path.relative_to(ROOT_DIR)),
            "responseMp3": response_mp3,
            "smallDescriptionMp3": small_description_mp3,
            "readyMp3": ready_mp3,
            "videoInstaMp3": video_insta_mp3,
            "text": str((OUTPUT_DIR / f"{file_id}.txt").relative_to(ROOT_DIR)),
        },
        "texts": texts,
        "videoJob": video_job,
        "warnings": warnings,
    }
    write_metadata(file_id, metadata)

    print(json.dumps({
        "success": "1",
        "filename": str(layer_path.relative_to(ROOT_DIR)),
        "blackFilename": str(black_path.relative_to(ROOT_DIR)),
        "promptMode": prompt_mode,
        "imageModel": DEFAULT_IMAGE_MODEL,
        "ttsProvider": tts_provider,
        "responseMp3": response_mp3,
        "smallDescriptionMp3": small_description_mp3,
        "readyMp3": ready_mp3,
        "videoInstaMp3": video_insta_mp3,
        "responseText": response_text,
        "smallDescriptionText": small_description_text,
        "readyText": ready_text,
        "videoVoiceoverText": video_voiceover_text,
        "backgroundVideoStarted": video_job.get("started", False),
        "warnings": warnings,
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
