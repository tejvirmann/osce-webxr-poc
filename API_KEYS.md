# API Keys & Setup Guide

This project uses these external services:

## Required for AI Dialogue (LangGraph)
- `OPENAI_API_KEY` — OpenAI API key (used for LangGraph agents and prompt refinement).

## Required for Generative 3D (Meshy AI)
- `MESHY_API_KEY` — Meshy API key for prompt-based text-to-3D generation (characters; scenes coming soon).

## Required for Animation Generation (OpenRouter)
- `OPENROUTER_API_KEY` — OpenRouter API key for generating Three.js animation code from text prompts using LLMs.

## Optional / Future
- World Labs Marble API — for full room/scene generation (not wired yet).
- Other model providers (Luma/Tripo/ReadyPlayerMe) — not wired yet.

## Where to put them
- Local dev: create `api/.env`
  ```
  OPENAI_API_KEY=your_openai_key_here
  MESHY_API_KEY=your_meshy_key_here
  OPENROUTER_API_KEY=your_openrouter_key_here
  ```
- Vercel: add Environment Variables in the dashboard with the same names (`OPENAI_API_KEY`, `MESHY_API_KEY`, `OPENROUTER_API_KEY`).

## Current Backend Setup
- FastAPI server in `/api/main.py`
- LangGraph agents:
  - `langgraph_agent.py` — 2-agent graph for character dialogue/state
  - `generation_agent.py` — prompt refinement for 3D generation
- Generation API (Meshy): `generation_api.py`
- Endpoints:
  - `POST /api/chat` — dialogue (LangGraph; falls back to rules if no OpenAI key)
  - `POST /api/generate` — generate 3D asset from prompt (Meshy + LangGraph refinement)
  - `POST /api/generate/refine` — regenerate with feedback
  - `GET /api/generate/status/{task_id}` — poll generation status
  - `POST /api/config` / `GET /api/config` — character config
  - `POST /api/animation/generate` — generate Three.js animation code from text prompt (OpenRouter)

## Frontend Setup
- Three.js + WebXR
- Quality toggle button (🌗) — switches between default and high-quality preset
- Config panel:
  - Scene colors
  - Character prompt & reaction rules
  - Generative section (prompt input, progress, feedback, load model)
- Animation panel:
  - Select character from loaded models
  - Text prompt for animation (e.g., "do the splits", "wave hello")
  - AI generates Three.js code and applies to character skeleton
- Asset loader supports Draco + KTX2 (compressed glTF/GLB)
- HDRI lighting, ACES tone mapping enabled

## Alternatives / Notes
- If you don’t set `OPENAI_API_KEY`: dialogue falls back to simple rule-based responses.
- If you don’t set `MESHY_API_KEY`: generative character creation won’t work; use your own GLB assets via the loader instead.
- Scenes: scene generation via World Labs Marble can be added; currently stubbed.




- If you don't set `OPENROUTER_API_KEY`: animation generation won't work; you'll need to manually animate characters.
- Animation: The system loads `person_0.glb` and `person_1.glb` from the `assets/` folder. Place your GLB files there.
