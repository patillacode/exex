#!/usr/bin/env python
"""
Simple script to create favicon.ico for Expresión Exprés application.
Creates a modern dark-themed favicon matching the new color scheme.
"""

import os

from PIL import Image, ImageDraw, ImageFont


def create_favicon():
    """Create a modern favicon with 'EX' text on a dark background with indigo and amber colors"""
    # Create a new image
    img_size = (32, 32)
    background_color = (30, 30, 46)  # Dark background color
    accent_color = (99, 102, 241)  # Indigo for first E
    second_color = (245, 158, 11)  # Amber for second X

    # Create the image with rounded corners
    img = Image.new("RGB", img_size, background_color)
    draw = ImageDraw.Draw(img)

    # Draw a rounded rectangle border
    border_color = (255, 255, 255, 50)  # Semi-transparent white
    rect_bounds = [(2, 2), (img_size[0] - 3, img_size[1] - 3)]
    draw.rounded_rectangle(rect_bounds, radius=5, outline=border_color, width=1)

    try:
        # Try to use a default font - if it fails, we'll use simple text
        font_size = 16
        try:
            # Try to find a system font that should be available
            for font_name in [
                "Arial",
                "DejaVuSans",
                "FreeSans",
                "Verdana",
                "Helvetica",
            ]:
                try:
                    font = ImageFont.truetype(font_name, font_size)
                    break
                except OSError:
                    continue
        except Exception:
            # If no system fonts work, use default
            font = ImageFont.load_default()

        # Draw the first 'E'
        e_text = "E"
        e_width = (
            draw.textlength(e_text, font=font)
            if hasattr(draw, "textlength")
            else font.getsize(e_text)[0]
        )
        e_position = (6, 7)
        draw.text(e_position, e_text, font=font, fill=accent_color)

        # Draw the 'X'
        x_text = "X"
        x_position = (e_position[0] + e_width + 2, 7)
        draw.text(x_position, x_text, font=font, fill=second_color)

    except Exception as e:
        print(f"Error creating fancy favicon: {e}")
        # Fallback - draw a simple rectangle with gradient
        draw.rectangle([(0, 0), (16, 32)], fill=accent_color)
        draw.rectangle([(16, 0), (32, 32)], fill=second_color)

    # Path to save favicon
    favicon_path = os.path.join("app", "static", "images", "favicon.ico")

    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(favicon_path), exist_ok=True)

        # Save as ICO format
        img.save(favicon_path)
        print(f"Favicon created and saved to {favicon_path}")
        return True
    except Exception as e:
        print(f"Error saving favicon: {e}")
        return False


if __name__ == "__main__":
    create_favicon()
