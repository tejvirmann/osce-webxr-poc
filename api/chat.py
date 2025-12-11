"""
Vercel serverless function for chat endpoint
Handles LLM orchestration (will use LangGraph in Phase 1)
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from typing import Optional

# Simple state (will be replaced with LangGraph state graph in Phase 1)
character_state = {
    "anxiety_level": 5,
    "trust_level": 5,
    "pain_level": 7,
    "personality": "anxious, sarcastic"
}

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Health check and state endpoints"""
        if self.path == '/api/chat' or self.path == '/api/state':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(character_state).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle chat requests"""
        if self.path == '/api/chat':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                user_message = request_data.get('message', '').lower()
                
                # Simple rule-based responses for v0
                # In Phase 1, this will use LangGraph + LLM
                if "hello" in user_message or "hi" in user_message:
                    response_text = "Hello, doctor. I'm feeling quite anxious about this examination."
                elif "how are you" in user_message or "how do you feel" in user_message:
                    response_text = f"I'm in pain, level {character_state['pain_level']} out of 10. And I'm worried."
                elif "nervous" in user_message or "anxious" in user_message:
                    response_text = "Yes, I can see you're nervous. That makes me even more anxious. Are you sure you know what you're doing?"
                else:
                    response_text = "I'm listening, doctor. Please continue."
                
                response = {
                    "message": response_text,
                    "emotion": "anxious"
                }
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
