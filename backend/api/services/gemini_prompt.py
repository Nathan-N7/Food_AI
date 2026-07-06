import os
import replicate as rp
from dotenv import load_dotenv
load_dotenv()

def gemini_generate_prompt(image_data):
    
    api_token=os.getenv("REPLICATE_API_TOKEN")
    client = rp.Client(api_token=api_token);
    if not api_token:
        raise ValueError("sem token da api");
    full_response = ""
    for event in client.stream(
    
        "google/gemini-3-flash",
        input={
"prompt": """

Analyze the provided reference image and create a prompt whose main goal is visual enhancement with maximum fidelity to the original image.

CRITICAL FIDELITY RULES:
The reference image is the source of truth.
Do not invent, infer, add, remove, replace, resize, or rearrange anything.
Do not add ingredients, toppings, sauces, garnishes, containers, plates, bowls, cutlery, napkins, hands, text, logos, packaging, or background objects.
Do not change the dish type, cuisine name, camera angle, framing, crop, composition, ingredient distribution, container, table, or background.
Do not describe anything as present unless it is clearly visible in the image.
Do not infer specific names such as "Japanese shokupan", "maple syrup", "powdered sugar", "rustic wooden tabletop", or camera brands unless they are visually certain.

Your job is only to improve:
lighting, sharpness, realism, texture, freshness, color balance, depth of field, and commercial food photography quality.

The generated FLUX prompt must explicitly tell FLUX:
- preserve the original image structure exactly
- use the reference image as the source of truth
- enhance only visual quality
- do not create new visual elements

Return only a valid JSON object with:
{
  "positive_prompt": "...",
  "negative_prompt": "...",
  "camera_settings": "..."
}
"""
            ,
"sistem_instruction":"you are an expert AI prompt engineer for image-to-image food enhancement using FLUX 2 Pro.",

"thinking_level":"high",
"image":[image_data],
"max_output_tokens":65535
        }
    ):
        full_response += str(event)
    return(full_response);