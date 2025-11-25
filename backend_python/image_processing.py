from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
from datetime import datetime
from typing import List, Dict, Any, Tuple
import math
import os
from . import schemas

# Path to stickers directory
STICKERS_DIR = os.path.join(os.path.dirname(__file__), "assets", "stickers")

def draw_sticker(base_img: Image.Image, sticker_data: Dict[str, Any]):
    # Extract data
    s_type = sticker_data.get("type", "arrow")
    x = sticker_data.get("x", 0)
    y = sticker_data.get("y", 0)
    w = int(sticker_data.get("width", 100))
    h = int(sticker_data.get("height", 100))
    rot = sticker_data.get("rotation", 0)
    
    # Determine image filename
    filename = "arrow.png" if s_type == "arrow" else "dpt.png"
    filepath = os.path.join(STICKERS_DIR, filename)
    
    if not os.path.exists(filepath):
        print(f"Sticker file not found: {filepath}")
        return

    try:
        with Image.open(filepath) as sticker_img:
            sticker_img = sticker_img.convert("RGBA")
            
            # Resize
            # Use LANCZOS for high quality downscaling/upscaling
            sticker_img = sticker_img.resize((w, h), resample=Image.Resampling.LANCZOS)
            
            # Rotate
            # expand=True allows the image to grow to fit the rotated content
            rotated = sticker_img.rotate(-rot, resample=Image.Resampling.BICUBIC, expand=True)
            
            # Calculate paste position (centered)
            # The rotated image size might be different from original w,h
            rw, rh = rotated.size
            
            # Original center was at x + w/2, y + h/2
            cx = x + w/2
            cy = y + h/2
            
            paste_x = int(cx - rw/2)
            paste_y = int(cy - rh/2)
            
            # Paste with alpha composite
            base_img.alpha_composite(rotated, (paste_x, paste_y))
            
    except Exception as e:
        print(f"Error drawing sticker {s_type}: {e}")

PACKAGES_DIR = os.path.join(os.path.dirname(__file__), "assets", "packages")

async def composite_image(
    image_data: bytes,
    comment: str | None,
    stickers: List[Dict[str, Any]],
    latitude: float | None,
    longitude: float | None,
    project_name: str,
    captured_at: str | None,
    packaging_info: Dict[str, str] | None = None,
    hide_date: bool = False
) -> bytes:
    
    # Load image
    with Image.open(io.BytesIO(image_data)) as img:
        # Handle EXIF orientation
        img = ImageOps.exif_transpose(img)
        
        # Convert to RGBA for compositing
        img = img.convert("RGBA")
        width, height = img.size
        
        # Create overlay layer
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # --- Stickers ---
        for sticker_data in stickers:
            draw_sticker(img, sticker_data)
        
        # --- Text Overlays ---
        # Font setup
        # Double the font size for the strip
        font_size = int(max(32, height / 30))
        try:
            # Try to load a standard font, fallback to default
            font = ImageFont.truetype("Arial.ttf", font_size)
        except IOError:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            except IOError:
                 # Fallback for linux/docker if needed, or just default
                font = ImageFont.load_default()
        
        # Helper to draw text box with mixed content (text + images)
        def draw_text_box(content_parts: list, bottom_y: int, align: str = "left"):
            # content_parts: list of dicts {'type': 'text'|'image', 'value': str, 'source': 'builtin'|'custom'}
            
            items = []
            total_width = 0
            max_height = 0
            
            padding = font_size * 0.5
            spacing = font_size * 0.3
            
            # 1. Prepare items and calculate dimensions
            for part in content_parts:
                if part['type'] == 'text':
                    text = part['value']
                    bbox = draw.textbbox((0, 0), text, font=font)
                    w = bbox[2] - bbox[0]
                    h = bbox[3] - bbox[1]
                    # Ensure minimum height for text (based on font size)
                    h = max(h, font_size)
                    items.append({'type': 'text', 'obj': text, 'w': w, 'h': h})
                    total_width += w
                    max_height = max(max_height, h)
                elif part['type'] == 'image':
                    filename = part['value']
                    source = part.get('source', 'custom')
                    subdir = "builtin" if source == "builtin" else "custom"
                    path = os.path.join(PACKAGES_DIR, subdir, filename)
                    
                    if os.path.exists(path):
                        try:
                            p_img = Image.open(path).convert("RGBA")
                            # Target height: 1.3x font size
                            target_h = int(font_size * 1.3)
                            aspect = p_img.width / p_img.height
                            target_w = int(target_h * aspect)
                            
                            p_img = p_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                            items.append({'type': 'image', 'obj': p_img, 'w': target_w, 'h': target_h})
                            total_width += target_w
                            max_height = max(max_height, target_h)
                        except Exception as e:
                            print(f"Error loading package image: {e}")
                            pass

            if len(items) > 1:
                total_width += spacing * (len(items) - 1)
            
            # Box dimensions
            box_h = max_height + padding * 2
            
            # Draw black bar (full width)
            draw.rectangle(
                [(0, bottom_y - box_h), (width, bottom_y)],
                fill=(0, 0, 0, 255)
            )
            
            # Calculate starting X
            if align == "right":
                current_x = width - total_width - padding
            else:
                current_x = padding
                
            # Draw items
            for i, item in enumerate(items):
                # Vertically center item in the box
                # Box top is at bottom_y - box_h
                # Content area starts at bottom_y - box_h + padding
                # Center within max_height
                
                y_offset = (max_height - item['h']) / 2
                item_y = bottom_y - box_h + padding + y_offset
                
                if item['type'] == 'text':
                    draw.text((current_x, item_y), item['obj'], font=font, fill=(255, 255, 255, 255))
                elif item['type'] == 'image':
                    overlay.alpha_composite(item['obj'], (int(current_x), int(item_y)))
                
                current_x += item['w']
                if i < len(items) - 1:
                    current_x += spacing
                    
            return box_h

        current_y = height
        
        # 1. Timestamp (Bottom - drawn first)
        if captured_at and not hide_date:
            try:
                dt = datetime.fromisoformat(captured_at.replace('Z', '+00:00'))
                ts_str = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                ts_str = captured_at
            
            h_used = draw_text_box([{'type': 'text', 'value': ts_str}], current_y, align="right")
            current_y -= h_used

        # 2. Project & Comment & Packaging (Middle)
        # Format: Project Name - [Image] Packaging Name - Comment
        parts = []
        parts.append({'type': 'text', 'value': project_name})
        
        if packaging_info:
            parts.append({'type': 'text', 'value': " - "})
            # Image
            parts.append({
                'type': 'image', 
                'value': packaging_info['color'], 
                'source': packaging_info.get('type', 'custom')
            })
            # Name (with some padding/space before it, handled by spacing)
            parts.append({'type': 'text', 'value': packaging_info['name']})
            
        if comment:
            parts.append({'type': 'text', 'value': " - " + comment})
            
        h_used = draw_text_box(parts, current_y, align="left")
        current_y -= h_used
        
        # 3. Location (Top - drawn last, appears above comment)
        if latitude is not None and longitude is not None:
            loc_str = f"{latitude:.5f}, {longitude:.5f}"
            h_used = draw_text_box([{'type': 'text', 'value': loc_str}], current_y, align="left")
            current_y -= h_used

        # Composite
        img.alpha_composite(overlay)
        
        # Save to buffer
        output = io.BytesIO()
        img = img.convert("RGB") # Convert back to RGB for JPEG
        img.save(output, format="JPEG", quality=95)
        return output.getvalue()
