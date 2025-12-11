"""
Generative scene and character generation API
Uses Meshy AI for text-to-3D generation
"""

import os
import requests
import time
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

MESHY_API_KEY = os.getenv("MESHY_API_KEY")
MESHY_BASE_URL = "https://api.meshy.ai/v2"

class GenerationAPI:
    def __init__(self):
        self.api_key = MESHY_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def generate_character(self, prompt: str, style: str = "realistic") -> Dict:
        """
        Generate a 3D character from text prompt
        Returns task ID for polling
        """
        if not self.api_key:
            raise ValueError("MESHY_API_KEY not set in environment")
        
        url = f"{MESHY_BASE_URL}/text-to-3d"
        payload = {
            "mode": 1,  # Full body character
            "prompt": prompt,
            "art_style": style,
            "negative_prompt": "low quality, blurry, distorted"
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def generate_scene(self, prompt: str) -> Dict:
        """
        Generate a 3D scene from text prompt
        Note: Meshy primarily does characters. For scenes, we might use alternative APIs
        """
        # For now, return a placeholder - can integrate World Labs Marble API later
        return {
            "status": "pending",
            "message": "Scene generation coming soon. Use character generation for now."
        }
    
    def check_generation_status(self, task_id: str) -> Dict:
        """Check status of generation task"""
        if not self.api_key:
            raise ValueError("MESHY_API_KEY not set")
        
        url = f"{MESHY_BASE_URL}/text-to-3d/{task_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        return response.json()
    
    def get_model_url(self, task_id: str) -> Optional[str]:
        """Get download URL for generated model"""
        status = self.check_generation_status(task_id)
        
        if status.get("status") == "SUCCEEDED":
            result = status.get("result")
            if result:
                return result.get("model_urls", {}).get("glb")
        
        return None
    
    def wait_for_generation(self, task_id: str, max_wait: int = 300) -> Optional[str]:
        """
        Poll for generation completion
        Returns GLB URL when ready, None if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            status = self.check_generation_status(task_id)
            current_status = status.get("status")
            
            if current_status == "SUCCEEDED":
                return self.get_model_url(task_id)
            elif current_status == "FAILED":
                raise Exception(f"Generation failed: {status.get('error', 'Unknown error')}")
            
            time.sleep(5)  # Poll every 5 seconds
        
        return None

# Global instance
generation_api = GenerationAPI() if MESHY_API_KEY else None

