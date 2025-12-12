# OSCE WebXR POC

VR OSCE Trainer for med students, easily create persona/scenario generatively via LLMs.

## 📖 Vision Document

For a complete overview of the project vision, technology stack, and implementation approach, see **[VISION.md](./VISION.md)**.

## Quick Summary

AI-driven interactive 3D scenes for medical training (OSCE scenarios) using:
- **WebXR** for multi-platform deployment (laptop, VR headset, phone)
- **LLM orchestration** (LangGraph + GPT-4o/Gemini) for dynamic character behaviors
- **Generative 3D assets** (World Labs Marble, Meshy AI, Meta SAM 3D)
- **Voice interactions** (OpenAI Realtime API)
- **Natural animations** (NVIDIA ACE, PantoMatrix/Mootion)

All running in the browser—no app installation required.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (or Python 3.x)
- OpenRouter API key (for chat and animations)

### Installation

1. **Install all dependencies:**

```bash
# Install everything (recommended)
make install

# Or install separately:
make install-frontend  # Frontend dependencies
make install-backend   # Backend dependencies (creates venv automatically)
```

2. **Set up environment variables:**

Create `api/.env` file:
```bash
OPENROUTER_API_KEY=your_openrouter_key_here
```

Optional (for additional features):
```
OPENAI_API_KEY=your_openai_key_here
MESHY_API_KEY=your_meshy_key_here
```

3. **Start development servers:**

**Recommended (foreground with auto-reload):**
```bash
make dev
```
Press `Ctrl+C` to stop.

**Or start in background:**
```bash
make start    # Start in background
make stop     # Stop services
tail -f logs/dev.log  # View logs
```

This will start:
- Frontend on `http://localhost:3000`
- Backend API on `http://localhost:8000`

### Quick Commands

```bash
make dev          # Start both (foreground, auto-reload)
make start        # Start both (background)
make stop         # Stop all services
make dev-frontend # Frontend only
make dev-backend  # Backend only
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide.

## 📁 Project Structure

```
osce-webxr-poc/
├── frontend/          # Frontend (Three.js + WebXR)
│   ├── src/
│   │   ├── main.ts   # Entry point
│   │   ├── scene.ts  # Three.js scene management
│   │   └── api.ts    # API client
│   ├── index.html
│   └── package.json
├── api/               # Backend (FastAPI + LangGraph)
│   ├── main.py       # FastAPI server
│   └── requirements.txt
├── vercel.json       # Vercel deployment config
└── package.json      # Root package.json
```

## 🚢 Deployment

### Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

Vercel will automatically:
- Deploy frontend from `/frontend`
- Deploy backend API from `/api` as serverless functions

3. **Set environment variables in Vercel dashboard:**
- `OPENAI_API_KEY`

## 🎯 Current Status: v0

**Phase 0 - Minimal Viable Prototype:**
- ✅ Basic Three.js scene
- ✅ Simple character placeholder
- ✅ HTTP API endpoint
- ✅ Basic chat interface
- ⏳ LangGraph integration (Phase 1)
- ⏳ Voice input/output (Phase 1)
- ⏳ Face tracking (Phase 2)
- ⏳ WebXR support (Phase 1)

## 📝 Development Roadmap

See [VISION.md](./VISION.md) for detailed roadmap.

## 🔧 Tech Stack

- **Frontend**: TypeScript, Three.js, WebXR
- **Backend**: Python, FastAPI, LangGraph
- **Deployment**: Vercel (serverless)
- **AI**: OpenAI GPT-4o, LangChain

## 📄 License

MIT
