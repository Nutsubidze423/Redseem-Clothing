// Get cart data from localStorage and display it
class Checkout {
  constructor() {
    this.items = [];
    this.deliveryFee = 5;
    this.init();
  }

  init() {
    this.loadCart();
    this.setupFormValidation();
    this.setupUserAvatar();

    // Add event listener for the pay button
    const payButton = document.querySelector(".pay-button");
    if (payButton) {
      payButton.disabled = true; // Initially disable pay button
      payButton.addEventListener("click", () => this.processPayment());
    }

    // Add event listeners for modal buttons
    const modalOkButton = document.getElementById("modalOkButton");
    const closeModalButton = document.querySelector(".close-modal");

    if (modalOkButton) {
      modalOkButton.addEventListener("click", () => {
        document.getElementById("successModal").style.display = "none";
        window.location.href = "shop.html";
      });
    }

    if (closeModalButton) {
      closeModalButton.addEventListener("click", () => {
        document.getElementById("successModal").style.display = "none";
        window.location.href = "shop.html";
      });
    }
  }

  setupFormValidation() {
    const inputs = {
      name: {
        element: document.getElementById("name"),
        validator: (value) => value.length >= 2,
        error: "Name must be at least 2 characters long",
      },
      surname: {
        element: document.getElementById("surname"),
        validator: (value) => value.length >= 2,
        error: "Surname must be at least 2 characters long",
      },
      email: {
        element: document.getElementById("email"),
        validator: (value) => this.validateEmail(value),
        error: "Please enter a valid email address",
      },
      address: {
        element: document.getElementById("address"),
        validator: (value) => value.length >= 5,
        error: "Address must be at least 5 characters long",
      },
      zipcode: {
        element: document.getElementById("zipcode"),
        validator: (value) => /^\d{5}$/.test(value),
        error: "Please enter a valid 5-digit zip code",
      },
    };

    // Add validation to each input
    Object.keys(inputs).forEach((key) => {
      const input = inputs[key];
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      errorDiv.textContent = input.error;
      input.element.parentNode.appendChild(errorDiv);

      input.element.addEventListener("input", () => {
        this.validateInput(input.element, input.validator, errorDiv);
        this.updatePayButtonState();
      });
    });
  }

  validateInput(input, validator, errorDiv) {
    const isValid = validator(input.value);
    input.classList.toggle("error", !isValid);
    errorDiv.classList.toggle("visible", !isValid);
    return isValid;
  }

  updatePayButtonState() {
    const payButton = document.querySelector(".pay-button");
    const allInputsValid = [
      "name",
      "surname",
      "email",
      "address",
      "zipcode",
    ].every((id) => {
      const input = document.getElementById(id);
      return !input.classList.contains("error") && input.value.trim() !== "";
    });

    payButton.disabled = !allInputsValid;
  }

  async loadCart() {
    try {
      const token = this.getCookie("authToken");
      if (!token) {
        window.location.href = "index.html";
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
          image: storedImage || item.image || "", // Use stored image if available
        };
      });

      this.renderCart();
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  }

  renderCart() {
    const cartItems = document.querySelector(".cart-items");

    if (!this.items || this.items.length === 0) {
      window.location.href = "shop.html"; // Redirect to shop if cart is empty
      return;
    }

    cartItems.innerHTML = this.items
      .map(
        (item) => `
                <div class="cart-item" data-id="${item.id}" data-color="${item.color}" data-size="${item.size}">
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
                                <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                                <span class="cart-item-quantity">${item.quantity}</span>
                                <button class="quantity-btn increase" data-id="${item.id}">+</button>
                            </div>
                            <button class="remove-item" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                </div>
            `
      )
      .join("");

    this.updateSummary();
    this.addEventListeners();
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

  addEventListeners() {
    // Add event listeners for quantity controls and remove buttons
    document.querySelectorAll(".quantity-btn.decrease").forEach((btn) => {
      btn.addEventListener("click", () => this.decreaseQuantity(btn));
    });

    document.querySelectorAll(".quantity-btn.increase").forEach((btn) => {
      btn.addEventListener("click", () => this.increaseQuantity(btn));
    });

    document.querySelectorAll(".remove-item").forEach((btn) => {
      btn.addEventListener("click", () => this.removeItem(btn));
    });
  }

  async updateQuantity(productId, quantity, color, size) {
    try {
      const token = this.getCookie("authToken");
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

  async removeItem(button) {
    try {
      const cartItem = button.closest(".cart-item");
      const id = parseInt(cartItem.dataset.id);
      const color = cartItem.dataset.color;
      const size = cartItem.dataset.size;

      const token = this.getCookie("authToken");
      const response = await fetch(
        `https://api.redseam.redberryinternship.ge/api/cart/products/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            color: color,
            size: size,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      localStorage.removeItem(`cartImage_${id}_${color}`);
      await this.loadCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }

  decreaseQuantity(button) {
    const cartItem = button.closest(".cart-item");
    const id = parseInt(cartItem.dataset.id);
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;
    const quantityElem = cartItem.querySelector(".cart-item-quantity");
    const currentQuantity = parseInt(quantityElem.textContent);

    if (currentQuantity > 1) {
      this.updateQuantity(id, currentQuantity - 1, color, size);
    }
  }

  increaseQuantity(button) {
    const cartItem = button.closest(".cart-item");
    const id = parseInt(cartItem.dataset.id);
    const color = cartItem.dataset.color;
    const size = cartItem.dataset.size;
    const quantityElem = cartItem.querySelector(".cart-item-quantity");
    const currentQuantity = parseInt(quantityElem.textContent);

    if (currentQuantity < 10) {
      this.updateQuantity(id, currentQuantity + 1, color, size);
    }
  }

  getCookie(name) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split("=").map((c) => c.trim());
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  async processPayment() {
    // Get form data
    const formData = {
      name: document.getElementById("name").value,
      surname: document.getElementById("surname").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      zipcode: document.getElementById("zipcode").value,
    };

    try {
      const token = this.getCookie("authToken");

      // Clear each item from the cart individually
      for (const item of this.items) {
        try {
          const response = await fetch(
            `https://api.redseam.redberryinternship.ge/api/cart/products/${item.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                color: item.color,
                size: item.size,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to remove item ${item.id}`);
          }

          // Remove the item's image from localStorage
          localStorage.removeItem(`cartImage_${item.id}_${item.color}`);
        } catch (error) {
          console.error(`Error removing item ${item.id}:`, error);
        }
      }

      // Show success modal
      const modal = document.getElementById("successModal");
      modal.style.display = "flex";

      // Clear the items array
      this.items = [];

      // The modal's OK button will handle the redirect to shop page
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    }
  }

  validateForm(formData) {
    if (!formData.name || !formData.surname) {
      alert("Please enter your name and surname");
      return false;
    }
    if (!formData.email || !this.validateEmail(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }
    if (!formData.address) {
      alert("Please enter your address");
      return false;
    }
    if (!formData.zipcode) {
      alert("Please enter your zip code");
      return false;
    }
    return true;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  setupUserAvatar() {
    const avatarElement = document.getElementById("userAvatar");
    if (!avatarElement) return;

    // Set default avatar
    avatarElement.src = "./Images/user.png";

    // Try to get custom avatar from localStorage
    const userAvatar = localStorage.getItem("userAvatar");
    if (
      userAvatar &&
      (userAvatar.startsWith("data:image") || userAvatar.startsWith("http"))
    ) {
      avatarElement.src = userAvatar;
    }

    // Handle image load errors
    avatarElement.onerror = function () {
      avatarElement.src = "./Images/user.png";
    };
  }
}

// Initialize checkout when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.checkout = new Checkout();
});
