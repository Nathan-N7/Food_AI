from typing import Literal
from pydantic import BaseModel, Field

class DetectionResult(BaseModel):
    name_class: str
    validate:bool

class GeminiAnalysis(BaseModel):
    food_identity: str
    visible_elements: list[str]
    container: str
    background:str
    camera_angle:str
    lighting_problem: str
    texture_problem: str
    commercial_improvement_goal: str
    risk_of_hallucination:Literal["low", "middle", "high"]

class FluxPrompt(BaseModel):
    positive_prompt: str = Field(min_length=20)
    negative_prompt: str= Field(min_length=10)
    camera_settings: str= Field(min_lenght=10)

class PipelineResponse(BaseModel):
    resultado: DetectionResult
    analysis: GeminiAnalysis
    url_image: str