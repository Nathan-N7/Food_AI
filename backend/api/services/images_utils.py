import base64

def file_to_data_url(image):
    image.seek(0);
    image_bytes = image.read();
    mime_type = getattr(image, "content_type","image/jpeg");
    encoded_image = base64.b64encode(image_bytes).decode("utf-8");
    return f"data:{mime_type};base64,{encoded_image}";
