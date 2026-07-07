from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .services.gemini_analyzer import gemini_analyzer
from .services.prompt_builder import build_flux_prompt
from .services.flux_image_generate import flux_image_generate

from .scheemas import GeminiAnalysis, FluxPrompt


class FoodPipelineState(TypedDict, total=False):
    image_data: str
    resultado: dict | None
    analysis: dict | None
    prompt: dict | None
    url_image: str | None
    error: str | None


def analyze_image_node(state: FoodPipelineState):
    analysis = gemini_analyzer(state["image_data"])

    analysis_model = GeminiAnalysis.model_validate(analysis)

    return {
        "analysis": analysis_model.model_dump()
    }
def build_prompt_node(state: FoodPipelineState):
    print("==== BUILD PROMPT NODE ====")
    print("STATE KEYS:", state.keys())
    print("STATE ANALYSIS:", state.get("analysis"))

    prompt = build_flux_prompt(state["analysis"])

    print("PROMPT RETORNADO:", prompt)
    print("TIPO DO PROMPT:", type(prompt))
    print("===========================")

    prompt_model = FluxPrompt.model_validate(prompt)

    return {
        "prompt": prompt_model.model_dump()
    }

# def build_prompt_node(state: FoodPipelineState):
#     prompt = build_flux_prompt(state["analysis"])

#     prompt_model = FluxPrompt.model_validate(prompt)

#     return {
#         "prompt": prompt_model.model_dump()
#     }


def generate_image_node(state: FoodPipelineState):
    url_image = flux_image_generate(
        state["prompt"],
        state["image_data"]
    )

    return {
        "url_image": str(url_image)
    }


def create_food_graph():
    graph = StateGraph(FoodPipelineState)

    graph.add_node("analyze_image", analyze_image_node)
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_image", generate_image_node)

    graph.add_edge(START, "analyze_image")
    graph.add_edge("analyze_image", "build_prompt")
    graph.add_edge("build_prompt", "generate_image")
    graph.add_edge("generate_image", END)

    checkpointer = MemorySaver()

    return graph.compile(checkpointer=checkpointer)


food_graph = create_food_graph()