import sys
import os
import subprocess
import json
import io
import base64
from pathlib import Path
from openai import OpenAI
from google.cloud import texttospeech



def getUserText(mp3File):
    whisperResponse = client.audio.transcriptions.create(
        model="whisper-1",
        file=open(mp3File, "rb")
    )
    return whisperResponse.text;

def extractionGPTUser(userText, machineText):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        response_format={ "type": "json_object" },
        messages=[
             {"role": "system", "content": machineText},
             {"role": "user", "content": userText}
        ]
    )
    capGptResponseJson=response.choices[0].message.content
    return capGptResponseJson



def createMp3Response(text=""):

  clientGoogleSpeech = texttospeech.TextToSpeechClient()

  # Spécifiez les paramètres de la synthèse vocale
  synthesis_input = texttospeech.SynthesisInput(text=text)
  voice = texttospeech.VoiceSelectionParams(
      language_code="fr-FR",  # Code de langue pour le français
      name="fr-FR-Neural2-D",  # Nom de la voix
  )
  audio_config = texttospeech.AudioConfig(
      audio_encoding=texttospeech.AudioEncoding.LINEAR16
  )

  # Appelez l'API pour générer la parole
  response = clientGoogleSpeech.synthesize_speech(
      input=synthesis_input, voice=voice, audio_config=audio_config
  )

  speech_file_name = "jeudatas/"+fileId+"_response.mp3";

  with open(speech_file_name, 'wb') as out:
    out.write(response.audio_content)

  return speech_file_name;



openaikey = sys.argv[1]
googleapifile = sys.argv[2]
fileId = sys.argv[3]
filePath = sys.argv[4]

client = OpenAI(api_key=openaikey)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = googleapifile


cmd = 'lame --quiet --preset insane %s' % filePath
process = subprocess.call(cmd, shell=True, stdout=open(os.devnull, 'wb'))
newfilepath = os.path.splitext(filePath)[0]+'.mp3'
os.remove(filePath);

userText = getUserText(newfilepath);

json_user = None

machineText = "You are a helpful assistant designed to output JSON. The output JSON has 'name' and 'whatilove'. The first parameter 'name' is the name of the user. the second parameter 'whatilove' is what the user say he love in maximum 4 words without articles";
userText = "The name and the theme : "+userText;
json_user = json.loads(extractionGPTUser(userText,machineText))



textReponse = "Très bien "+json_user["name"]+"! "+json_user["whatilove"]+" tu aimes, "+json_user["whatilove"]+" tu auras ! Je vais te construire une MétaCasquette en "+json_user["whatilove"]+". Cela peut prendre un peu de temps, alors je te propose de regarder ce que les autres participants ont choisi en attendant. La MétaCasquette la plus originale gagnera !";

textReponseSections = "<p class='animate-text'>Très bien </p><p class='animate-text warm'>"+json_user["name"]+"!</p>"
textReponseSections = textReponseSections + "<p class='animate-text highlight'>"+json_user["whatilove"]+"</p><p class='animate-text'> tu aimes, </p><p class='animate-text highlight'>"+json_user["whatilove"]+"</p><p class='animate-text'> tu auras ! </p>"
textReponseSections = textReponseSections + "<p class='animate-text'>Je vais te construire une MétaCasquette en </p><p class='animate-text highlight'>"+json_user["whatilove"]+"</p>"
textReponseSections = textReponseSections + "<p class='animate-text'>Cela peut prendre un peu de temps, alors je te propose de regarder ce que les autres participants ont choisi en attendant.</p>"
textReponseSections = textReponseSections + "<p class='animate-text light'>La MétaCasquette</p><p class='animate-text lastOne'> la plus originale gagnera !</p>";


mp3Reponse = createMp3Response(textReponse);

json_user["mp3Reponse"] = mp3Reponse;
json_user["textReponse"] = textReponse;
json_user["textReponseSections"] = textReponseSections;
json_user["idUser"] = fileId;

os.remove(newfilepath);

print(json.dumps(json_user))
