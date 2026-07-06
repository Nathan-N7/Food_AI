from .services.rtdetr import RtFilter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.images_utils import file_to_data_url
from .services.gemini_analyzer import gemini_analyzer
from .services.prompt_builder import build_flux_prompt
from .services.flux_image_generate import flux_image_generate
from .services.save_image import save_image_from_url

class validationFoodView(APIView):
    def post(self, request, *arg, **args):
        file_image = request.FILES.get("image")

        result = RtFilter(file_image)

        if result["validate"] == True:
            image_data = file_to_data_url(file_image)

            analysis = gemini_analyzer(image_data)

            final_prompt = build_flux_prompt(analysis)

            url_image = flux_image_generate(final_prompt, image_data)

            save_image_from_url(url_image);
            with open("prompt.txt", "w", encoding="utf-8") as f:
                f.write(str(final_prompt))

            print("ANALISE GEMINI:")
            print(analysis)

            print("PROMPT FINAL:")
            print(final_prompt)

            return Response(
                {
                    "url_image":str(url_image)
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "resultado": result,
                "error": "Imagem rejeitada pelo filtro RT-DETR"
            },
            status=status.HTTP_400_BAD_REQUEST
        )