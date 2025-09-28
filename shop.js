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

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

async function fetchProducts(page = 1) {
  try {
    const token = getCookie("authToken");
    if (!token) {
      throw new Error("No auth token found");
    }

    const response = await axios.get(
      `https://api.redseam.redberryinternship.ge/api/products?page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return null;
  }
}

function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.cover_image}" alt="${product.name}" class="product-image">
    <div class="product-info">
      <div class="product-name">${product.name}</div>
      <div class="product-price">$ ${product.price}</div>
    </div>
  `;
  return card;
}

async function displayProducts() {
  const productContainer = document.getElementById("productContainer");
  const products = await fetchProducts(1);

  if (products && products.data) {
    productContainer.innerHTML = "";

    products.data.forEach((product) => {
      const card = createProductCard(product);
      productContainer.appendChild(card);
    });

    const resultsCount = document.querySelector(".right-side-bar p");
    if (resultsCount) {
      resultsCount.textContent = `Showing ${products.data.length} of ${products.total} results`;
    }
  } else {
    productContainer.innerHTML = "<p>No products available</p>";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getCookie("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const avatarElement = document.getElementById("userAvatar");
  avatarElement.src = "./Images/user.png";

  const userAvatar = getCookie("userAvatar");
  if (userAvatar && userAvatar.startsWith("data:image")) {
    avatarElement.src = userAvatar;
  }

  avatarElement.onerror = function () {
    avatarElement.src = "./Images/user.png";
  };

  await displayProducts();
});
