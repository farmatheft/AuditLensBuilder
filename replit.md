# Photo Audit Progress Tracker

A web application for documenting repair and building progress with photos, featuring geolocation tracking, custom overlays, and RESTful API access.

## Project Overview

This application enables field workers and project managers to capture and organize progress photos for different construction or repair projects. Photos are taken directly in the browser without saving to the device gallery, automatically tagged with GPS coordinates, and can be annotated with comments and visual stickers (arrows and circles).

## Key Features

- **Browser-based camera capture** - Take photos directly in the browser using MediaDevices API without saving to device gallery
- **Automatic geolocation** - GPS coordinates (latitude/longitude) captured with each photo
- **Photo editor** - Canvas-based editing with interactive sticker placement (arrows, circles) that can be rotated and resized
- **Comment overlays** - Add text comments positioned at top or bottom of photos
- **Server-side image compositing** - Stickers and comments are rendered onto the final image using Sharp
- **Project organization** - Group photos by different repair/construction projects
- **RESTful API** - External integrations can access photo data via documented API endpoints
- **Mobile-first design** - Material Design approach with Roboto font, optimized for field use

## Architecture

### Frontend
- React SPA with Wouter routing
- TanStack Query for data fetching and cache management
- Shadcn UI components (Material Design approach)
- Canvas API for photo preview and editing
- Geolocation API for GPS coordinates
- MediaDevices API for camera access

### Backend
- Express.js REST API
- PostgreSQL database (Neon-backed via Replit)
- Drizzle ORM for database operations
- Sharp for server-side image processing and compositing
- Multer for multipart file uploads

### Database Schema

**Projects:**
- id (UUID), name, description, createdAt, updatedAt
- One-to-many relationship with photos

**Photos:**
- id (UUID), projectId, filename, comment, latitude, longitude
- stickers (JSONB array), commentPosition (top/bottom)
- createdAt

## Development

### Running the Application
```bash
npm run dev
```

Server runs on port 5000 with Vite handling frontend bundling.

### Database Migrations
```bash
npm run db:push
```

Uses Drizzle Kit to sync schema changes to PostgreSQL.

### Project Structure
```
client/
  src/
    components/     # Reusable UI components
      CameraCapture.tsx     # Camera interface with geolocation
      PhotoEditor.tsx       # Canvas editor with stickers
      ProjectCard.tsx       # Project list item
      CreateProjectDialog.tsx  # New project form
      ApiDocumentation.tsx  # API docs
    pages/          # Route components
      ProjectsPage.tsx      # Project list
      ProjectDetailPage.tsx # Photo gallery
      CameraPage.tsx        # Camera/editor flow
      ApiPage.tsx          # API documentation
    App.tsx        # Main app with navigation
    
server/
  routes.ts       # API endpoints
  storage.ts      # Database operations
  db.ts          # Database connection
  
shared/
  schema.ts       # Shared types and validation

uploads/          # Photo storage directory
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects with photo counts
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:projectId/photos` - Get all photos for project

### Photos
- `POST /api/photos` - Upload photo (multipart/form-data)
- `GET /api/photos/:id` - Get photo metadata
- `GET /api/photos/:id/file` - Get photo file (JPEG)
- `DELETE /api/photos/:id` - Delete photo

### Photo Upload Format
```
photo: File (JPEG/PNG)
projectId: string (UUID)
comment: string (optional)
latitude: number
longitude: number
commentPosition: "top" | "bottom"
stickers: JSON array of sticker objects
```

### Sticker Format
```json
{
  "id": "string",
  "type": "arrow" | "circle",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "rotation": number (degrees)
}
```

## User Flow

1. **Create Project** - User creates a project to organize related photos
2. **Capture Photo** - Navigate to project → Click "Take Photo" → Camera opens in full screen
3. **Geolocation** - GPS coordinates automatically displayed and captured
4. **Add Comment** - Optional text comment added via input field (preserved across photos)
5. **Take Photo** - Click capture button → Photo opens in editor
6. **Edit Photo** - Add arrow/circle stickers, drag to position, rotate, resize
7. **Position Comment** - Choose top or bottom placement for comment overlay
8. **Upload** - Photo uploaded with progress indicator
9. **Server Processing** - Server composites stickers and comment onto base image
10. **Auto-clear** - Editor clears, comment field preserved for next photo
11. **View Gallery** - Photos displayed in project with location info

## Design Guidelines

- **Font:** Roboto (Material Design)
- **Layout:** Mobile-first with responsive breakpoints
- **Colors:** Material Design color system via Shadcn UI
- **Spacing:** Consistent 2, 4, 6, 8 unit scale
- **Interactions:** Touch-optimized for field use

## Recent Changes

- 2025-01-16: Initial implementation with camera capture, geolocation, photo editor, server-side compositing, and project management
- Database: PostgreSQL via Replit integration
- File storage: Local filesystem in `uploads/` directory

## Future Enhancements

- API authentication with token-based access control
- Camera direction vector using DeviceOrientation API
- Photo comparison view for progress tracking
- Batch photo export (ZIP with metadata)
- Photo gallery filtering by date and location
