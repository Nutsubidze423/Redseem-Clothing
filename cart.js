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

class Cart {
  constructor() {
    this.items = [];
    this.deliveryFee = 5; 
    this.init();
  }

  init() {
    
    this.createCartPanel();

    
    const cartButton = document.querySelector(".cart a");
    cartButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCart();
    });

    const closeButton = document.querySelector(".cart-close");
    closeButton.addEventListener("click", () => this.closeCart());

    const overlay = document.querySelector(".cart-overlay");
    overlay.addEventListener("click", () => this.closeCart());

    
    this.loadCart();
  }

  createCartPanel() {
    const cartHTML = `
      <div class="cart-overlay"></div>
      <div class="cart-panel">
        <div class="cart-header">
          <h2>Shopping cart (0)</h2>
          <button class="cart-close">×</button>
        </div>
        <div class="cart-items">
          <!-- Cart items will be inserted here -->
        </div>
        <div class="cart-summary" style="display: none;">
          <div class="summary-row">
            <span>Items subtotal</span>
            <span class="subtotal">$ 0.00</span>
          </div>
          <div class="summary-row">
            <span>Delivery</span>
            <span>$ ${this.deliveryFee}.00</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span class="total-amount">$ 0.00</span>
          </div>
          <button class="checkout-btn" onclick="cart.goToCheckout()">Go to checkout</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", cartHTML);
  }

  async addToCart(
    productId,
    quantity,
    selectedColor,
    selectedSize,
    selectedImage
  ) {
    try {
      // Capture the current product image for this color
      const currentImage =
        selectedImage || document.querySelector(".main-image img")?.src;

      const payload = {
        quantity: parseInt(quantity),
        color: selectedColor,
        size: selectedSize,
      };

      const token = getCookie("authToken");
      if (!token) {
        window.location.href = "index.html";
        return;
      }

      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/cart/products/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }

      // Store the image URL in localStorage for this cart item
      if (currentImage) {
        localStorage.setItem(
          `cartImage_${productId}_${selectedColor}`,
          currentImage
        );
      }

      
      await this.loadCart();
      this.openCart();

     
      return responseData;
    } catch (error) {
      console.error("Error adding to cart:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
      });
      alert(
        "Failed to add item to cart. Please check the console for details."
      );
    }
  }

  async loadCart() {
    try {
      const token = getCookie("authToken");
      if (!token) {
        return;
      }

      const response = await fetch(
        "https://api.redseam.redberryinternship.ge/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load cart");
      }

      const data = await response.json();

      // Add stored images to the cart items
      this.items = data.map((item) => {
        const storedImage = localStorage.getItem(
          `cartImage_${item.id}_${item.color}`
        );
        return {
          ...item,
          image: storedImage || item.image || "", 
        };
      });

      this.renderCart();
      this.updateCartCount();
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }

  async updateQuantity(productId, quantity, color, size) {
    try {
      const token = getCookie("authToken");
      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/cart/products/${productId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: parseInt(quantity),
            color: color,
            size: size,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      await this.loadCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }

  async removeItem(productId, color, size) {
    try {
      const token = getCookie("authToken");
      const itemToRemove = this.items.find(
        (item) =>
          item.id === productId && item.color === color && item.size === size
      );

      if (!itemToRemove) {
        console.error("Item not found in cart:", { productId, color, size });
        return;
      }

      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/cart/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: productId,
            color: color,
            size: size,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error("Failed to remove item");
      }

      localStorage.removeItem(`cartImage_${productId}_${color}`);

      
      this.items = this.items.filter(
        (item) =>
          !(item.id === productId && item.color === color && item.size === size)
      );

      // Refresh the cart display
      this.renderCart();
      this.updateCartCount();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }

  renderCart() {
    const cartItems = document.querySelector(".cart-items");
    const cartCount = this.items.length;

    // Update cart title count
    document.querySelector(
      ".cart-header h2"
    ).textContent = `Shopping cart (${cartCount})`;

    if (!this.items || this.items.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <img src="Images/Making Credit Purchase Online Securely.png" alt="Empty Cart">
          <p>Uh-oh, you've got nothing in your cart just yet...</p>
          <button class="start-shopping-btn">Start shopping</button>
        </div>
      `;
      document.querySelector(".cart-summary").style.display = "none";

      // Add event listener for start shopping button
      const startShoppingBtn = cartItems.querySelector(".start-shopping-btn");
      if (startShoppingBtn) {
        startShoppingBtn.addEventListener("click", () => {
          window.location.href = "shop.html";
        });
      }
    } else {
      document.querySelector(".cart-summary").style.display = "block";
      cartItems.innerHTML = this.items
        .map((item) => {
          const variantId = `${item.id}-${item.color}-${item.size}`;
          return `
            <div class="cart-item" data-id="${item.id}" data-variant-id="${variantId}" data-color="${item.color}" data-size="${item.size}">
              <img src="${item.image}" 
                   alt="${item.name}" 
                   class="cart-item-image">
              <div class="cart-item-content">
                <div class="cart-item-header">
                  <h3 class="cart-item-title">${item.name}</h3>
                  <div class="cart-item-price">$ ${item.price}</div>
                </div>
                <div class="cart-item-meta">
                  ${item.color}
                  <br>
                  ${item.size}
                </div>
                <div class="cart-item-controls">
                  <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-id="${item.id}" data-variant-id="${variantId}">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}" data-variant-id="${variantId}">+</button>
                  </div>
                  <button class="remove-item" data-id="${item.id}" data-variant-id="${variantId}">Remove</button>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      // Add event listeners for cart item controls
      cartItems.querySelectorAll(".quantity-btn.decrease").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id);
          const cartItem = btn.closest(".cart-item");
          const color = cartItem.dataset.color;
          const size = cartItem.dataset.size;
          const item = this.items.find(
            (i) => i.id === id && i.color === color && i.size === size
          );
          if (item) {
            this.decreaseQuantity(id, color, size);
          }
        });
      });

      cartItems.querySelectorAll(".quantity-btn.increase").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = parseInt(btn.dataset.id);
          const cartItem = btn.closest(".cart-item");
          const color = cartItem.dataset.color;
          const size = cartItem.dataset.size;
          const item = this.items.find(
            (i) => i.id === id && i.color === color && i.size === size
          );
          if (item) {
            this.increaseQuantity(id, color, size);
          }
        });
      });

      cartItems.querySelectorAll(".remove-item").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          const cartItem = btn.closest(".cart-item");
          const id = parseInt(cartItem.dataset.id);
          const color = cartItem.dataset.color;
          const size = cartItem.dataset.size;

          if (id && color && size) {
            this.removeItem(id, color, size);
          }
        });
      });
    }

    this.updateSummary();
  }

  updateSummary() {
    const subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + this.deliveryFee;

    document.querySelector(".subtotal").textContent = `$ ${subtotal.toFixed(
      2
    )}`;
    document.querySelector(".total-amount").textContent = `$ ${total.toFixed(
      2
    )}`;
  }

  updateCartCount() {
    const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.querySelector(".cart-count");
    if (cartCountElement) {
      cartCountElement.textContent = count;
    }
  }

  debounceUpdate(func) {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(func, 300);
  }

  async increaseQuantity(productId, color, size) {
    const item = this.items.find(
      (i) => i.id === productId && i.color === color && i.size === size
    );
    if (item && item.quantity < 10) {
      this.debounceUpdate(() => {
        this.updateQuantity(productId, item.quantity + 1, color, size);
      });
    }
  }

  async decreaseQuantity(productId, color, size) {
    const item = this.items.find(
      (i) => i.id === productId && i.color === color && i.size === size
    );
    if (item && item.quantity > 1) {
      this.debounceUpdate(() => {
        this.updateQuantity(productId, item.quantity - 1, color, size);
      });
    }
  }

  openCart() {
    document.querySelector(".cart-panel").classList.add("open");
    document.querySelector(".cart-overlay").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  closeCart() {
    document.querySelector(".cart-panel").classList.remove("open");
    document.querySelector(".cart-overlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  goToCheckout() {
    if (this.items.length > 0) {
      window.location.href = "checkout.html";
    }
  }
}

// Initialize cart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.cart = new Cart();
});
