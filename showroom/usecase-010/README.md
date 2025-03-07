# Image Gallery Application

A desktop application for managing and viewing images with the following features:

- Image preview
- Slideshow functionality
- Basic image editing (rotation, resizing)
- EXIF information display

## Requirements

- Python 3.6+
- PyWebView
- Pillow (PIL)

You can install the required dependencies using:

```bash
pip install -r requirements.txt
```

## Running the Application

To run the application, execute:

```bash
python main.py
```

## Features

### Image Gallery

- Displays thumbnails of all images in the images directory
- Click on an image to view it in the main panel

### Image Viewing

- Full-size image display
- Previous/Next navigation
- Slideshow mode with automatic image transitions

### Image Editing

- Rotate images left or right
- Resize images by specifying width and height

### EXIF Data

- View detailed EXIF metadata for each image
- Displays information such as camera model, exposure settings, and more (if available)

### File Management

- Upload new images to the gallery
- Images are stored in the 'images' directory

## Implementation Details

- Frontend: HTML, CSS, JavaScript
- Backend: Python with PyWebView
- Image Processing: Pillow (PIL)

## File Structure

- `main.py`: Application entry point
- `api.py`: Backend API implementation
- `web/`: Frontend files
  - `index.html`: Main HTML file
  - `css/style.css`: CSS styles
  - `js/script.js`: JavaScript functionality
- `images/`: Directory for storing images
- `requirements.txt`: List of required Python packages
