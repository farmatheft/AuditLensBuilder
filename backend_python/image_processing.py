from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
from datetime import datetime
from typing import List, Dict, Any, Tuple
import math
from . import schemas

def create_arrow_sticker(w, h, color, outline_color, shadow_color):
    # Create a high-res canvas for the sticker
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dimensions
    shaft_width = h * 0.4
    head_width = h * 0.8
    head_len = w * 0.4
    
    cy = h / 2
    left = 0
    right = w
    
    points = [
        (left, cy - shaft_width/2), # Tail top
        (right - head_len, cy - shaft_width/2), # Shaft top right
        (right - head_len, cy - head_width/2), # Head top back
        (right, cy), # Tip
        (right - head_len, cy + head_width/2), # Head bottom back
        (right - head_len, cy + shaft_width/2), # Shaft bottom right
        (left, cy + shaft_width/2) # Tail bottom
    ]
    
    # Draw shadow
    shadow_offset = 4
    shadow_points = [(x + shadow_offset, y + shadow_offset) for x, y in points]
    draw.polygon(shadow_points, fill=shadow_color)
    
    # Draw outline (white)
    outline_width = max(3, int(w / 25))
    # To draw a proper outline for a polygon, we can draw a larger polygon behind
    # But PIL's polygon outline is centered on the line.
    draw.polygon(points, fill=color, outline=outline_color, width=outline_width)
    
    # 3D Highlight (simple line on top)
    highlight_color = (255, 255, 255, 100)
    draw.line([(left + outline_width, cy - shaft_width/2 + outline_width), 
               (right - head_len - outline_width, cy - shaft_width/2 + outline_width)], 
              fill=highlight_color, width=int(shaft_width/4))
              
    return img

def create_circle_sticker(w, h, color, outline_color, shadow_color, filled=False):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    shadow_offset = 4
    outline_width = max(3, int(w / 25))
    
    # Shadow
    draw.ellipse([shadow_offset, shadow_offset, w-outline_width, h-outline_width], fill=shadow_color)
    
    # Main circle
    fill_color = (*color[:3], 180) if filled else None
    draw.ellipse([0, 0, w-shadow_offset, h-shadow_offset], outline=color, fill=fill_color, width=max(4, int(w/15)))
    
    # White contour
    # Inner and outer white strokes to create "sticker" look
    draw.ellipse([0, 0, w-shadow_offset, h-shadow_offset], outline=outline_color, width=outline_width)
    
    return img

def draw_sticker(base_img: Image.Image, sticker_data: Dict[str, Any]):
    # Extract data
    s_type = sticker_data.get("type", "circle")
    x = sticker_data.get("x", 0)
    y = sticker_data.get("y", 0)
    w = int(sticker_data.get("width", 100))
    h = int(sticker_data.get("height", 100))
    rot = sticker_data.get("rotation", 0)
    color_name = sticker_data.get("color", "red")
    
    # Color mapping
    colors = {
        "red": (255, 50, 50),
        "yellow": (255, 200, 0),
        "green": (0, 255, 100),
        "blue": (33, 150, 243),
        "cyan": (0, 255, 255),
        "gray": (128, 128, 128),
        "black": (0, 0, 0)
    }
    base_color = colors.get(color_name, (255, 50, 50))
    outline_color = (255, 255, 255)
    shadow_color = (0, 0, 0, 100)
    
    sticker_img = None
    
    if s_type in ["arrow", "arrow-3d"]:
        sticker_img = create_arrow_sticker(w, h, base_color, outline_color, shadow_color)
    elif s_type in ["circle", "circle-filled"]:
        sticker_img = create_circle_sticker(w, h, base_color, outline_color, shadow_color, filled=(s_type == "circle-filled"))
    elif s_type == "crosshair":
        # Reuse circle logic for now or implement specific
        sticker_img = create_circle_sticker(w, h, base_color, outline_color, shadow_color)

    if sticker_img:
        # Rotate
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
