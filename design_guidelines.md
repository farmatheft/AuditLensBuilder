# Design Guidelines: Photo Audit Progress Tracker

## Design Approach

**Selected Framework:** Material Design (Google)  
**Rationale:** Mobile-first photo documentation tool requiring touch-optimized interactions, clear visual hierarchy for data capture, and robust component patterns for camera/editing interfaces.

---

## Core Design Elements

### Typography
- **Primary Font:** Roboto (Google Fonts CDN)
- **Hierarchy:**
  - H1 (Page titles): 2xl, semibold
  - H2 (Section headers): xl, medium
  - Body: base, regular
  - Small (metadata/coords): sm, regular
  - Button text: base, medium

### Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, and 8  
- Compact: p-2, gap-2 (toolbar buttons, sticker controls)
- Standard: p-4, gap-4 (cards, form fields)
- Section spacing: p-6 (mobile), p-8 (desktop)

**Grid Structure:**
- Mobile: Single column, full-width camera viewport
- Desktop: 60/40 split (camera preview / controls sidebar)

---

## Component Library

### Camera Interface
- **Full-viewport camera preview** with overlay controls
- **Floating action button (FAB)** for photo capture (bottom-center, size-16, rounded-full)
- **Top overlay bar:** Geolocation display (lat/lng with location icon), semi-transparent backdrop
- **Bottom comment field:** Persistent text input, w-full, backdrop-blur, p-4

### Photo Editor Canvas
- **Sticker toolbar:** Horizontal button row (Arrow, Circle, Delete icons) with active state indicators
- **Transform handles:** Corner resize grips, rotation handle (arc icon), center drag handle
- **Comment placement toggle:** Top/Bottom radio buttons, compact inline layout

### Object/Project Management
- **Card-based list:** Each project card shows thumbnail grid (3 columns), project name, photo count, last update
- **Add button:** FAB in bottom-right corner
- **Empty state:** Centered icon + text encouraging first project creation

### Upload Feedback
- **Progress bar:** Linear, full-width, positioned below active photo
- **Success notification:** Toast message, top-center, auto-dismiss (2s)

### API Integration Panel
- **Settings drawer:** Slide-in from right (desktop) or bottom sheet (mobile)
- **API key display:** Monospace font, copy-to-clipboard button
- **Endpoint list:** Collapsible sections with code snippets

---

## Interaction Patterns

### Camera Capture Flow
1. Full-screen camera preview loads immediately
2. Geolocation appears in top bar when acquired
3. Comment field visible at bottom (sticky position)
4. Single tap FAB captures photo → transitions to edit mode

### Photo Editing Mode
1. Canvas displays captured image full-width
2. Sticker buttons activate placement mode (cursor changes)
3. Tap photo to place sticker → transform handles appear
4. Pinch/drag gestures for resize/rotate
5. Upload button (top-right) → progress bar → auto-clear to camera

### Form Behavior
- Comment field retains value after upload
- Geolocation auto-populates on each new capture
- Stickers clear completely after successful upload

---

## Responsive Breakpoints
- **Mobile (<768px):** Stacked layout, full-width camera, bottom-sheet controls
- **Tablet (768-1024px):** Side-by-side preview/controls at 65/35 split
- **Desktop (>1024px):** Maximum container width of 1200px, centered

---

## Icons
**Library:** Material Icons (CDN)  
**Key Icons:** camera, location_on, arrow_forward, circle, rotate_right, resize, upload, api, folder

---

## Navigation
- **Top app bar:** Logo/title left, settings icon right, elevation shadow
- **Bottom navigation (mobile):** Camera, Projects, API (3 tabs)
- **Desktop:** Persistent sidebar with same sections

---

## Accessibility
- High contrast ratios for overlay text on photos
- Touch targets minimum 44px × 44px
- Screen reader labels for all icon-only buttons
- Keyboard navigation for sticker transform (arrow keys rotate/resize)

---

## Images
**No hero images required** - This is a utility application where the camera preview serves as the primary visual element. Focus on functional UI clarity rather than marketing imagery.