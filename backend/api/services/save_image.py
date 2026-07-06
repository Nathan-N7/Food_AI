import requests
from pathlib import Path

def save_image_from_url(image_url, filename="teste3.jpg"):
    output_path = Path(__file__).resolve().parents[1] / filename
  

    response = requests.get(image_url, timeout=60)
    response.raise_for_status()

    with open(output_path, "wb") as file:
        file.write(response.content)

    return str(output_path)