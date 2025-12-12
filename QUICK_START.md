# Quick Start Guide

## Manual Installation (Simplest)

If `make install-backend` isn't working, do this manually:

```bash
# From the root directory
cd api
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
cd ..
```

## Activate Virtual Environment

**From root directory:**
```bash
source api/venv/bin/activate
```

**From api directory:**
```bash
cd api
source venv/bin/activate
```

## Run Backend Manually

Once venv is activated:
```bash
# From root or api directory
cd api
python3 -m uvicorn main:app --reload --port 8000
```

## Run Frontend

In a separate terminal:
```bash
cd frontend
npm start
```

## Or Use Make (if it works)

```bash
make install-backend  # Install dependencies
make dev              # Start both services
```
