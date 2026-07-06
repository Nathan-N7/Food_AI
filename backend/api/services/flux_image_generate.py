import replicate as rp
import os

def flux_image_generate(prompt, image):
    token = os.getenv("REPLICATE_API_TOKEN");
    if not token:
        raise ValueError("Chave da api não encontrada");
    full_prompt = f"""
{prompt["positive_prompt"]}

Restrictions:
Avoid the following problems: {prompt["negative_prompt"]}

Camera and ligthing:
{prompt["camera_settings"]}
""".strip()
    
    client = rp.Client(api_token=token, timeout=300  );
    output = client.run(
        "black-forest-labs/flux-2-max",
        input = {
            "prompt": full_prompt,
            "input_images":[image],
            "aspect_ratio": "1:1",
            "output_format": "jpg",
            "output_quality": 95
        }
    )
    if isinstance(output,list) and len(output) > 0:
        url_final = output[0];
    else:
        url_final = output;
    return(url_final);