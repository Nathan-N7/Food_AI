def build_flux_prompt(analysis):
    food_identity = analysis.get("food_identity", "visible food")
    visible_elements = analysis.get("visible_elements", [])
    container = analysis.get("container", "uncertain")
    background = analysis.get("background", "uncertain")
    camera_angle = analysis.get("camera_angle", "same as reference image")
    lighting_problem = analysis.get("lighting_problem", "amateur lighting")
    texture_problem = analysis.get("texture_problem", "low texture detail")
    commercial_goal = analysis.get(
        "commercial_improvement_goal",
        "make the food look more professional and appetizing"
    )

    elements_text = ", ".join(visible_elements) if visible_elements else "only the clearly visible food elements"

    positive_prompt = f"""
Premium image-to-image commercial food photography transformation.

Use the provided reference image to understand the food identity, main ingredients, proportions, and distinctive visual features.

Detected food identity: {food_identity}.
Clearly visible elements to preserve: {elements_text}.
Original container: {container}.
Original background: {background}.
Original camera angle: {camera_angle}.

Preserve the core food identity and the recognizable structure of the dish:
- same type of food
- same main visible ingredients
- similar overall shape and proportions
- similar front-facing close-up camera angle
- preserve distinctive details such as visible sauce placement, melted cheese, meat patty, bun shape, and skewer when present

Transform the image into a premium commercial delivery-app menu photo.

You MAY improve or replace the amateur visual context:
- replace the original background with a clean dark neutral studio background
- replace the original surface with a professional food photography surface
- improve lighting with soft controlled studio illumination
- improve contrast, color grading, highlights and shadows
- improve sharpness and realistic texture
- make the sauce glossy and appetizing
- make the meat look juicy and freshly grilled
- make the bun look warm, golden, soft, and lightly glossy
- create shallow depth of field and professional restaurant advertising appeal

Current visual issues to fix:
- lighting: {lighting_problem}
- texture: {texture_problem}

Goal: {commercial_goal}.

The final image must look like a high-end professional food advertisement for a premium delivery app, not like a simple restoration of an amateur phone photo.

Do not change the dish into a different food.
Do not add unrelated ingredients, fries, drinks, hands, people, text, logos, packaging, cutlery, or extra side dishes.
""".strip()
    negative_prompt = """
    different dish, changed food identity, missing main ingredients, extra unrelated ingredients,
    lettuce, tomato slices, onions, pickles, fries, drinks, side dishes, hands, people,
    text, logos, watermark, packaging, cutlery, plate if not needed,
    cartoon, illustration, CGI look, fake plastic texture, unrealistic food,
    deformed bun, deformed meat patty, duplicated skewer, broken skewer,
    messy composition, ugly food styling, low quality, blurry, noisy, grainy,
    overexposed, underexposed, oversharpening artifacts, excessive blur,
    amateur phone photo look, flat lighting, dirty background
    """.strip()
    camera_settings = """
Professional commercial food photography setup, front-facing close-up hero shot, controlled softbox lighting, appetizing highlights, shallow depth of field, sharp focus on the burger, premium restaurant advertising style, clean dark neutral background.
""".strip()
    
    return {
        "positive_prompt": positive_prompt,
        "negative_prompt": negative_prompt,
        "camera_settings": camera_settings
    }