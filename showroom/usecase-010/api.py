import io
import os
import base64
import shutil
from datetime import datetime
from PIL import Image, ExifTags


class ImageGalleryAPI:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.images_dir = os.path.join(base_dir, "images")

        # Create images directory if it doesn't exist
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)

        # Supported image formats
        self.supported_formats = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]

        # Check if we have sample images, if not, create them
        self._ensure_sample_images()

    def _ensure_sample_images(self):
        """Ensure sample images exist in the images directory"""
        print("Checking for sample images...")

        # Delete existing sample images that might be corrupted
        self._delete_sample_images()

        # Create new sample images
        print("Creating new sample images...")
        self._create_sample_images()

    def _delete_sample_images(self):
        """Delete existing sample images"""
        if os.path.exists(self.images_dir):
            for filename in os.listdir(self.images_dir):
                if filename.startswith("sample") and filename.endswith(
                    (".jpg", ".jpeg", ".png")
                ):
                    file_path = os.path.join(self.images_dir, filename)
                    try:
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            print(f"Deleted existing sample image: {file_path}")
                    except Exception as e:
                        print(f"Error deleting {file_path}: {str(e)}")

    def _create_sample_images(self):
        """Create sample images directly in the images directory"""
        try:
            print("Creating sample images in directory:", self.images_dir)

            # Create sample images with different colors and patterns
            sample_images = [
                {
                    "filename": "sample1.jpg",
                    "size": (800, 600),
                    "color": (255, 100, 100),  # Red
                    "draw_func": self._draw_grid,
                },
                {
                    "filename": "sample2.jpg",
                    "size": (800, 600),
                    "color": (100, 255, 100),  # Green
                    "draw_func": self._draw_circles,
                },
                {
                    "filename": "sample3.jpg",
                    "size": (800, 600),
                    "color": (100, 100, 255),  # Blue
                    "draw_func": self._draw_diagonal,
                },
            ]

            for sample in sample_images:
                # Create a new RGB image with the specified color
                img = Image.new("RGB", sample["size"], sample["color"])

                # Draw a pattern on the image
                if "draw_func" in sample and sample["draw_func"]:
                    sample["draw_func"](img)

                # Save the image
                img_path = os.path.join(self.images_dir, sample["filename"])
                img.save(img_path, format="JPEG", quality=95)
                print(f"Created sample image: {img_path}")

        except Exception as e:
            print(f"Error creating sample images: {str(e)}")

    def _draw_grid(self, img):
        """Draw a grid pattern on an image"""
        from PIL import ImageDraw

        draw = ImageDraw.Draw(img)
        width, height = img.size

        # Draw horizontal lines
        for y in range(0, height, 50):
            draw.line([(0, y), (width, y)], fill=(255, 255, 255), width=2)

        # Draw vertical lines
        for x in range(0, width, 50):
            draw.line([(x, 0), (x, height)], fill=(255, 255, 255), width=2)

    def _draw_circles(self, img):
        """Draw circles on an image"""
        from PIL import ImageDraw

        draw = ImageDraw.Draw(img)
        width, height = img.size

        # Draw concentric circles
        for r in range(50, min(width, height) // 2, 50):
            center_x = width // 2
            center_y = height // 2
            draw.ellipse(
                [(center_x - r, center_y - r), (center_x + r, center_y + r)],
                outline=(255, 255, 255),
                width=2,
            )

    def _draw_diagonal(self, img):
        """Draw diagonal lines on an image"""
        from PIL import ImageDraw

        draw = ImageDraw.Draw(img)
        width, height = img.size

        # Draw diagonal lines
        for i in range(0, max(width, height), 50):
            draw.line([(0, i), (i, 0)], fill=(255, 255, 255), width=2)
            draw.line([(width - i, 0), (width, i)], fill=(255, 255, 255), width=2)
            draw.line([(0, height - i), (i, height)], fill=(255, 255, 255), width=2)
            draw.line(
                [(width - i, height), (width, height - i)],
                fill=(255, 255, 255),
                width=2,
            )

    def get_images(self):
        """Get list of all images in the images directory"""
        images = []

        print(f"Checking images directory: {self.images_dir}")
        print(f"Directory exists: {os.path.exists(self.images_dir)}")

        # If the images directory doesn't exist, create it
        if not os.path.exists(self.images_dir):
            os.makedirs(self.images_dir)
            print(f"Created images directory: {self.images_dir}")

        # List all files in the directory
        files = os.listdir(self.images_dir)
        print(f"Files in directory: {files}")

        # Check if we have sample images, if not, copy them from the web directory
        if not files:
            print("No images found, copying sample images...")
            self._copy_sample_images()
            files = os.listdir(self.images_dir)
            print(f"Files after copying samples: {files}")

        # Process each file
        for filename in files:
            file_path = os.path.join(self.images_dir, filename)
            if os.path.isfile(file_path) and self._is_image(filename):
                # Get basic file info
                file_info = {
                    "name": filename,
                    "path": file_path,
                    "size": os.path.getsize(file_path),
                    "modified": datetime.fromtimestamp(
                        os.path.getmtime(file_path)
                    ).strftime("%Y-%m-%d %H:%M:%S"),
                    "thumbnail": self._create_thumbnail_data(file_path),
                }
                images.append(file_info)
                print(f"Added image: {filename}")
            else:
                print(
                    f"Skipped file: {filename}, is_file: {os.path.isfile(file_path)}, is_image: {self._is_image(filename)}"
                )

        return images

    def _copy_sample_images(self):
        """Copy sample images to the images directory"""
        try:
            # Create sample images directory if it doesn't exist
            samples_dir = os.path.join(self.base_dir, "samples")
            if not os.path.exists(samples_dir):
                os.makedirs(samples_dir)

            # Create sample images
            sample_images = [
                ("sample1.jpg", (800, 600), (255, 200, 100)),
                ("sample2.jpg", (800, 600), (100, 200, 255)),
                ("sample3.jpg", (800, 600), (200, 255, 100)),
            ]

            for filename, size, color in sample_images:
                img = Image.new("RGB", size, color)
                img_path = os.path.join(samples_dir, filename)
                img.save(img_path)

                # Copy to images directory
                dest_path = os.path.join(self.images_dir, filename)
                shutil.copy(img_path, dest_path)
                print(f"Created sample image: {dest_path}")

        except Exception as e:
            print(f"Error creating sample images: {str(e)}")

    def get_image_data(self, filename):
        """Get image data including base64 representation and EXIF data"""
        file_path = os.path.join(self.images_dir, filename)

        if not os.path.exists(file_path) or not self._is_image(filename):
            return {"error": "Image not found or not a valid image"}

        try:
            # Get image data
            with open(file_path, "rb") as f:
                image_data = f.read()

            # Convert to base64
            base64_data = base64.b64encode(image_data).decode("utf-8")

            # Get image format for data URL
            img_format = os.path.splitext(filename)[1].lower().replace(".", "")
            if img_format == "jpg":
                img_format = "jpeg"

            # Create data URL
            data_url = f"data:image/{img_format};base64,{base64_data}"

            # Get EXIF data
            exif_data = self._get_exif_data(file_path)

            return {
                "name": filename,
                "data_url": data_url,
                "exif": exif_data,
                "size": os.path.getsize(file_path),
                "modified": datetime.fromtimestamp(
                    os.path.getmtime(file_path)
                ).strftime("%Y-%m-%d %H:%M:%S"),
            }

        except Exception as e:
            return {"error": str(e)}

    def rotate_image(self, filename, angle):
        """Rotate an image by the specified angle"""
        file_path = os.path.join(self.images_dir, filename)

        if not os.path.exists(file_path) or not self._is_image(filename):
            return {"error": "Image not found or not a valid image"}

        try:
            # Open the image
            img = Image.open(file_path)

            # Rotate the image
            rotated_img = img.rotate(angle, expand=True)

            # Save the rotated image
            rotated_img.save(file_path)

            # Return updated image data
            return self.get_image_data(filename)

        except Exception as e:
            return {"error": str(e)}

    def resize_image(self, filename, width, height):
        """Resize an image to the specified dimensions"""
        file_path = os.path.join(self.images_dir, filename)

        if not os.path.exists(file_path) or not self._is_image(filename):
            return {"error": "Image not found or not a valid image"}

        try:
            # Open the image
            img = Image.open(file_path)

            # Resize the image - use a basic resampling filter (1 = BILINEAR)
            # This should work with any Pillow version
            resized_img = img.resize((width, height), 1)  # 1 = BILINEAR

            # Save the resized image
            resized_img.save(file_path)

            # Return updated image data
            return self.get_image_data(filename)

        except Exception as e:
            return {"error": str(e)}

    def _is_image(self, filename):
        """Check if a file is a supported image format"""
        ext = os.path.splitext(filename)[1].lower()
        is_supported = ext in self.supported_formats
        print(
            f"Checking if {filename} is an image: extension={ext}, supported={is_supported}"
        )
        return is_supported

    def _create_thumbnail_data(self, file_path, max_size=(100, 100)):
        """Create a thumbnail data URL for an image"""
        print(f"Creating thumbnail for {file_path}")
        try:
            # Open the image
            img = Image.open(file_path)
            print(f"Image opened: {img.format}, {img.size}, {img.mode}")

            # Create a thumbnail
            img.thumbnail(max_size)
            print(f"Thumbnail created: {img.size}")

            # Save to bytes
            buffer = io.BytesIO()
            img_format = os.path.splitext(file_path)[1].lower().replace(".", "")
            if img_format == "jpg":
                img_format = "jpeg"

            print(f"Saving thumbnail as {img_format.upper()}")
            img.save(buffer, format=img_format.upper())

            # Convert to base64
            base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
            print(f"Base64 data length: {len(base64_data)}")

            # Create data URL
            data_url = f"data:image/{img_format};base64,{base64_data}"
            print(f"Thumbnail data URL created (length: {len(data_url)})")
            return data_url

        except Exception as e:
            print(f"Error creating thumbnail: {str(e)}")
            # Return a simple colored square as fallback
            try:
                # Create a simple colored square
                fallback = Image.new("RGB", (100, 100), (200, 200, 200))
                buffer = io.BytesIO()
                fallback.save(buffer, format="JPEG")
                base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
                return f"data:image/jpeg;base64,{base64_data}"
            except:
                print("Failed to create fallback thumbnail")
                return None

    def save_file(self, file_data, file_name):
        """Save an uploaded file to the images directory"""
        try:
            # Ensure the file has a valid image extension
            if not self._is_image(file_name):
                return {"error": "Unsupported file format"}

            # Save the file to the images directory
            file_path = os.path.join(self.images_dir, file_name)

            # Decode base64 data
            if isinstance(file_data, str) and file_data.startswith("data:image/"):
                # Handle data URL format
                header, encoded = file_data.split(",", 1)
                file_data = base64.b64decode(encoded)
            elif isinstance(file_data, str):
                # Handle base64 string without data URL prefix
                file_data = base64.b64decode(file_data)

            # Write the file
            with open(file_path, "wb") as f:
                f.write(file_data)

            return {"success": True, "path": file_path}

        except Exception as e:
            return {"error": str(e)}

    def _get_exif_data(self, file_path):
        """Extract EXIF data from an image"""
        try:
            img = Image.open(file_path)

            # Check if image has EXIF data
            if hasattr(img, "_getexif") and img._getexif():
                exif = {}
                for tag, value in img._getexif().items():
                    if tag in ExifTags.TAGS:
                        tag_name = ExifTags.TAGS[tag]
                        # Convert bytes to string if needed
                        if isinstance(value, bytes):
                            try:
                                value = value.decode("utf-8")
                            except:
                                value = str(value)
                        exif[tag_name] = value
                return exif
            else:
                return {}

        except Exception as e:
            return {"error": str(e)}
