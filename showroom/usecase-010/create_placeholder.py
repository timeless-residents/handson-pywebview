import os
from PIL import Image, ImageDraw

# Create a directory for the placeholder if it doesn't exist
web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
if not os.path.exists(web_dir):
    os.makedirs(web_dir)

# Create a blank image
img = Image.new("RGB", (200, 200), color=(240, 240, 240))
draw = ImageDraw.Draw(img)

# Draw a border
draw.rectangle([(0, 0), (199, 199)], outline=(200, 200, 200), width=2)

# Draw a text
draw.text((100, 100), "No Image", fill=(150, 150, 150), anchor="mm")

# Save the image
img.save(os.path.join(web_dir, "placeholder.jpg"))

print("Placeholder image created successfully!")
