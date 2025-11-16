# Docker Setup for AuditLens

This guide explains how to run AuditLens using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Build and start the application:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   docker-compose exec app npm run db:push
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:5000`

## Services

### Database (PostgreSQL)
- **Image:** postgres:16-alpine
- **Port:** 5432
- **Credentials:**
  - User: `auditlens`
  - Password: `auditlens_password`
  - Database: `auditlens`

### Application
- **Port:** 5000
- **Environment:** Production
- **Volumes:** `./uploads` mounted for photo storage

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f app
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Access database directly
```bash
docker-compose exec db psql -U auditlens -d auditlens
```

### Clean up (remove volumes)
```bash
docker-compose down -v
```

## Development vs Production

For development, continue using:
```bash
npm run dev
```

For production deployment with Docker:
```bash
docker-compose up -d
```

## Troubleshooting

### Database connection issues
Ensure the database is healthy:
```bash
docker-compose ps
```

### Port conflicts
If port 5000 or 5432 is already in use, modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "3000:5000"  # Change host port
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec app npm run db:push
```
