# Troubleshooting Guide

## Backend Installation Issues

### Python Version Issues

**Problem**: Installation fails with errors about pydantic-core or tiktoken requiring Rust.

**Solution**: Use Python 3.11 (recommended) instead of Python 3.14:

```bash
# Remove old venv
rm -rf api/venv

# Install with Python 3.11
cd api
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Or use the Makefile which automatically uses Python 3.11:
```bash
make install-backend
```

### Missing Rust Compiler

**Problem**: Error "can't find Rust compiler" when installing tiktoken or pydantic-core.

**Solution**: 
1. Use Python 3.11 (see above) - pre-built wheels are available
2. Or install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### Port Already in Use

**Problem**: Port 3000 or 8000 is already in use.

**Solution**:
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Or use make stop
make stop
```

## Frontend Issues

### Assets Not Loading

**Problem**: GLB files not found (404 errors).

**Solution**:
```bash
# Copy assets manually
npm run copy-assets

# Or rebuild
cd frontend && npm run build
```

### Changes Not Appearing

**Solution**: 
1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Check browser console (F12) for errors

## Backend Issues

### Backend Not Starting

**Problem**: Backend fails to start or returns errors.

**Solution**:
1. Check if dependencies are installed:
   ```bash
   cd api
   source venv/bin/activate
   pip list
   ```

2. Check if port 8000 is available:
   ```bash
   lsof -i :8000
   ```

3. Check logs:
   ```bash
   tail -f logs/dev.log
   ```

4. Test backend manually:
   ```bash
   cd api
   source venv/bin/activate
   python3 -m uvicorn main:app --reload --port 8000
   ```

### API Endpoints Not Working

**Problem**: `/api/chat` or other endpoints return errors.

**Solution**:
1. Check if `api/.env` exists and has `OPENROUTER_API_KEY`
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check backend logs for errors

## Common Commands

```bash
# Full reset
make stop
rm -rf api/venv frontend/dist
make install
make dev

# Check what's running
lsof -i :3000
lsof -i :8000

# View logs
tail -f logs/dev.log
```
