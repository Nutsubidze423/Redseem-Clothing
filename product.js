// Get product ID from URL
function getProductId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Cookie management
function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=").map((c) => c.trim());
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

// Fetch product details
async function fetchProductDetails(productId) {
  try {
    const token = getCookie("authToken");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    const response = await axios.get(
      `https://api.redseam.redberryinternship.ge/api/products/${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Update product images
function updateProductImages(images, defaultImage) {
  const thumbnailList = document.querySelector(".thumbnail-list");
  const mainImage = document.querySelector(".main-image");

  // Clear existing content
  thumbnailList.innerHTML = "";
  mainImage.innerHTML = "";

  // Add main image
  const mainImg = document.createElement("img");
  mainImg.src = defaultImage;
  mainImg.alt = "Product Image";
  mainImage.appendChild(mainImg);

  // Add thumbnails
  images.forEach((imageUrl, index) => {
    const thumbnail = document.createElement("img");
    thumbnail.src = imageUrl;
    thumbnail.alt = `Product Thumbnail ${index + 1}`;
    thumbnail.className = `thumbnail ${
      imageUrl === defaultImage ? "active" : ""
    }`;
    thumbnail.addEventListener("click", () => {
      mainImg.src = imageUrl;
      document.querySelectorAll(".thumbnail").forEach((thumb) => {
        thumb.classList.remove("active");
      });
      thumbnail.classList.add("active");
    });
    thumbnailList.appendChild(thumbnail);
  });
}

// Update color options
function updateColorOptions(colors, defaultColor) {
  const colorOptions = document.querySelector(".color-options");
  const colorLabel = document.querySelector(".color-label span");

  colorOptions.innerHTML = "";
  colorLabel.textContent = defaultColor;

  colors.forEach((color) => {
    const colorOption = document.createElement("div");
    colorOption.className = `color-option ${
      color === defaultColor ? "active" : ""
    }`;
    colorOption.style.backgroundColor = color.toLowerCase();
    colorOption.addEventListener("click", () => {
      document.querySelectorAll(".color-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      colorOption.classList.add("active");
      colorLabel.textContent = color;
    });
    colorOptions.appendChild(colorOption);
  });
}

// Update size options
function updateSizeOptions(sizes, defaultSize) {
  const sizeOptions = document.querySelector(".size-options");
  const sizeLabel = document.querySelector(".size-label span");

  sizeOptions.innerHTML = "";
  sizeLabel.textContent = defaultSize;

  sizes.forEach((size) => {
    const sizeOption = document.createElement("button");
    sizeOption.className = `size-option ${
      size === defaultSize ? "active" : ""
    }`;
    sizeOption.textContent = size;
    sizeOption.addEventListener("click", () => {
      document.querySelectorAll(".size-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      sizeOption.classList.add("active");
      sizeLabel.textContent = size;
    });
    sizeOptions.appendChild(sizeOption);
  });
}

// Handle quantity changes
function setupQuantityControls() {
  const minusBtn = document.querySelector(".minus");
  const plusBtn = document.querySelector(".plus");
  const quantityInput = document.querySelector(".quantity-selector input");

  minusBtn.addEventListener("click", () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
    }
  });

  plusBtn.addEventListener("click", () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue < 99) {
      quantityInput.value = currentValue + 1;
    }
  });

  quantityInput.addEventListener("change", () => {
    let value = parseInt(quantityInput.value);
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > 99) {
      value = 99;
    }
    quantityInput.value = value;
  });
}

// Initialize page
async function initializeProductPage() {
  const productId = getProductId();
  if (!productId) {
    window.location.href = "shop.html";
    return;
  }

  const product = await fetchProductDetails(productId);
  if (!product) {
    window.location.href = "shop.html";
    return;
  }

  // Update page title
  document.title = `${product.name} - RedSeam Clothing`;

  // Update product details
  document.querySelector(".product-title").textContent = product.name;
  document.querySelector(".product-price span").textContent = product.price;
  document.querySelector(".product-description").textContent =
    product.description;
  document.querySelector(".brand-name").textContent = `Brand: ${product.brand}`;
  document.querySelector(".brand-logo").src = product.brand_logo;

  // Update images, colors, and sizes
  updateProductImages(product.images, product.default_image);
  updateColorOptions(product.colors, product.default_color);
  updateSizeOptions(product.sizes, product.default_size);

  // Setup quantity controls
  setupQuantityControls();

  // Setup avatar if exists
  const avatarElement = document.getElementById("userAvatar");
  avatarElement.src = "./Images/user.png";
  const userAvatar = getCookie("userAvatar");
  if (userAvatar && userAvatar.startsWith("data:image")) {
    avatarElement.src = userAvatar;
  }
  avatarElement.onerror = () => {
    avatarElement.src = "./Images/user.png";
  };
}

// Start initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeProductPage);
