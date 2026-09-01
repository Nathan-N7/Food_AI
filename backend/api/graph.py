import os
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

try:
    from langgraph.checkpoint.postgres import PostgresSaver
    from psycopg import Connection
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - guarded at import time
    PostgresSaver = None
    Connection = None
    dict_row = None

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


def build_checkpointer():
    """
    Build a Postgres-backed checkpointer (durable thread state) or fall back to
    an in-memory one when the postgres checkpoint package/DB is unavailable
    (e.g. local dev without a running database).
    """
    if PostgresSaver is None:
        return None

    db = os.getenv("POSTGRES_DB")
    user = os.getenv("POSTGRES_USER")
    password = os.getenv("POSTGRES_PASSWORD")
    host = os.getenv("POSTGRES_HOST", "127.0.0.1")
    port = os.getenv("POSTGRES_PORT", "5432")

    if not (db and user and password):
        return None

    conn_string = (
        f"postgresql://{user}:{password}@{host}:{port}/{db}"
    )

    try:
        # PostgresSaver needs an autocommit connection.
        conn = Connection.connect(
            conn_string,
            autocommit=True,
            row_factory=dict_row,
        )
        checkpointer = PostgresSaver(conn)
        # idempotent: creates the checkpoint tables if missing
        checkpointer.setup()
        return checkpointer
    except Exception:
        return None


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

    checkpointer = build_checkpointer()

    if checkpointer is None:
        from langgraph.checkpoint.memory import MemorySaver
        checkpointer = MemorySaver()

    return graph.compile(checkpointer=checkpointer)


food_graph = create_food_graph()
