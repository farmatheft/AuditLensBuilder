#!/bin/bash

# Build frontend
echo "Building frontend..."
npm run build

# Start backend server
echo "Starting server on port 8000..."
.venv/bin/uvicorn backend_python.main:app --host 0.0.0.0 --port 8000
