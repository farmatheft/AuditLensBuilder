# Stage 1: Build the frontend
FROM node:18 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The build output is configured in vite.config.ts to go to backend_python/dist/public
RUN npm run build

# Stage 2: Setup the Python backend
FROM python:3.9-slim

WORKDIR /app

# Create and activate virtual environment
RUN python3 -m venv .venv
ENV PATH="/app/.venv/bin:$PATH"

# Install Python dependencies
COPY backend_python .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend assets
# Source: /app/backend_python/dist/public (from Stage 1)
# Dest: /app/dist/public (to match main.py expectation)
COPY --from=frontend /app/backend_python/dist/public ./dist/public

EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
