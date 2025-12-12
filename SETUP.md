# Setup Instructions - v0

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (for local dev)
cd ../api
pip install -r requirements.txt
```

### 2. Run Locally

**Option A: Frontend only (uses Vercel serverless functions in production)**
```bash
cd frontend
npm start
# Open http://localhost:3000
```

**Option B: Frontend + Local Backend (for development)**
```bash
# Terminal 1 - Frontend
cd frontend
npm start

# Terminal 2 - Backend
cd api
python -m uvicorn main:app --reload --port 8000
```

### 3. Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

## Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Vercel will auto-detect:
     - Frontend build from `frontend/`
     - Python serverless functions from `api/`

## Project Structure

```
osce-webxr-poc/
├── frontend/          # TypeScript + Three.js frontend
│   ├── src/
│   │   ├── main.ts   # Entry point
│   │   ├── scene.ts  # Three.js scene manager
│   │   └── api.ts    # API client
│   ├── index.html
│   └── package.json
├── api/              # Python serverless functions (Vercel)
│   ├── chat.py       # Chat endpoint (serverless function)
│   ├── main.py       # FastAPI server (for local dev)
│   └── requirements.txt
├── vercel.json       # Vercel configuration
└── package.json      # Root npm scripts
```

## What's Included in v0

✅ Basic Three.js 3D scene  
✅ Placeholder character (cube)  
✅ Text input → Backend → Character response  
✅ Simple rule-based responses (no LLM yet)  
✅ WebXR-ready structure (WebXR coming in Phase 1)  
✅ Vercel deployment ready  

## Next Steps (Phase 1)

- [ ] Add LangGraph orchestration
- [ ] Integrate OpenAI API for LLM responses
- [ ] Add WebXR support
- [ ] Load actual 3D character models (GLB)
- [ ] Add voice input/output

## Troubleshooting

**Frontend won't start:**
- Make sure you're in the `frontend/` directory
- Run `npm install` first

**Backend errors:**
- Make sure Python 3.9+ is installed
- Install dependencies: `pip install -r requirements.txt`

**Vercel deployment issues:**
- Check `vercel.json` configuration
- Ensure Python runtime is specified in `vercel.json`
- Check Vercel logs in dashboard



