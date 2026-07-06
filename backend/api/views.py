from uuid import uuid4
from pydantic import ValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services.rtdetr import RtFilter
from .services.images_utils import file_to_data_url
from .services.gemini_analyzer import gemini_analyzer
from .services.prompt_builder import build_flux_prompt
from .services.flux_image_generate import flux_image_generate
from .services.save_image import save_image_from_url

from .scheemas import DetectionResult, GeminiAnalysis, FluxPrompt, PipelineResponse
from .graph import food_graph

from .services.flux_image_generate import flux_image_generate


class RegenerateImageView(APIView):
    def post(self, request, *args, **kwargs):
        thread_id = request.data.get("thread_id")

        if not thread_id:
            return Response(
                {"error": "thread_id obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            config = {
                "configurable": {
                    "thread_id": thread_id
                }
            }

            snapshot = food_graph.get_state(config)
            state = snapshot.values

            if not state:
                return Response(
                    {"error": "Estado não encontrado para esse thread_id"},
                    status=status.HTTP_404_NOT_FOUND
                )

            prompt = state.get("prompt")
            image_data = state.get("image_data")
            analysis = state.get("analysis")

            if not prompt or not image_data:
                return Response(
                    {"error": "Estado incompleto: prompt ou image_data ausente"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            prompt_model = FluxPrompt.model_validate(prompt)

            url_image = flux_image_generate(
                prompt_model.model_dump(),
                image_data
            )

            url_image = str(url_image)

            save_image_from_url(url_image)

            return Response(
                {
                    "thread_id": thread_id,
                    "analysis": analysis,
                    "prompt": prompt_model.model_dump(),
                    "url_image": url_image
                },
                status=status.HTTP_200_OK
            )

        except ValidationError as e:
            return Response(
                {
                    "error": "Erro de validação no regenerate",
                    "details": e.errors()
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )

        except Exception as e:
            return Response(
                {
                    "error": "Erro ao regenerar imagem",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class validationFoodView(APIView):
    def post(self, request, *arg, **args):
        file_image = request.FILES.get("image")

        if not file_image:
            return Response(
                {"error":"Nenhuma imagem enviada"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            result = RtFilter(file_image)
            result_model = DetectionResult.model_validate(result)
            if result_model.validate is not True:
                return Response(
                    {"resultado": result_model.model_dump(),
                     "error":"imagem rejeitada peo real time detection transformer"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            image_data = file_to_data_url(file_image)
            
            thread_id = str(uuid4())

            initial_state = {
                "image_data": image_data,
                "resultado": result_model.model_dump(),
                "analysis":None,
                "prompt":None,
                "url_image":None,
                "error":None
            }

            config = {
                "configurable":{
                    "thread_id":thread_id
                }
            }

            final_state = food_graph.invoke(initial_state, config=config)
       
            # analysis = gemini_analyzer(image_data)

            analysis_model = GeminiAnalysis.model_validate(final_state["analysis"])


            # final_prompt = build_flux_prompt(analysis_model.model_dump())

            prompt_model = FluxPrompt.model_validate(final_state["prompt"])

            # url_image = flux_image_generate(prompt_model.model_dump(), image_data)
            
            url_image = str(final_state["url_image"])
         
            save_image_from_url(url_image);
            
            response_model = PipelineResponse(
                resiltado=result_model,
                analysis=analysis_model,
                prompt=prompt_model,
                url_image=url_image
            )

            return Response(
                {
                    "thread_id":thread_id,
                    **response_model.model_dump()               
                },
                status=status.HTTP_200_OK
            )
       
        except ValidationError as e:
            return Response(
                {
                    "error":"erro de validacao entre etapas",
                    "datails":e.errors()
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as e:
            return Response(
                {
                    "error":"Erro interno no pipeline",
                    "details":str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        