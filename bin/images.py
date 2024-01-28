import sys
import os
from PIL import Image
from rembg import remove
#parameters
#end of parameters

file_path=sys.argv[3];
if not os.path.isfile(file_path):
    print("Le fichier n'existe pas !");
    exit(1);

id=sys.argv[1];
typeImg=sys.argv[2];
path='../public/img/casquettes/'+id;
if not os.path.exists(path):
    os.makedirs(path)

print("Fichier à traiter : "+file_path+" pour metacasquette "+id+" ("+typeImg+")");

def rembgMetacasquette():

    imgsrc = Image.open(file_path)
    if imgsrc.width < imgsrc.height :
        print("La photo n'est pas au bon format !");
        exit(1);

    imgsrc.thumbnail((2666,1500))
    box = (583, 0, 2083, 1500);
    croped = imgsrc.crop(box)

    output = remove(croped)

    imgBckgd = Image.open("../public/img/black1000x1000.jpg")

    if(typeImg=='camera_side_image'):
        output.thumbnail((1000,1000))
        rotated = output.rotate(0, expand=True)
        rotated.save(path+"/"+id+"_side02.png")

        imgBckgd.paste(rotated)
        imgBckgd.save(path+"/"+id+"_side02.jpg", quality=95)

    if(typeImg=='camera_up_image'):

        output.thumbnail((1000,1000))
        rotated = output.rotate(0, expand=True)
        rotated.save(path+"/"+id+"_side01.png")

        imgBckgd.paste(rotated)
        imgBckgd.save(path+"/"+id+"_side01.jpg", quality=95)

        box2 = (333, 0, 2333, 1500);
        croped2 = imgsrc.crop(box2)
        full = remove(croped2)
        full.thumbnail((1200,1600))
        rotated = full.rotate(0, expand=True)
        rotated.save(path+"/"+id+".png")

        imgBckgd1200 = Image.open("../public/img/black1200x1600.jpg")
        imgBckgd1200.paste(rotated);
        imgBckgd1200.save(path+"/"+id+".jpg", quality=95)

        full.thumbnail((340,420))
        rotated = full.rotate(0, expand=True)
        imgBckgd340 = Image.open("../public/img/black340x420.jpg")
        imgBckgd340.paste(rotated);

        pathProduct='../public/img/casquettes/'+id+'/product';
        if not os.path.exists(pathProduct):
            os.makedirs(pathProduct)
        imgBckgd340.save(pathProduct+"/01.jpg", quality=95)


with Image.open(file_path) as img:
    if img.format != 'JPEG' and img.format != 'MPO':
        print("Le fichier n'est pas une image");
        exit(1);
    rembgMetacasquette();
