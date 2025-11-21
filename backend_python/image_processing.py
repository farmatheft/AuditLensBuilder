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

async def composite_image(
    image_data: bytes,
    comment: str | None,
    stickers: List[Dict[str, Any]],
    latitude: float | None,
    longitude: float | None,
    project_name: str,
    captured_at: str | None
) -> bytes:
    
    # Load image
    with Image.open(io.BytesIO(image_data)) as img:
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
        font_size = int(max(16, height / 60))
        try:
            # Try to load a standard font, fallback to default
            font = ImageFont.truetype("Arial.ttf", font_size)
        except IOError:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            except IOError:
                 # Fallback for linux/docker if needed, or just default
                font = ImageFont.load_default()

        # Helper to draw text box
        def draw_text_box(text_content: str, bottom_y: int, align: str = "left"):
            # Calculate text size
            bbox = draw.textbbox((0, 0), text_content, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            
            padding = font_size * 0.5
            box_h = text_h + padding * 2
            
            # Full width black bar
            draw.rectangle(
                [(0, bottom_y - box_h), (width, bottom_y)],
                fill=(0, 0, 0, 255)
            )
            
            text_y = bottom_y - box_h + padding
            
            if align == "right":
                text_x = width - text_w - padding
            else:
                text_x = padding
                
            draw.text((text_x, text_y), text_content, font=font, fill=(255, 255, 255, 255))
            return box_h

        current_y = height
        
        # 1. Timestamp (Bottom - drawn first)
        if captured_at:
            try:
                dt = datetime.fromisoformat(captured_at.replace('Z', '+00:00'))
                ts_str = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                ts_str = captured_at
            
            h_used = draw_text_box(ts_str, current_y, align="right")
            current_y -= h_used

        # 2. Project & Comment (Middle)
        comment_text = f"{project_name}"
        if comment:
            comment_text += f" - {comment}"
            
        h_used = draw_text_box(comment_text, current_y, align="left")
        current_y -= h_used
        
        # 3. Location (Top - drawn last, appears above comment)
        if latitude is not None and longitude is not None:
            loc_str = f"{latitude:.5f}, {longitude:.5f}"
            h_used = draw_text_box(loc_str, current_y, align="left")
            current_y -= h_used

        # Composite
        img.alpha_composite(overlay)
        
        # Save to buffer
        output = io.BytesIO()
        img = img.convert("RGB") # Convert back to RGB for JPEG
        img.save(output, format="JPEG", quality=95)
        return output.getvalue()
