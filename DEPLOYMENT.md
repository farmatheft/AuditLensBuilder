# AuditLens Builder - Production Deployment

## Single Server Setup

The application is now configured to serve both the frontend and backend from a single server on port 8000.

### Quick Start

1. **Install Dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   python3 -m venv backend_python/venv
   source backend_python/venv/bin/activate  # On Windows: backend_python\venv\Scripts\activate
   pip install -r backend_python/requirements.txt
   ```

2. **Start the Server**
   ```bash
   # Option 1: Use the startup script (builds frontend + starts server)
   ./start.sh
   
   # Option 2: Manual steps
   npm run build
   uvicorn backend_python.main:app --host 0.0.0.0 --port 8000
   ```

3. **Access the Application**
   - Open http://localhost:8000 in your browser
   - All API calls will be made to the same domain/port

### Using with ngrok

To expose your local server to the internet:

```bash
# Start the server
./start.sh

# In another terminal, start ngrok
ngrok http 8000
```

Now you can access your application via the ngrok URL (e.g., `https://abc123.ngrok.io`).

### Development Mode

For development with hot reload:

```bash
# Terminal 1: Start Python backend with auto-reload
uvicorn backend_python.main:app --reload --port 8000

# Terminal 2: Start Vite dev server (optional, for faster frontend development)
npm run dev
```

### Project Structure

```
/
├── backend_python/          # Python FastAPI backend
│   ├── main.py             # Main app with static file serving
│   ├── routers/            # API routes
│   ├── models.py           # Database models
│   └── ...
├── client/                 # React frontend source
├── dist/public/            # Built frontend (created by npm run build)
├── uploads/                # Uploaded photos
├── start.sh                # Production startup script
└── package.json
```

### API Endpoints

All API endpoints are available at `/api/*`:
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `POST /api/photos` - Upload photo
- `GET /api/photos/{id}/file` - Get photo file
- `GET /health` - Health check

### Notes

- The frontend is served from `/` (root)
- Static assets (JS, CSS) are served from `/assets/*`
- API routes are prefixed with `/api/*`
- All routes not matching API or assets will serve `index.html` for client-side routing
