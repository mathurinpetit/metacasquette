import sys
from PIL import Image
from rembg import remove
from openai import OpenAI
import openai
import urllib.request
import json

openaikey = sys.argv[1]

userImageId = sys.argv[3]

theme = sys.argv[5]

client = OpenAI(api_key=openaikey)

fileNameGenerated = "jeudatas/"+userImageId+"_dalle.png"
fileNameCropped = "jeudatas/"+userImageId+"_cropped.png";
fileNameLayer ="jeudatas/"+userImageId+"_layer.png";

json_result = {}

def createMetaCasquette(theme):

    promptDalle="L'image est une une casquette fabriquée en "+theme+" en couleur bien éclairé prise de face sur un fond blanc. La casquette lévite et il n'y a pas de sol et pas d'ombres autour. La casquette est vue de face avec la visière vers l'avant de l'image. Cette casquette a la forme d'une casquette de baseball classique avec une grande visière mais elle est fabriqué avec des "+theme+". La casquette est volumineuse et créée dans une matière unique : '"+theme+"'. Sa matière est entièrement du "+theme+" qui sont entiers. Il forment une casquette qui est composée d'environ 6 à 10 gros morceaux de "+theme+". L'ensemble de ces "+theme+" sont de tailles et de volumes différents. La casquette est donc upcyclée ou recyclée. Attention la casquette n'a qu'une seule visière placée vers l'avant de l'image. "
    "Pour donner un exemple de ce genre de casquette, il peut s'agir d'une casquette fabriquée en carte à jouer, en morceaux d'ordinateur, en carte routière, en carte téléphonique ou bancaire, en paquet de gateaux ou de chips etc... D'ailleurs la taille des éléments de ces casquettes est a peu près celui d'une carte de crédit. La casquette est donc upcyclé ou recylclé. Elle est upcyclé uniquement en "+theme+" qui sont des morceaux plats rectangulaires. Chaque morceaux de "+theme+" est de taille supérieur à celui d'une carte de crédit. Attention la casquette est volumetrique mais elle n'est pas cubique. Elle reste arrondie avec une visière arrondie."
    try:
      result = client.images.generate(
      model="dall-e-3",
      prompt=promptDalle,
      n=1,
      size="1024x1024",
      quality="standard"
      )
      return result.data;
    except:
      json_result["filename"] = "Error"
      json_result["success"] = "0";
      return 0;

def rembgMetaCasquette():

    input = Image.open(fileNameGenerated)
    output = remove(input)
    output.save(fileNameCropped)

    input = Image.open(fileNameCropped)
    output = remove(input)
    output.size  # (364, 471)
    output.getbbox()  # (64, 89, 278, 267)

    output2 = output.crop(output.getbbox())
    output2.size  # (214, 178)
    output2.save(fileNameLayer)
    return fileNameLayer;



data = createMetaCasquette(theme);
if data == 0 :
    print(json.dumps(json_result));
    exit(0);

urllib.request.urlretrieve(data[0].url,fileNameGenerated)

fileName = rembgMetaCasquette();

json_result["filename"] = fileName;
json_result["success"] = "1";

print(json.dumps(json_result))
