import sys
import os
import subprocess
import json
import io
import base64
import random
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



def createMp3(text="", type="response"):

  clientGoogleSpeech = texttospeech.TextToSpeechClient()

  # Spécifiez les paramètres de la synthèse vocale
  synthesis_input = texttospeech.SynthesisInput(text=text)

  language_code = 'fr-FR'
  nameOfVoice = "fr-FR-Neural2-D"
  if langue == "en" :
    nameOfVoice = "en-US-Neural2-D"
    language_code = 'en-US'



  voice = texttospeech.VoiceSelectionParams(
      language_code=language_code,  # Code de langue pour le français
      name=nameOfVoice,  # Nom de la voix
  )
  audio_config = texttospeech.AudioConfig(
      audio_encoding=texttospeech.AudioEncoding.LINEAR16
  )

  # Appelez l'API pour générer la parole
  response = clientGoogleSpeech.synthesize_speech(
      input=synthesis_input, voice=voice, audio_config=audio_config
  )

  speech_file_name = "jeudatas/"+fileId+"_"+type+".mp3";

  with open(speech_file_name, 'wb') as out:
    out.write(response.audio_content)

  return speech_file_name;




openaikey = sys.argv[1]
googleapifile = sys.argv[2]
fileId = sys.argv[3]
filePath = sys.argv[4]
langue = sys.argv[5]

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



textReponse = "Mais quelle bonne idée "+json_user["name"]+" ! "+json_user["whatilove"]+", tu aimes, "+json_user["whatilove"]+", tu auras ! J'ai hâte de construire cette superbe MétaCasquette en "+json_user["whatilove"]+"!";
if langue == "en" :
    textReponse = "In any case, what a great idea "+json_user["name"]+" ! "+json_user["whatilove"]+", you love, "+json_user["whatilove"]+", you will have ! I can't wait to build this awesome "+json_user["whatilove"]+" MétaCasquette.";

textReponseSections = "<p class='animate-text animate-text-response'>Mais quelle bonne idée </p><p class='animate-text animate-text-response warm'>"+json_user["name"]+"!</p>"
textReponseSections = textReponseSections + "<p class='animate-text animate-text-response highlight'>"+json_user["whatilove"]+",</p><p class='animate-text animate-text-response'> tu aimes, </p><p class='animate-text animate-text-response highlight'>"+json_user["whatilove"]+",</p><p class='animate-text animate-text-response'> tu auras ! </p>"
textReponseSections = textReponseSections + "<p class='animate-text animate-text-response'>J'ai hâte de construire cette superbe MétaCasquette en </p><p class='animate-text animate-text-response highlight lastOne'>"+json_user["whatilove"]+"</p>";

if langue == "en" :
    textReponseSections = "<p class='animate-text animate-text-response'>In any case, what a great idea </p><p class='animate-text animate-text-response warm'>"+json_user["name"]+" !</p>"
    textReponseSections = textReponseSections + "<p class='animate-text animate-text-response highlight'>"+json_user["whatilove"]+",</p><p class='animate-text animate-text-response'> you love, </p><p class='animate-text animate-text-response highlight'>"+json_user["whatilove"]+",</p><p class='animate-text animate-text-response'> you will have !</p>"
    textReponseSections = textReponseSections + "<p class='animate-text animate-text-response'>I can't wait to build this awesome </p><p class='animate-text animate-text-response highlight'>"+json_user["whatilove"]+"</p><p class='animate-text animate-text-response lastOne'>MétaCasquette !</p>";


mp3Reponse = createMp3(textReponse,"response");

textSmallDescription = json_user["name"]+" a choisi une MétaCasquette en "+json_user["whatilove"]+" !";
if langue == "en" :
    textSmallDescription = json_user["name"]+" chose a MétaCasquette in "+json_user["whatilove"]+" !";
mp3SmallDescription = createMp3(textSmallDescription,"smallDescription");
with open("jeudatas/"+fileId+".txt", 'w') as f:
    f.write(textSmallDescription);

superlatifs_list_fr = ['Incroyable ! ', 'Superbe ! ', 'Mais quelle bonne idée !', 'Olala, mais bravo !', 'Génial !', 'Fantastique celle là !']
superlatifs_list_en = ['Amazing ! ', 'Superb ! ', 'But what a good idea !', 'Well done !', 'Awesome !', 'This one is fantastic !']

superlatif_fr = random.choice(superlatifs_list_fr)
superlatif_en = random.choice(superlatifs_list_en)


textInstaMp3 = superlatif_fr+" "+json_user["name"]+" a choisi une MétaCasquette en "+json_user["whatilove"]+" !";
if langue == "en" :
    textInstaMp3 = superlatif_en+" "+json_user["name"]+" chose a MétaCasquette in "+json_user["whatilove"]+" !";
videoInstaMp3 = createMp3(textInstaMp3,"videoInstaMp3");



textReady = json_user["name"]+", ta MétaCasquette en "+json_user["whatilove"]+" est prête !"
if langue == "en" :
    textReady = json_user["name"]+", your MétaCasquette built in "+json_user["whatilove"]+" is ready !"

textReadySections = "<p class='animate-text animate-text-ready warm'>"+json_user["name"]+",</p>";

if langue == "fr" :
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready'>ta MétaCasquette en</p>";
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready highlight'>"+json_user["whatilove"]+"</p>";
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready lastOne'>est prête !</p>";

if langue == "en" :
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready'>your MétaCasquette built in</p>";
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready highlight'>"+json_user["whatilove"]+"</p>";
    textReadySections = textReadySections + "<p class='animate-text animate-text-ready lastOne'>is ready !</p>";


mp3Ready = createMp3(textReady,"ready");

json_user["mp3Reponse"] = mp3Reponse;
json_user["textReponse"] = textReponse;
json_user["textReponseSections"] = textReponseSections;

json_user["mp3Ready"] = mp3Ready;
json_user["textReadySections"] = textReadySections;
json_user["idUser"] = fileId;

os.remove(newfilepath);

print(json.dumps(json_user))
