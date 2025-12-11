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
    try:
        # Check if OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
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
        
        # Use LangGraph agents
        result = process_message(
            user_message=request.message,
            character_prompt=character_config.get("prompt", ""),
            reaction_rules=character_config.get("rules", ""),
            character_state=character_state.copy()
        )
        
        # Update global character state
        global character_state
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

# For Vercel serverless functions
# Vercel will automatically detect Python files in /api folder
def handler(request):
    """Vercel serverless function handler"""
    return app

