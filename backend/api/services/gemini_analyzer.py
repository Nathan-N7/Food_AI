import os
import json
import replicate as rp
from dotenv import load_dotenv, find_dotenv

env_dotenv = find_dotenv()
print(env_dotenv)
load_dotenv(env_dotenv);


def parse_gemini_json(full_response):
    clean_response = (
        full_response
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    start = clean_response.find("{")
    end = clean_response.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            f"Gemini não retornou um JSON válido. Resposta recebida:\n{repr(clean_response)}"
        )

    clean_response = clean_response[start:end + 1]

    try:
        decoder = json.JSONDecoder(strict=False)
        analysis, _ = decoder.raw_decode(clean_response)
        return analysis

    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini retornou JSON inválido: {e}\nResposta recebida:\n{repr(clean_response)}"
        )

def gemini_analyzer(image_data):
    api_token = os.getenv("REPLICATE_API_TOKEN");
    if not api_token:
        raise ValueError("sem chave da api");
    
    client = rp.Client(api_token=api_token);
    output = client.run(
        "google/gemini-3-flash",
        input = {
         "prompt": """
You are a food image analysis agent for an image-to-image enhancement pipeline.

Analyze the provided food image and return ONLY a valid JSON object.

Your job is NOT to create a final image prompt.
Your job is to describe only what is clearly visible in the image.

CRITICAL RULES:
- Do not invent ingredients.
- Do not infer cuisine names unless visually obvious.
- Do not add artistic suggestions.
- If something is uncertain, use "uncertain".
- If the container, background, or garnish is not clearly visible, say "uncertain".
- Be concise and factual.

Return this exact JSON structure:

{
  "food_identity": "",
  "visible_elements": [],
  "container": "",
  "background": "",
  "camera_angle": "",
  "lighting_problem": "",
  "texture_problem": "",
  "commercial_improvement_goal": "",
  "risk_of_hallucination": "low | medium | high"
}
""",
            "thinking_level": "high",
            "images": [image_data],
            "max_output_tokens": 65535
}
    )    
    
    if isinstance(output, list):
        full_response = "".join(str(item) for item in output)
    else:
        full_response = str(output)
    return parse_gemini_json(full_response);
