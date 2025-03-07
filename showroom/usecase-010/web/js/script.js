// Global variables
let currentImages = [];
let currentImageIndex = -1;
let slideshowInterval = null;
const slideshowDelay = 3000; // 3 seconds

// DOM elements
const gallery = document.getElementById("gallery");
const currentImage = document.getElementById("current-image");
const noImageMessage = document.getElementById("no-image-message");
const exifData = document.getElementById("exif-data");
const fileUpload = document.getElementById("file-upload");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const playBtn = document.getElementById("play-btn");
const rotateLeftBtn = document.getElementById("rotate-left");
const rotateRightBtn = document.getElementById("rotate-right");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const resizeBtn = document.getElementById("resize-btn");

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM content loaded, initializing application");

  // Set up event listeners
  fileUpload.addEventListener("change", handleFileUpload);
  prevBtn.addEventListener("click", showPreviousImage);
  nextBtn.addEventListener("click", showNextImage);
  playBtn.addEventListener("click", toggleSlideshow);
  rotateLeftBtn.addEventListener("click", () => rotateImage(-90));
  rotateRightBtn.addEventListener("click", () => rotateImage(90));
  resizeBtn.addEventListener("click", resizeImage);

  // Disable controls initially
  updateControlsState(false);

  // Force a delay to ensure the API is ready
  setTimeout(async () => {
    try {
      console.log("Loading images on startup");
      // Load images from the server
      await loadImages();
      console.log(`Loaded ${currentImages.length} images`);

      // If there are images, select the first one
      if (currentImages.length > 0) {
        console.log("Selecting first image");
        await selectImage(0);
        console.log("First image selected");
      } else {
        console.log("No images to select");
        // If no images, try to reload after a short delay
        setTimeout(async () => {
          console.log("Retrying image load...");
          await loadImages();
          if (currentImages.length > 0) {
            selectImage(0);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }, 500);
});

// Force reload images when window gains focus
window.addEventListener("focus", async () => {
  console.log("Window gained focus, reloading images");
  await loadImages();
  if (currentImages.length > 0 && currentImageIndex < 0) {
    selectImage(0);
  }
});

// Load images from the server
async function loadImages() {
  try {
    console.log("Loading images from server...");
    const images = await window.pywebview.api.get_images();
    console.log("Received images:", images);
    currentImages = images;

    // Clear the gallery
    gallery.innerHTML = "";

    if (!images || images.length === 0) {
      console.log("No images found");
      const noImagesMsg = document.createElement("p");
      noImagesMsg.textContent =
        "No images found. Upload some images to get started.";
      noImagesMsg.style.padding = "10px";
      gallery.appendChild(noImagesMsg);
      return;
    }

    console.log(`Creating gallery items for ${images.length} images`);

    // Create gallery items
    images.forEach((image, index) => {
      console.log(`Processing image ${index}:`, image.name);

      const galleryItem = document.createElement("div");
      galleryItem.className = "gallery-item";
      galleryItem.dataset.index = index;

      const img = document.createElement("img");
      if (image.thumbnail) {
        console.log(`Image ${index} has thumbnail`);
        img.src = image.thumbnail;
      } else {
        console.log(`Image ${index} has no thumbnail, using placeholder`);
        img.src = "placeholder.jpg";
      }
      img.alt = image.name;

      galleryItem.appendChild(img);
      gallery.appendChild(galleryItem);

      // Add click event
      galleryItem.addEventListener("click", () => {
        selectImage(index);
      });
    });

    console.log("Gallery items created");
  } catch (error) {
    console.error("Error loading images:", error);
  }
}

// Handle file upload
async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Read the file as a data URL
      const reader = new FileReader();

      // Create a promise to handle the async file reading
      await new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            // Get the file data as base64
            const fileData = e.target.result;

            // Upload the file to the server
            const result = await window.pywebview.api.save_file(
              fileData,
              file.name
            );

            if (result.error) {
              console.error("Error uploading file:", result.error);
            } else {
              console.log("File uploaded successfully:", file.name);
            }
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        reader.onerror = (e) => {
          reject(new Error("Error reading file"));
        };

        // Read the file as a data URL
        reader.readAsDataURL(file);
      });
    }

    // Reload images after all uploads are complete
    await loadImages();

    // Clear the file input
    fileUpload.value = "";
  } catch (error) {
    console.error("Error uploading files:", error);
  }
}

// Select and display an image
async function selectImage(index) {
  if (index < 0 || index >= currentImages.length) return;

  currentImageIndex = index;

  // Update gallery selection
  const galleryItems = document.querySelectorAll(".gallery-item");
  galleryItems.forEach((item) => item.classList.remove("active"));
  galleryItems[index].classList.add("active");

  try {
    // Get image data from the server
    const imageData = await window.pywebview.api.get_image_data(
      currentImages[index].name
    );

    if (imageData.error) {
      console.error("Error loading image:", imageData.error);
      return;
    }

    // Display the image
    currentImage.src = imageData.data_url;
    currentImage.style.display = "block";
    noImageMessage.style.display = "none";

    // Set initial dimensions for resize inputs
    const img = new Image();
    img.onload = function () {
      widthInput.value = this.width;
      heightInput.value = this.height;
    };
    img.src = imageData.data_url;

    // Display EXIF data
    displayExifData(imageData.exif);

    // Enable controls
    updateControlsState(true);
  } catch (error) {
    console.error("Error selecting image:", error);
  }
}

// Display EXIF data
function displayExifData(exifData) {
  const container = document.getElementById("exif-data");
  container.innerHTML = "";

  if (!exifData || Object.keys(exifData).length === 0) {
    const noExifMsg = document.createElement("p");
    noExifMsg.textContent = "No EXIF data available for this image.";
    container.appendChild(noExifMsg);
    return;
  }

  // Add basic file info
  const fileInfo = currentImages[currentImageIndex];

  // Format file size
  let sizeText = "";
  if (fileInfo.size < 1024) {
    sizeText = `${fileInfo.size} bytes`;
  } else if (fileInfo.size < 1024 * 1024) {
    sizeText = `${(fileInfo.size / 1024).toFixed(2)} KB`;
  } else {
    sizeText = `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Add file info to EXIF display
  addExifItem(container, "File Name", fileInfo.name);
  addExifItem(container, "File Size", sizeText);
  addExifItem(container, "Last Modified", fileInfo.modified);

  // Add EXIF data
  for (const [key, value] of Object.entries(exifData)) {
    // Skip complex objects or very long values
    if (
      typeof value === "object" ||
      (typeof value === "string" && value.length > 100)
    ) {
      continue;
    }
    addExifItem(container, key, value);
  }
}

// Add an EXIF item to the container
function addExifItem(container, label, value) {
  const item = document.createElement("div");
  item.className = "exif-item";

  const labelElement = document.createElement("div");
  labelElement.className = "exif-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("div");
  valueElement.className = "exif-value";
  valueElement.textContent = value;

  item.appendChild(labelElement);
  item.appendChild(valueElement);
  container.appendChild(item);
}

// Show the previous image
function showPreviousImage() {
  if (currentImages.length === 0) return;

  let newIndex = currentImageIndex - 1;
  if (newIndex < 0) {
    newIndex = currentImages.length - 1;
  }

  selectImage(newIndex);
}

// Show the next image
function showNextImage() {
  if (currentImages.length === 0) return;

  let newIndex = currentImageIndex + 1;
  if (newIndex >= currentImages.length) {
    newIndex = 0;
  }

  selectImage(newIndex);
}

// Toggle slideshow
function toggleSlideshow() {
  if (slideshowInterval) {
    // Stop slideshow
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    playBtn.textContent = "Play Slideshow";
  } else {
    // Start slideshow
    slideshowInterval = setInterval(showNextImage, slideshowDelay);
    playBtn.textContent = "Stop Slideshow";
  }
}

// Rotate the current image
async function rotateImage(angle) {
  if (currentImageIndex < 0 || currentImageIndex >= currentImages.length)
    return;

  try {
    const imageName = currentImages[currentImageIndex].name;
    const result = await window.pywebview.api.rotate_image(imageName, angle);

    if (result.error) {
      console.error("Error rotating image:", result.error);
      return;
    }

    // Update the displayed image
    currentImage.src = result.data_url;

    // Reload images to update thumbnails
    await loadImages();

    // Reselect the current image to update the gallery
    selectImage(currentImageIndex);
  } catch (error) {
    console.error("Error rotating image:", error);
  }
}

// Resize the current image
async function resizeImage() {
  if (currentImageIndex < 0 || currentImageIndex >= currentImages.length)
    return;

  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);

  if (isNaN(width) || isNaN(height) || width < 50 || height < 50) {
    alert("Please enter valid dimensions (minimum 50px)");
    return;
  }

  try {
    const imageName = currentImages[currentImageIndex].name;
    const result = await window.pywebview.api.resize_image(
      imageName,
      width,
      height
    );

    if (result.error) {
      console.error("Error resizing image:", result.error);
      return;
    }

    // Update the displayed image
    currentImage.src = result.data_url;

    // Reload images to update thumbnails
    await loadImages();

    // Reselect the current image to update the gallery
    selectImage(currentImageIndex);
  } catch (error) {
    console.error("Error resizing image:", error);
  }
}

// Update the state of control buttons
function updateControlsState(enabled) {
  prevBtn.disabled = !enabled;
  nextBtn.disabled = !enabled;
  playBtn.disabled = !enabled;
  rotateLeftBtn.disabled = !enabled;
  rotateRightBtn.disabled = !enabled;
  widthInput.disabled = !enabled;
  heightInput.disabled = !enabled;
  resizeBtn.disabled = !enabled;
}
