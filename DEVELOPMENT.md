# Development Guide

## Quick Start Commands

### Start the project (recommended for development)
```bash
make dev
```
This runs both frontend and backend in the foreground with auto-reload. Press `Ctrl+C` to stop.

### Start in background
```bash
make start
```
Runs both services in background. Use `make stop` to stop them.

### Stop the project
```bash
make stop
```

### View logs (when running in background)
```bash
tail -f logs/dev.log
```

## Individual Services

### Frontend only
```bash
make dev-frontend
# or
cd frontend && npm start
```
Frontend runs on: http://localhost:3000

### Backend only
```bash
make dev-backend
# or
cd api && python3 -m uvicorn main:app --reload --port 8000
```
Backend runs on: http://localhost:8000

## When You Make Changes

### Frontend Changes (TypeScript/HTML)
- **Auto-reload**: The frontend server watches for changes
- **Refresh browser**: Just refresh the page (F5 or Cmd+R)
- **Hard refresh**: If changes don't appear, do a hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Backend Changes (Python)
- **Auto-reload**: Backend uses `--reload` flag, so it auto-restarts on file changes
- **No action needed**: Changes are picked up automatically

### After Adding New Dependencies

**Frontend:**
```bash
cd frontend && npm install
```

**Backend:**
```bash
cd api && pip install -r requirements.txt
```

### After Adding New Assets
```bash
npm run copy-assets
# or
make start  # (automatically copies assets)
```

## Troubleshooting

### Backend not starting?
1. Check if Python dependencies are installed:
   ```bash
   cd api && pip install -r requirements.txt
   ```

2. Check if port 8000 is already in use:
   ```bash
   lsof -i :8000
   ```

3. Check backend logs:
   ```bash
   tail -f logs/dev.log | grep -i error
   ```

### Frontend not loading?
1. Make sure assets are copied:
   ```bash
   npm run copy-assets
   ```

2. Clear browser cache and hard refresh

3. Check browser console (F12) for errors

### Port already in use?
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

## Development Workflow

1. **Start development**: `make dev`
2. **Make changes** to code
3. **See changes automatically** (backend restarts, frontend refreshes)
4. **Test in browser**: http://localhost:3000
5. **Check backend**: http://localhost:8000/health
6. **Stop when done**: `Ctrl+C` or `make stop`

## Project Structure

```
osce-webxr-poc/
├── frontend/          # Frontend (Three.js + TypeScript)
│   ├── src/          # Source files
│   └── dist/         # Compiled output (auto-generated)
├── api/              # Backend (FastAPI + Python)
│   ├── main.py       # FastAPI server
│   └── .env          # Environment variables (API keys)
├── assets/           # GLB model files
└── logs/             # Log files (when running in background)
```

## Environment Variables

Make sure `api/.env` has:
```
OPENROUTER_API_KEY=your_key_here
```

Optional:
```
OPENAI_API_KEY=your_key_here
MESHY_API_KEY=your_key_here
```
