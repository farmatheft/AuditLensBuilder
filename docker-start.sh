#!/bin/bash

echo "🚀 Starting AuditLens with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "📦 Building and starting services..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T app npm run db:push

echo "✅ AuditLens is ready!"
echo "🌐 Access the application at: http://localhost:5000"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f app"
echo "  Stop services:    docker-compose down"
echo "  Restart:          docker-compose restart"
