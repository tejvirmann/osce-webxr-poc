"""
FastAPI server for OSCE WebXR POC
Handles LLM orchestration via LangGraph
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import os
from dotenv import load_dotenv
from langgraph_agent import process_message
from generation_agent import process_generation_request
from generation_api import generation_api
from animation_generator import animation_generator

# Load environment variables
load_dotenv()

app = FastAPI(title="OSCE WebXR API", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    emotion: Optional[str] = None
    character_state: Optional[Dict] = None

class CharacterConfigRequest(BaseModel):
    prompt: Optional[str] = ""
    rules: Optional[str] = ""

class GenerationRequest(BaseModel):
    prompt: str
    feedback: Optional[str] = ""
    generation_type: Optional[str] = "character"  # "character" or "scene"

class GenerationFeedbackRequest(BaseModel):
    task_id: str
    feedback: str
    original_prompt: str

class AnimationRequest(BaseModel):
    bone_structure: list  # List of bone objects with name, parent, position, rotation
    prompt: str  # Natural language description of animation
    model: Optional[str] = "anthropic/claude-3.5-sonnet"

# Character state and configuration
character_state = {
    "anxiety_level": 5,
    "trust_level": 5,
    "pain_level": 7,
    "personality": "anxious, sarcastic"
}

character_config = {
    "prompt": "65-year-old patient, anxious, pain level 7, sarcastic personality",
    "rules": "If doctor is nervous, become more anxious. If doctor is calm and reassuring, trust increases."
}

@app.get("/")
async def root():
    return {
        "message": "OSCE WebXR API",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint using LangGraph with 2 agents
    """
    global character_state  # Declare global at the start of the function
    
    try:
        # Check if we have any API key (OpenRouter or OpenAI)
        has_openrouter = bool(os.getenv("OPENROUTER_API_KEY"))
        has_openai = bool(os.getenv("OPENAI_API_KEY"))
        
        if not has_openrouter and not has_openai:
            # Fallback to simple responses if no API key
            user_message = request.message.lower()
            if "hello" in user_message or "hi" in user_message:
                response = "Hello, doctor. I'm feeling quite anxious about this examination."
            elif "how are you" in user_message or "how do you feel" in user_message:
                response = f"I'm in pain, level {character_state['pain_level']} out of 10. And I'm worried."
            else:
                response = "I'm listening, doctor. Please continue."
            
            return ChatResponse(
                message=response,
                emotion="anxious",
                character_state=character_state
            )
        
        # Use LangGraph agents (will use OpenRouter if available, otherwise OpenAI)
        result = process_message(
            user_message=request.message,
            character_prompt=character_config.get("prompt", ""),
            reaction_rules=character_config.get("rules", ""),
            character_state=character_state.copy()
        )
        
        # Update global character state
        character_state.update(result.get("character_state", character_state))
        
        return ChatResponse(
            message=result["message"],
            emotion=result.get("emotion", "anxious"),
            character_state=result.get("character_state", character_state)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/state")
async def get_state():
    """Get current character state"""
    return character_state

@app.post("/api/state")
async def update_state(state: dict):
    """Update character state (for future use)"""
    global character_state
    character_state.update(state)
    return character_state

@app.post("/api/config")
async def update_character_config(request: CharacterConfigRequest):
    """Update character configuration (prompt and reaction rules)"""
    global character_config
    if request.prompt:
        character_config["prompt"] = request.prompt
    if request.rules:
        character_config["rules"] = request.rules
    return {
        "status": "updated",
        "config": character_config
    }

@app.get("/api/config")
async def get_character_config():
    """Get current character configuration"""
    return character_config

@app.post("/api/generate")
async def generate_asset(request: GenerationRequest):
    """
    Generate 3D character or scene from prompt
    Uses LangGraph agent to refine prompt based on feedback
    """
    try:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY not configured")
        
        # Process through generation agent (refines prompt if feedback provided)
        result = process_generation_request(
            original_prompt=request.prompt,
            feedback=request.feedback or "",
            generation_type=request.generation_type
        )
        
        return {
            "status": "processing",
            "task_id": result["task_id"],
            "refined_prompt": result["refined_prompt"],
            "message": "Generation started. Use /api/generate/status/{task_id} to check progress."
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/refine")
async def refine_and_regenerate(request: GenerationFeedbackRequest):
    """
    Provide feedback on generated asset and regenerate with improved prompt
    """
    try:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY not configured")
        
        # Process feedback through generation agent
        result = process_generation_request(
            original_prompt=request.original_prompt,
            feedback=request.feedback,
            generation_type="character"  # Could be determined from task_id
        )
        
        return {
            "status": "processing",
            "task_id": result["task_id"],
            "refined_prompt": result["refined_prompt"],
            "message": f"Regenerating with improved prompt based on feedback: '{request.feedback}'"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate/status/{task_id}")
async def get_generation_status(task_id: str):
    """Check status of generation task"""
    try:
        if not generation_api:
            raise HTTPException(status_code=400, detail="MESHY_API_KEY not configured")
        
        status = generation_api.check_generation_status(task_id)
        model_url = generation_api.get_model_url(task_id) if status.get("status") == "SUCCEEDED" else None
        
        return {
            "task_id": task_id,
            "status": status.get("status"),
            "model_url": model_url,
            "progress": status.get("progress", 0)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/animation/generate")
async def generate_animation(request: AnimationRequest):
    """
    Generate Three.js animation code from text prompt
    Requires bone structure extracted from GLB model
    """
    try:
        if not animation_generator:
            raise HTTPException(status_code=400, detail="OPENROUTER_API_KEY not configured")
        
        # Format bone structure
        bone_structure_str = animation_generator.extract_bone_structure(request.bone_structure)
        
        # Generate code
        result = animation_generator.generate_animation_code(
            bone_structure=bone_structure_str,
            prompt=request.prompt,
            model=request.model
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
        
        # Validate code
        validation = animation_generator.validate_code(result["code"])
        
        return {
            "code": result["code"],
            "validation": validation,
            "prompt": request.prompt,
            "model": result["model"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For Vercel serverless functions
# Vercel will automatically detect Python files in /api folder
def handler(request):
    """Vercel serverless function handler"""
    return app

