from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import importlib
from PIL import Image
import io

from ultralytics import RTDETR
# Create your views here.

# try:
#     ultralitycs_module = importlib.import_module("ultralytics")
#     RTDETR = getattr(ultralitycs_module, "RTDETR");
# except (ImportError) as err:
#     raise ImportError("erro ao importar RTDETR") from err

MODELO_DETECCAO = RTDETR("rtdetr-l.pt")


CLASS_FOOD_ALLOWED = {
    'sandwich', 'bakery', 'fast food', 'pizza', 'burger', 
    'hot dog', 'ice cream', 'cake', 'donut', 'soup', 'salad', 'sushi', 
    'broccoli', 'carrot', 'apple', 'banana', 'orange', 'bowl'
}

#class
def RtFilter(image):
    
    objects_detected = []
    file_image = image
    dados_da_imagem = file_image.read()
    image_pill = Image.open(io.BytesIO(dados_da_imagem))
    results =  MODELO_DETECCAO(image_pill, conf=0.65, verbose=False)
    
    for result in results:
        class_names = result.names;
        ids_detected = result.boxes.cls.cpu().int().tolist()
    for id_class in ids_detected:
        name_class  = class_names[id_class]
        if(name_class not in objects_detected):
            objects_detected.append(name_class);
    if len(objects_detected) > 0:
        return(
            {
            "name_class": name_class,
            "validate": True
            }
            );
    else:
        return{
            "name_class":None,
            "validate":False
        }