.PHONY: help install install-frontend install-backend build dev dev-frontend dev-backend start stop clean

# Default target
help:
	@echo "OSCE WebXR POC - Makefile Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install all dependencies (frontend + backend)"
	@echo "  make install-frontend - Install frontend dependencies only"
	@echo "  make install-backend  - Install backend dependencies only"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Run both frontend and backend (recommended)"
	@echo "  make dev-frontend     - Run frontend only (port 3000)"
	@echo "  make dev-backend      - Run backend only (port 8000)"
	@echo ""
	@echo "Build:"
	@echo "  make build            - Build frontend for production"
	@echo ""
	@echo "Management:"
	@echo "  make start            - Start both services (background)"
	@echo "  make stop             - Stop all running services"
	@echo "  make clean            - Clean build artifacts and node_modules"
	@echo ""

# Install dependencies
install: install-frontend install-backend

install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install-backend:
	@echo "Installing backend dependencies..."
	cd api && python3.11 -m pip install -r requirements.txt

# Build
build:
	@echo "Building frontend..."
	cd frontend && npm run build

# Development servers
dev: stop
	@echo "Starting frontend and backend..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000"
	@echo "Press Ctrl+C to stop"
	npm run dev

dev-frontend: stop-frontend
	@echo "Starting frontend only..."
	@echo "Frontend: http://localhost:3000"
	@echo "Press Ctrl+C to stop"
	cd frontend && npm start

dev-backend: stop-backend
	@echo "Starting backend only..."
	@echo "Backend: http://localhost:8000"
	@echo "Press Ctrl+C to stop"
	cd api && python3.11 -m uvicorn main:app --reload --port 8000

# Start in background (using nohup)
start: stop
	@echo "Starting services in background..."
	@mkdir -p logs
	nohup npm run dev > logs/dev.log 2>&1 & echo $$! > .dev.pid
	@echo "Services started. PID: $$(cat .dev.pid)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000"
	@echo "Logs: tail -f logs/dev.log"
	@echo "Stop: make stop"
	@sleep 2
	@echo ""
	@echo "Checking if services started..."
	@curl -s http://localhost:8000/health > /dev/null && echo "✅ Backend is running" || echo "⚠️  Backend may not be running - check logs: tail -f logs/dev.log"

# Stop services
stop:
	@echo "Stopping services..."
	@if [ -f .dev.pid ]; then \
		kill $$(cat .dev.pid) 2>/dev/null || true; \
		rm .dev.pid; \
		echo "Stopped background services"; \
	fi
	@pkill -f "http-server.*3000" 2>/dev/null || true
	@pkill -f "uvicorn.*8000" 2>/dev/null || true
	@pkill -f "concurrently" 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@echo "All services stopped"

stop-frontend:
	@pkill -f "http-server.*3000" 2>/dev/null || true
	@echo "Frontend stopped"

stop-backend:
	@pkill -f "uvicorn.*8000" 2>/dev/null || true
	@echo "Backend stopped"

# Clean
clean:
	@echo "Cleaning..."
	@make stop
	@rm -rf frontend/node_modules
	@rm -rf frontend/dist
	@rm -rf node_modules
	@rm -rf logs
	@rm -f .dev.pid
	@echo "Clean complete"

