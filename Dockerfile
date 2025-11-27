# Stage 1: Build the frontend
FROM node:18 AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the Python backend
FROM python:3.9-slim

WORKDIR /app

# Create and activate virtual environment
RUN python3 -m venv .venv
ENV PATH="/app/.venv/bin:$PATH"

# Install Python dependencies
COPY backend_python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and the built frontend
COPY --from=frontend /app/dist ./dist
COPY backend_python .

EXPOSE 8000

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
