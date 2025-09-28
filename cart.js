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
    this.deliveryFee = 5; // Fixed delivery fee
    this.init();
  }

  init() {
    // Create cart panel HTML
    this.createCartPanel();

    // Add event listeners
    const cartButton = document.querySelector(".cart a");
    cartButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.openCart();
    });

    const closeButton = document.querySelector(".cart-close");
    closeButton.addEventListener("click", () => this.closeCart());

    const overlay = document.querySelector(".cart-overlay");
    overlay.addEventListener("click", () => this.closeCart());

    // Initialize cart
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
        <div class="cart-summary">
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

  async addToCart(productId, quantity, selectedColor, selectedSize) {
    try {
      const payload = {
        quantity: parseInt(quantity),
        color: selectedColor,
        size: selectedSize
      };

      console.log("Adding to cart:", payload);

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
            Accept: "application/json"
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("Add to cart response:", responseData);

      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }

      // Wait for the cart to load before opening it
      await this.loadCart();
      this.openCart();

      // Return the response data in case we need it
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
      console.log("Cart loaded raw data:", data);

      this.items = data;
      console.log("Cart items loaded:", this.items);

      console.log("Mapped items for display:", this.items);
      this.renderCart();
      this.updateCartCount();
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }

  async updateQuantity(productId, quantity) {
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

  async removeItem(productId) {
    try {
      const token = getCookie("authToken");
      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/cart/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      await this.loadCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }

  renderCart() {
    const cartItems = document.querySelector(".cart-items");
    const cartCount = this.items.length;

    // Update cart title count
    document.querySelector(".cart-header h2").textContent = `Shopping cart (${cartCount})`;

    if (!this.items || this.items.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <p>Uh-oh, you've got notin in your cart just you!</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = this.items
        .map(
          (item) => `
            <div class="cart-item" data-id="${item.id}">
              <img src="${item.image}" 
                   alt="${item.name}" 
                   class="cart-item-image">
              <div class="cart-item-content">
                <h3 class="cart-item-title">${item.name}</h3>
                <div class="cart-item-meta">
                  ${item.color}
                  <br>
                  ${item.size}
                </div>
                <div class="cart-item-price">$ ${item.price}</div>
                <div class="cart-item-controls">
                  <div class="quantity-controls">
                    <button class="quantity-btn" onclick="cart.decreaseQuantity(${item.id})">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="cart.increaseQuantity(${item.id})">+</button>
                  </div>
                  <button class="remove-item" onclick="cart.removeItem(${item.id})">Remove</button>
                </div>
              </div>
            </div>
          `
        )
        .join("");
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
    document.querySelector(".cart-count").textContent = count;
  }

  async increaseQuantity(productId) {
    const item = this.items.find((i) => i.id === productId);
    if (item && item.quantity < 10) {
      await this.updateQuantity(productId, item.quantity + 1);
    }
  }

  async decreaseQuantity(productId) {
    const item = this.items.find((i) => i.id === productId);
    if (item && item.quantity > 1) {
      await this.updateQuantity(productId, item.quantity - 1);
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
