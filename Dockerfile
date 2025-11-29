# Use Python 3.9-slim as the base image
FROM python:3.9-slim

# Install Node.js 18 and dependencies
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create and activate virtual environment
RUN python3 -m venv .venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy all files
COPY . .

# Install frontend dependencies and build
RUN npm install
RUN npm run build

# Install Python dependencies
RUN pip install --no-cache-dir -r backend_python/requirements.txt

# Set working directory to backend_python for running the app
WORKDIR /app/backend_python

# Expose the port
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
