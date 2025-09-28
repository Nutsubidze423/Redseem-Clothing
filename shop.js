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

let currentFilters = {
  priceFrom: null,
  priceTo: null,
};

async function fetchProducts(page = 1) {
  try {
    const token = getCookie("authToken");
    if (!token) {
      throw new Error("No auth token found");
    }

    let url = `https://api.redseam.redberryinternship.ge/api/products?page=${page}`;

    
    if (currentFilters.priceFrom !== null) {
      url += `&priceFrom=${currentFilters.priceFrom}`;
    }
    if (currentFilters.priceTo !== null) {
      url += `&priceTo=${currentFilters.priceTo}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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

function createPagination(currentPage, totalPages) {
  const pageNumbers = document.querySelector(".page-numbers");
  pageNumbers.innerHTML = "";

  function addPageButton(num) {
    const button = document.createElement("button");
    button.className = `page-number${currentPage === num ? " active" : ""}`;
    button.textContent = num;
    button.onclick = () => loadPage(num);
    return button;
  }

  function addDots() {
    const dots = document.createElement("span");
    dots.className = "page-dots";
    dots.textContent = "...";
    return dots;
  }

 
  const prevButton = document.querySelector(".prev");
  prevButton.disabled = currentPage === 1;

  
  const nextButton = document.querySelector(".next");
  nextButton.disabled = currentPage === totalPages;

 
  if (currentPage <= 4) {
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      pageNumbers.appendChild(addPageButton(i));
    }
    if (totalPages > 5) {
      pageNumbers.appendChild(addDots());
      pageNumbers.appendChild(addPageButton(totalPages));
    }
  }
  
  else if (currentPage > totalPages - 4) {
    pageNumbers.appendChild(addPageButton(1));
    pageNumbers.appendChild(addDots());
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pageNumbers.appendChild(addPageButton(i));
    }
  }
 
  else {
    pageNumbers.appendChild(addPageButton(1));
    pageNumbers.appendChild(addDots());
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pageNumbers.appendChild(addPageButton(i));
    }
    pageNumbers.appendChild(addDots());
    pageNumbers.appendChild(addPageButton(totalPages));
  }
}

async function displayProducts(page = 1) {
  const productContainer = document.getElementById("productContainer");
  const products = await fetchProducts(page);

  if (products && products.data) {
    productContainer.innerHTML = "";

    products.data.forEach((product) => {
      const card = createProductCard(product);
      productContainer.appendChild(card);
    });

    const resultsCount = document.querySelector(".right-side-bar p");
    if (resultsCount) {
      const start = (page - 1) * products.data.length + 1;
      const end = start + products.data.length - 1;
      resultsCount.textContent = `Showing ${start}-${end} of ${products.total} results`;
    }

    
    createPagination(page, 10);
  } else {
    productContainer.innerHTML = "<p>No products available</p>";
  }
}

async function loadPage(pageNumber) {
  await displayProducts(pageNumber);
  window.scrollTo({ top: 0, behavior: "smooth" });
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

  
  document.querySelector(".prev").addEventListener("click", async () => {
    const currentPage = parseInt(
      document.querySelector(".page-number.active").textContent
    );
    if (currentPage > 1) {
      await loadPage(currentPage - 1);
    }
  });

  document.querySelector(".next").addEventListener("click", async () => {
    const currentPage = parseInt(
      document.querySelector(".page-number.active").textContent
    );
    if (currentPage < 10) {
      await loadPage(currentPage + 1);
    }
  });

 
  const filterButton = document.querySelector(".filter-button");
  const filterDropdown = document.querySelector(".filter-dropdown");
  const applyFilterButton = document.querySelector(".apply-filter");
  const priceFromInput = document.getElementById("priceFrom");
  const priceToInput = document.getElementById("priceTo");

 
  filterButton.addEventListener("click", (e) => {
    e.stopPropagation();
    filterDropdown.classList.toggle("active");
  });

  
  document.addEventListener("click", (e) => {
    if (
      !filterDropdown.contains(e.target) &&
      !filterButton.contains(e.target)
    ) {
      filterDropdown.classList.remove("active");
    }
  });

  
  applyFilterButton.addEventListener("click", async () => {
    const fromValue = priceFromInput.value
      ? Number(priceFromInput.value)
      : null;
    const toValue = priceToInput.value ? Number(priceToInput.value) : null;

    
    if (fromValue && toValue && fromValue > toValue) {
      alert("Invalid price range");
      return;
    }

    currentFilters.priceFrom = fromValue;
    currentFilters.priceTo = toValue;

    filterDropdown.classList.remove("active");
    await displayProducts(1); 
  });

  await displayProducts(1);
});
