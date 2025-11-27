# Stage 1: Build the client-side application
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# Stage 2: Create the Python server runtime
FROM python:3.9-slim
WORKDIR /app
COPY --from=builder /app/backend_python .
RUN pip install --no-cache-dir -r requirements.txt
ENV PORT 8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
