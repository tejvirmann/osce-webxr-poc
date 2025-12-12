"""
LangGraph agent implementation for character control
Uses 1-2 agents to manage patient behavior and responses
"""

from typing import TypedDict, Annotated
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
import operator
import os
from dotenv import load_dotenv

load_dotenv()

# State definition
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    character_prompt: str
    reaction_rules: str
    character_state: dict
    user_message: str

# Initialize LLM - use OpenRouter if available, otherwise OpenAI
openrouter_key = os.getenv("OPENROUTER_API_KEY")
openai_key = os.getenv("OPENAI_API_KEY")

if openrouter_key:
    # Use OpenRouter with Claude via OpenAI-compatible API
    # OpenRouter uses OpenAI-compatible endpoints
    try:
        llm = ChatOpenAI(
            model="anthropic/claude-3.5-sonnet",
            temperature=0.7,
            openai_api_key=openrouter_key,
            openai_api_base="https://openrouter.ai/api/v1",
            max_tokens=300,  # Reduced to work with limited credits
            default_headers={
                "HTTP-Referer": "https://osce-webxr-poc.vercel.app",
                "X-Title": "OSCE WebXR Chat"
            }
        )
        # Test the connection (will fail silently if key is invalid)
        print("✅ OpenRouter LLM initialized")
    except Exception as e:
        print(f"⚠️  Failed to initialize OpenRouter LLM: {e}")
        llm = None
elif openai_key:
    # Fallback to OpenAI if OpenRouter not available
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        openai_api_key=openai_key
    )
else:
    # No API key - will use fallback responses
    llm = None
    print("⚠️  No API keys found - using fallback responses")

# Agent 1: Character Behavior Agent
def character_agent(state: AgentState) -> AgentState:
    """Agent that controls character behavior based on prompt and rules"""
    character_prompt = state.get("character_prompt", "65-year-old patient, anxious, pain level 7, sarcastic personality")
    reaction_rules = state.get("reaction_rules", "")
    user_message = state.get("user_message", "")
    character_state = state.get("character_state", {
        "anxiety_level": 5,
        "trust_level": 5,
        "pain_level": 7
    })
    
    # Build prompt for character agent
    system_prompt = f"""You are a patient in a medical examination scenario.

Character Description: {character_prompt}

Current State:
- Anxiety Level: {character_state.get('anxiety_level', 5)}/10
- Trust Level: {character_state.get('trust_level', 5)}/10
- Pain Level: {character_state.get('pain_level', 7)}/10

Reaction Rules:
{reaction_rules if reaction_rules else "Respond naturally based on your character description."}

The doctor just said: "{user_message}"

Respond as this patient would, considering your current emotional state and the reaction rules.
Keep responses concise (1-2 sentences)."""

    from langchain_core.messages import SystemMessage, HumanMessage
    
    response = None
    if llm is None:
        # Fallback response if no LLM available
        character_response = "I'm listening, doctor. Please continue."
        # Create a mock message for state tracking
        from langchain_core.messages import AIMessage
        response = AIMessage(content=character_response)
    else:
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message)
            ]
            
            response = llm.invoke(messages)
            character_response = response.content
        except Exception as e:
            # If LLM call fails, use fallback
            print(f"⚠️  LLM call failed: {e}")
            character_response = f"I'm listening, doctor. (Note: AI response unavailable - {str(e)[:50]})"
            # Create a mock message for state tracking
            from langchain_core.messages import AIMessage
            response = AIMessage(content=character_response)
    
    # Update state (response is now guaranteed to be defined)
    if response:
        state["messages"] = state.get("messages", []) + [response]
    
    return state

# Agent 2: State Manager Agent
def state_manager_agent(state: AgentState) -> AgentState:
    """Agent that updates character state based on interaction"""
    user_message = state.get("user_message", "").lower()
    character_state = state.get("character_state", {
        "anxiety_level": 5,
        "trust_level": 5,
        "pain_level": 7
    })
    
    # Simple state updates based on keywords (can be enhanced with LLM)
    if "nervous" in user_message or "anxious" in user_message:
        character_state["anxiety_level"] = min(10, character_state.get("anxiety_level", 5) + 1)
        character_state["trust_level"] = max(0, character_state.get("trust_level", 5) - 1)
    elif "calm" in user_message or "confident" in user_message or "reassuring" in user_message:
        character_state["anxiety_level"] = max(0, character_state.get("anxiety_level", 5) - 1)
        character_state["trust_level"] = min(10, character_state.get("trust_level", 5) + 1)
    
    state["character_state"] = character_state
    return state

# Build the graph
def create_agent_graph():
    """Create LangGraph state graph with 2 agents"""
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("character_agent", character_agent)
    workflow.add_node("state_manager", state_manager_agent)
    
    # Set entry point
    workflow.set_entry_point("character_agent")
    
    # Add edges
    workflow.add_edge("character_agent", "state_manager")
    workflow.add_edge("state_manager", END)
    
    # Compile graph
    app = workflow.compile()
    return app

# Create the graph instance
agent_graph = create_agent_graph()

def process_message(user_message: str, character_prompt: str = "", reaction_rules: str = "", character_state: dict = None) -> dict:
    """Process a user message through the LangGraph agents"""
    if character_state is None:
        character_state = {
            "anxiety_level": 5,
            "trust_level": 5,
            "pain_level": 7
        }
    
    initial_state = {
        "messages": [],
        "character_prompt": character_prompt,
        "reaction_rules": reaction_rules,
        "character_state": character_state,
        "user_message": user_message
    }
    
    # Run the graph
    result = agent_graph.invoke(initial_state)
    
    # Get the last message (character response)
    messages = result.get("messages", [])
    if messages:
        # Messages are AIMessage objects, access .content attribute
        last_message = messages[-1]
        character_response = last_message.content if hasattr(last_message, 'content') else str(last_message)
    else:
        character_response = "I'm listening, doctor."
    
    return {
        "message": character_response,
        "emotion": "anxious" if result["character_state"]["anxiety_level"] > 5 else "calm",
        "character_state": result["character_state"]
    }

