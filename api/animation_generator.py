"""
Animation Generator Service
Extracts bone structure from GLB and generates Three.js animation code using OpenRouter
"""

import os
import json
import requests
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class AnimationGenerator:
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not set in environment")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://osce-webxr-poc.vercel.app",
            "X-Title": "OSCE WebXR Animation Generator"
        }
    
    def extract_bone_structure(self, bone_data: List[Dict]) -> str:
        """
        Format bone structure data for LLM prompt
        bone_data should be a list of dicts with: name, parent, position, rotation
        """
        formatted = json.dumps(bone_data, indent=2)
        return formatted
    
    def generate_animation_code(
        self, 
        bone_structure: str, 
        prompt: str,
        model: str = "anthropic/claude-3.5-sonnet"
    ) -> Dict[str, Any]:
        """
        Generate Three.js animation code from text prompt using OpenRouter
        
        Args:
            bone_structure: JSON string of bone hierarchy
            prompt: Natural language description of desired animation
            model: OpenRouter model identifier
            
        Returns:
            Dict with generated code and metadata
        """
        system_prompt = """You are a Three.js animation expert specializing in skeletal animation.

Given a bone hierarchy from a GLB model, generate executable Three.js code that animates the character based on the user's description.

Requirements:
1. Return ONLY executable JavaScript code, no markdown, no explanations
2. Use skeleton.getBoneByName('BoneName') to access bones
3. Use realistic human joint rotation limits (typically ±45-90 degrees for most joints)
4. For smooth animations, use THREE.AnimationClip or keyframe tracks
5. Return code that can be executed with: new Function('skeleton', 'THREE', code)(skeleton, THREE)
6. If the animation should loop or have duration, include that in the code
7. Use radians for rotations (Math.PI / 2 = 90 degrees)
8. Consider the bone hierarchy - child bones inherit parent transformations

Example output format:
```javascript
// Animation: [description]
const leftUpLeg = skeleton.getBoneByName('LeftUpLeg');
const rightUpLeg = skeleton.getBoneByName('RightUpLeg');
const spine = skeleton.getBoneByName('Spine');

// Create keyframe tracks for smooth animation
const duration = 2.0; // seconds
const times = [0, 1, 2];
const leftLegRotations = [0, Math.PI * 0.3, Math.PI * 0.4];
const rightLegRotations = [0, -Math.PI * 0.3, -Math.PI * 0.4];

// Apply rotations
leftUpLeg.rotation.z = Math.PI * 0.4;
rightUpLeg.rotation.z = -Math.PI * 0.4;
// Lower hips slightly
if (spine) spine.position.y -= 0.3;
```

Generate code that is safe, realistic, and follows Three.js best practices."""

        user_prompt = f"""Bone hierarchy:
{bone_structure}

Generate Three.js code to make this character: "{prompt}"

Return only the executable JavaScript code."""

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500  # Reduced to work with limited credits
        }
        
        try:
            response = requests.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            generated_code = result["choices"][0]["message"]["content"]
            
            # Clean up code (remove markdown if present)
            code = generated_code.strip()
            if code.startswith("```javascript"):
                code = code.replace("```javascript", "").replace("```js", "").replace("```", "").strip()
            elif code.startswith("```"):
                code = code.replace("```", "").strip()
            
            return {
                "code": code,
                "model": model,
                "prompt": prompt,
                "success": True
            }
            
        except Exception as e:
            return {
                "code": None,
                "error": str(e),
                "success": False
            }
    
    def validate_code(self, code: str) -> Dict[str, Any]:
        """
        Basic validation that code is safe to execute
        (In production, use a sandbox or more sophisticated validation)
        """
        # Check for dangerous patterns
        dangerous_patterns = [
            "eval(",
            "Function(",
            "require(",
            "import(",
            "fetch(",
            "XMLHttpRequest",
            "document.",
            "window.",
            "process."
        ]
        
        for pattern in dangerous_patterns:
            if pattern in code:
                return {
                    "valid": False,
                    "reason": f"Potentially unsafe pattern detected: {pattern}"
                }
        
        # Check that code uses skeleton and THREE
        if "skeleton" not in code and "getBoneByName" not in code:
            return {
                "valid": False,
                "reason": "Code must use skeleton.getBoneByName() to access bones"
            }
        
        return {
            "valid": True,
            "reason": "Code appears safe"
        }

# Global instance
animation_generator = AnimationGenerator() if OPENROUTER_API_KEY else None
