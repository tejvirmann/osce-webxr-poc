"""
FastAPI server for OSCE WebXR POC
Handles LLM orchestration via LangGraph
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

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

# Simple state (will be replaced with LangGraph state graph in Phase 1)
character_state = {
    "anxiety_level": 5,
    "trust_level": 5,
    "pain_level": 7,
    "personality": "anxious, sarcastic"
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
    Simple chat endpoint - will be replaced with LangGraph orchestration
    """
    try:
        # For v0, return a simple response
        # In Phase 1, this will use LangGraph + LLM
        
        user_message = request.message.lower()
        
        # Simple rule-based responses for v0
        if "hello" in user_message or "hi" in user_message:
            response = "Hello, doctor. I'm feeling quite anxious about this examination."
        elif "how are you" in user_message or "how do you feel" in user_message:
            response = f"I'm in pain, level {character_state['pain_level']} out of 10. And I'm worried."
        elif "nervous" in user_message or "anxious" in user_message:
            response = "Yes, I can see you're nervous. That makes me even more anxious. Are you sure you know what you're doing?"
        else:
            response = "I'm listening, doctor. Please continue."
        
        return ChatResponse(
            message=response,
            emotion="anxious"
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

# For Vercel serverless functions
# Vercel will automatically detect Python files in /api folder
def handler(request):
    """Vercel serverless function handler"""
    return app

