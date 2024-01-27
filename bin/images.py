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
path='img/casquettes/'+id;
if not os.path.exists(path):
    os.makedirs(path)

print("Fichier à traiter : "+file_path+" pour metacasquette "+id+" ("+typeImg+")");

def rembgMetacasquette():

    img = Image.open(file_path)
    box = (6, 594, 1506, 2094);


    croped = img.crop(box)
    output = remove(croped)

    imgBckgd = Image.open("img/black1000x1000.jpg")

    if(typeImg=='camera_side_image'):
        output.thumbnail((1000,1000))
        output.save(path+"/"+id+"_side02.png")
        imgBckgd.paste(output)
        imgBckgd.save(path+"/"+id+"_side02.jpg", quality=95)

    if(typeImg=='camera_up_image'):

        output.thumbnail((1000,1000))
        output.save(path+"/"+id+"_side01.png")

        imgBckgd.paste(output)
        imgBckgd.save(path+"/"+id+"_side01.jpg", quality=95)

        box2 = (6, 344, 1506, 2344);
        croped2 = img.crop(box2)
        full = remove(croped2)
        full.thumbnail((1200,1600))
        full.save(path+"/"+id+".png")
        imgBckgd1200 = Image.open("img/black1200x1600.jpg")
        imgBckgd1200.paste(full);
        imgBckgd1200.save(path+"/"+id+".jpg", quality=95)
        full.thumbnail((340,420))
        imgBckgd340 = Image.open("img/black340x420.jpg")
        imgBckgd340.paste(full);
        pathProduct='img/casquettes/'+id+'/product';
        if not os.path.exists(pathProduct):
            os.makedirs(pathProduct)
        imgBckgd340.save(pathProduct+"/01.jpg", quality=95)


with Image.open(file_path) as img:
    if img.format != 'JPEG' and img.format != 'MPO':
        print("Le fichier n'est pas une image");
        exit(1);
    rembgMetacasquette();
