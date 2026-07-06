from typing import TypeDict, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .services.gemini_analyzer import gemini_analyzer
from .services.prompt_builder import build_flux_prompt
from .services.flux_image_generate import flux_image_generate


class FoodPipelineState(TypeDict):
    image_data: str
    resultado: dict | None
    analysis : dict | None
    prompt: dict | None
    url_image: str | None
    erro: str | None

def analyze_image_node(state: FoodPipelineState):
    analysis = gemini_analyzer(state["image_data"])
    return{
        "analysis" : analysis
    }


def build_prompt_node(state: FoodPipelineState):
    prompt = build_flux_prompt(state["analyzis"])
    return{
        "prompt":prompt
        }

def generate_image_node(state:FoodPipelineState):
    url_image =flux_image_generate(
        state["prompt"],
        state["imagge_data"]
    )
    return {
        "url_image":url_image
        }

def create_food_graph():
    graph = StateGraph(FoodPipelineState)
    
    graph.add_node("analyzs_image", analyze_image_node);
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_image", generate_image_node)

    checkpointer = MemorySaver()
    return graph.compile(checkpointer=checkpointer)

food_graph = create_food_graph()