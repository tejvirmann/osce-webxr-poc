"""
LangGraph agent for iterative scene/character generation
Handles prompt refinement and regeneration based on feedback
"""

from typing import TypedDict, Annotated, Optional
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
import os
from dotenv import load_dotenv
from generation_api import generation_api

load_dotenv()

# State for generation workflow
class GenerationState(TypedDict):
    original_prompt: str
    current_prompt: str
    feedback: str
    generation_history: list
    task_id: Optional[str]
    model_url: Optional[str]

# Initialize LLM for prompt refinement - use OpenRouter if available, otherwise OpenAI
openrouter_key = os.getenv("OPENROUTER_API_KEY")
openai_key = os.getenv("OPENAI_API_KEY")

if openrouter_key:
    # Use OpenRouter with Claude via OpenAI-compatible API
    llm = ChatOpenAI(
        model="anthropic/claude-3.5-sonnet",
        temperature=0.7,
        openai_api_key=openrouter_key,
        openai_api_base="https://openrouter.ai/api/v1",
        max_tokens=300,  # Reduced to work with limited credits
        default_headers={
            "HTTP-Referer": "https://osce-webxr-poc.vercel.app",
            "X-Title": "OSCE WebXR Generation"
        }
    )
elif openai_key:
    # Fallback to OpenAI if OpenRouter not available
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        api_key=openai_key
    )
else:
    # No API key - will use fallback responses
    llm = None

def refine_prompt_agent(state: GenerationState) -> GenerationState:
    """
    Agent that refines prompts based on feedback
    Takes user feedback and improves the generation prompt
    """
    original = state.get("original_prompt", "")
    current = state.get("current_prompt", original)
    feedback = state.get("feedback", "")
    
    if not feedback:
        # First generation, use original prompt
        state["current_prompt"] = original
        return state
    
    # Refine prompt based on feedback
    refinement_prompt = f"""You are helping refine a 3D character/scene generation prompt.

Original prompt: {original}
Current prompt: {current}
User feedback: {feedback}

Generate an improved prompt that addresses the feedback while maintaining the core intent.
The prompt should be:
- Specific and detailed
- Include style, appearance, and pose/arrangement details
- Optimized for 3D generation (mention materials, lighting, composition)
- Keep it concise (under 200 words)

Return only the improved prompt, no explanation."""

    if llm is None:
        # Fallback: simple prompt improvement without LLM
        if feedback:
            refined_prompt = f"{current}. {feedback}"
        else:
            refined_prompt = original
    else:
        from langchain_core.messages import SystemMessage, HumanMessage
        response = llm.invoke([
            SystemMessage(content="You are a prompt engineering expert for 3D generation."),
            HumanMessage(content=refinement_prompt)
        ])
        
        refined_prompt = response.content.strip()
    state["current_prompt"] = refined_prompt
    
    # Add to history
    history = state.get("generation_history", [])
    history.append({
        "prompt": refined_prompt,
        "feedback": feedback,
        "iteration": len(history) + 1
    })
    state["generation_history"] = history
    
    return state

def generate_agent(state: GenerationState) -> GenerationState:
    """
    Agent that triggers generation with refined prompt
    """
    prompt = state.get("current_prompt", "")
    generation_type = state.get("generation_type", "character")  # character or scene
    
    if not generation_api:
        raise ValueError("MESHY_API_KEY not configured")
    
    try:
        if generation_type == "character":
            result = generation_api.generate_character(prompt)
            state["task_id"] = result.get("result")
        else:
            result = generation_api.generate_scene(prompt)
            state["task_id"] = result.get("task_id")
        
        state["generation_status"] = "processing"
    except Exception as e:
        state["generation_status"] = "error"
        state["error"] = str(e)
    
    return state

def create_generation_graph():
    """Create LangGraph for iterative generation workflow"""
    workflow = StateGraph(GenerationState)
    
    workflow.add_node("refine_prompt", refine_prompt_agent)
    workflow.add_node("generate", generate_agent)
    
    workflow.set_entry_point("refine_prompt")
    workflow.add_edge("refine_prompt", "generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()

# Create graph instance
generation_graph = create_generation_graph()

def process_generation_request(original_prompt: str, feedback: str = "", generation_type: str = "character") -> dict:
    """
    Process a generation request with optional feedback for refinement
    """
    initial_state = {
        "original_prompt": original_prompt,
        "current_prompt": original_prompt,
        "feedback": feedback,
        "generation_history": [],
        "task_id": None,
        "model_url": None,
        "generation_type": generation_type
    }
    
    result = generation_graph.invoke(initial_state)
    
    return {
        "refined_prompt": result.get("current_prompt"),
        "task_id": result.get("task_id"),
        "status": result.get("generation_status", "processing"),
        "history": result.get("generation_history", [])
    }

