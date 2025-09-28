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

    const response = await fetch(
      `https://api.redseam.redberryinternship.ge/api/products/${productId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch product details");
    }

    const data = await response.json();

    // Check the actual data structure
    const productData = {
      ...data,
      available_colors: data.available_colors || data.availableColors || [],
      available_sizes: data.available_sizes || data.availableSizes || [],
    };

    return productData;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// Update product images
function updateProductImages(images) {
  const thumbnailList = document.querySelector(".thumbnail-list");
  const mainImage = document.querySelector(".main-image");

  // Clear existing content
  thumbnailList.innerHTML = "";
  mainImage.innerHTML = "";

  // Create main image
  const mainImg = document.createElement("img");
  mainImg.src = images[0]; 
  mainImg.alt = "Product Image";
  mainImage.appendChild(mainImg);

  // Add all thumbnails
  images.forEach((imageUrl, index) => {
    const thumbnail = document.createElement("img");
    thumbnail.src = imageUrl;
    thumbnail.alt = `Product Thumbnail ${index + 1}`;
    thumbnail.className = `thumbnail ${index === 0 ? "active" : ""}`;
    thumbnail.addEventListener("click", () => {
      mainImg.src = imageUrl;
      document.querySelectorAll(".thumbnail").forEach((thumb) => {
        thumb.classList.remove("active");
      });
      thumbnail.classList.add("active");
    });
    thumbnailList.appendChild(thumbnail);
  });

  // Function to update main image when color changes
  window.updateMainImage = function (imageUrl) {
    if (mainImg && imageUrl) {
      mainImg.src = imageUrl;
      
      document.querySelectorAll(".thumbnail").forEach((thumb) => {
        thumb.classList.toggle("active", thumb.src === imageUrl);
      });
    }
  };
}

// Update color options
function updateColorOptions(colors) {
  const colorOptions = document.querySelector(".color-options");
  colorOptions.innerHTML = "";

  
  const colorMapping = {
    white: "#FFFFFF",
    blue: "#0000FF",
    black: "#000000",
    red: "#FF0000",
    "baby pink": "#FFB6C1",
    
  };

  colors.forEach((color, index) => {
    const colorButton = document.createElement("button");
    colorButton.className = `color-option ${
      index === 0 ? "active" : ""
    } ${color.toLowerCase()}`;
    colorButton.setAttribute("data-color-name", color); 
    colorButton.style.backgroundColor =
      colorMapping[color.toLowerCase()] || color.toLowerCase();

    colorButton.addEventListener("click", () => {
      
      const colorIndex = window.availableColors.indexOf(color);
      const imageForColor = window.productImages[colorIndex];

    
      document.querySelectorAll(".color-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      colorButton.classList.add("active");

      
      if (imageForColor) {
        const mainImage = document.querySelector(".main-image img");
        if (mainImage) {
          mainImage.src = imageForColor;
        }

        
        document.querySelectorAll(".thumbnail").forEach((thumb) => {
          thumb.classList.toggle("active", thumb.src === imageForColor);
        });
      }
    });

    colorOptions.appendChild(colorButton);
  });
}

// Update size options
function updateSizeOptions(sizes) {
  const sizeOptions = document.querySelector(".size-options");
  sizeOptions.innerHTML = "";

  sizes.forEach((size, index) => {
    const sizeButton = document.createElement("button");
    sizeButton.className = `size-option ${index === 0 ? "active" : ""}`;
    sizeButton.textContent = size;

    sizeButton.addEventListener("click", () => {
      document.querySelectorAll(".size-option").forEach((opt) => {
        opt.classList.remove("active");
      });
      sizeButton.classList.add("active");
      document.querySelector(".size-label").textContent = `Size: ${size}`;
    });
    sizeOptions.appendChild(sizeButton);
  });
}

// Handle quantity changes
function setupQuantityControls() {
  const quantitySelect = document.querySelector(".quantity-selector");

  quantitySelect.addEventListener("change", (event) => {
    const selectedValue = parseInt(event.target.value);
    if (isNaN(selectedValue) || selectedValue < 1 || selectedValue > 10) {
      event.target.value = "1";
    }
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

  // Add click handler for Add to Cart button
  const addToCartBtn = document.querySelector(".add-to-cart");
  addToCartBtn.addEventListener("click", () => {
    const selectedColorElement = document.querySelector(".color-option.active");

    
    const selectedColor = selectedColorElement?.getAttribute("data-color-name");

    
    const selectedSizeElement = document.querySelector(".size-option.active");
    const selectedSize = selectedSizeElement?.textContent?.trim();

    
    const quantityInput = document.querySelector(".quantity-selector");
    const quantity = parseInt(quantityInput?.value || "1");

    if (!selectedColor || !selectedSize) {
      alert("Please select both color and size");
      return;
    }

    if (typeof window.cart?.addToCart !== "function") {
      console.error("Cart not initialized properly");
      alert("Cart not initialized properly. Please refresh the page.");
      return;
    }

    
    const colorIndex = window.availableColors.indexOf(selectedColor);
    const selectedImage = window.productImages[colorIndex];

    window.cart.addToCart(
      productId,
      quantity,
      selectedColor,
      selectedSize,
      selectedImage
    );
  });


  document.title = `${product.name} - RedSeam Clothing`;

  // Update product details
  document.querySelector(".product-title").textContent = product.name;
  document.querySelector(".product-price span").textContent = product.price;
  document.querySelector(".product-description").textContent =
    product.description;
  document.querySelector(".brand-name").textContent = "Brand: Tommy Hilfiger";
  document.querySelector(".brand-logo").src = "./Images/image 6.png";

  
  const productImages = product.images || [];
  const availableColors = product.available_colors || [];
  const availableSizes = product.available_sizes || [];

  
  window.productImages = productImages;
  window.availableColors = availableColors;

  
  updateProductImages(productImages);

  
  updateColorOptions(availableColors);

  
  updateSizeOptions(availableSizes);

  
  setupQuantityControls();

  
  setupUserAvatar();
}

function setupUserAvatar() {
  const avatarElement = document.getElementById("userAvatar");
  if (!avatarElement) {
    console.error("Avatar element not found!");
    return;
  }

  // Set default avatar
  avatarElement.src = "./Images/user.png";

  
  const userAvatar = localStorage.getItem("userAvatar");

  if (
    userAvatar &&
    (userAvatar.startsWith("data:image") || userAvatar.startsWith("http"))
  ) {
    avatarElement.src = userAvatar;
  } else {
  }

  
  avatarElement.onerror = function () {
    console.error("Avatar failed to load, falling back to default");
    avatarElement.src = "./Images/user.png";
  };

  avatarElement.onload = function () {
    
  };
}

// Start initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeProductPage);
