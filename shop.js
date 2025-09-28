// Cookie management functions
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

function setupUserAvatar() {
  const avatarElement = document.getElementById("userAvatar");
  if (!avatarElement) {
    return;
  }

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
    console.error("Avatar failed to load, falling back to default");
    avatarElement.src = "./Images/user.png";
  };

  avatarElement.onload = function () {
    // Avatar loaded successfully
  };
}

// Function to update active filters display
function updateActiveFilters() {
  const activeFiltersContainer = document.querySelector(".active-filters");
  activeFiltersContainer.innerHTML = "";

  if (currentFilters.priceFrom || currentFilters.priceTo) {
    const filterTag = document.createElement("div");
    filterTag.className = "filter-tag";
    filterTag.innerHTML = `
      Price: ${currentFilters.priceFrom || 0} - ${currentFilters.priceTo || "∞"}
      <span class="remove-filter" onclick="clearPriceFilter()">×</span>
    `;
    activeFiltersContainer.appendChild(filterTag);
  }
}

function clearPriceFilter() {
  currentFilters.priceFrom = null;
  currentFilters.priceTo = null;
  document.getElementById("priceFrom").value = "";
  document.getElementById("priceTo").value = "";
  displayProducts(1);
}

// Store current filter state
let currentFilters = {
  priceFrom: null,
  priceTo: null,
  sort: null,
};

// Fetch products from API with pagination and filters
async function fetchProducts(page = 1) {
  try {
    const token = getCookie("authToken");
    if (!token) {
      throw new Error("No auth token found");
    }

    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (currentFilters.priceFrom !== null && currentFilters.priceFrom !== "") {
      params.append("filter[price_from]", currentFilters.priceFrom.toString());
    }
    if (currentFilters.priceTo !== null && currentFilters.priceTo !== "") {
      params.append("filter[price_to]", currentFilters.priceTo.toString());
    }
    if (currentFilters.sort) {
      params.append("sort", currentFilters.sort);
    }
    updateActiveFilters();
    const url = `https://api.redseam.redberryinternship.ge/api/products?${params.toString()}`;

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
  card.style.cursor = "pointer";
  card.onclick = () => {
    window.location.href = `product.html?id=${product.id}`;
  };

  const imageUrl =
    product.cover_image || "https://via.placeholder.com/300x400?text=No+Image";

  card.innerHTML = `
    <img src="${imageUrl}" alt="${
    product.name
  }" class="product-image" onerror="this.src='https://via.placeholder.com/300x400?text=Error+Loading+Image'">
    <div class="product-info">
      <div class="product-name">${product.name || "Unnamed Product"}</div>
      <div class="product-price">$ ${product.price || "0.00"}</div>
    </div>
  `;
  return card;
}

// Create pagination controls with dynamic page numbers
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
  } else if (currentPage > totalPages - 4) {
    pageNumbers.appendChild(addPageButton(1));
    pageNumbers.appendChild(addDots());
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pageNumbers.appendChild(addPageButton(i));
    }
  } else {
    pageNumbers.appendChild(addPageButton(1));
    pageNumbers.appendChild(addDots());
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pageNumbers.appendChild(addPageButton(i));
    }
    pageNumbers.appendChild(addDots());
    pageNumbers.appendChild(addPageButton(totalPages));
  }
}

// Display products with pagination and loading state
async function displayProducts(page = 1) {
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "<p>Loading...</p>";

  try {
    const products = await fetchProducts(page);

    if (products && products.data && products.data.length > 0) {
      productContainer.innerHTML = "";

      products.data.forEach((product) => {
        const card = createProductCard(product);
        productContainer.appendChild(card);
      });

      const resultsCount = document.querySelector(".right-side-bar p");
      if (resultsCount) {
        const start = (page - 1) * products.data.length + 1;
        const end = start + products.data.length - 1;
        const totalItems = products.meta?.total || products.data.length;
        resultsCount.textContent = `Showing ${start}-${end} of ${totalItems} results`;
      }

      const totalPages = products.meta?.last_page || 1;
      createPagination(page, totalPages);
    } else {
      productContainer.innerHTML =
        "<p>No products found for the selected filters</p>";
    }
  } catch (error) {
    console.error("Error displaying products:", error);
    productContainer.innerHTML =
      "<p>Error loading products. Please try again.</p>";
  }
}

async function loadPage(pageNumber) {
  await displayProducts(pageNumber);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Initialize page and setup event handlers
document.addEventListener("DOMContentLoaded", async () => {
  const token = getCookie("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // Setup user avatar with debugging
  setupUserAvatar();

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
    const lastPageButton =
      document.querySelector(".page-numbers").lastElementChild;
    const totalPages = parseInt(lastPageButton.textContent);

    if (currentPage < totalPages) {
      await loadPage(currentPage + 1);
    }
  });

  // Setup price filter controls
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
    let fromValue = priceFromInput.value.trim();
    let toValue = priceToInput.value.trim();

    const fromNumber = fromValue ? Number(fromValue) : null;
    const toNumber = toValue ? Number(toValue) : null;

    if (fromValue && isNaN(fromNumber)) {
      alert("Please enter a valid number for minimum price");
      return;
    }
    if (toValue && isNaN(toNumber)) {
      alert("Please enter a valid number for maximum price");
      return;
    }

    if (fromNumber !== null && toNumber !== null && fromNumber > toNumber) {
      alert(
        'Invalid price range: "From" value cannot be greater than "To" value'
      );
      return;
    }

    currentFilters.priceFrom = fromNumber;
    currentFilters.priceTo = toNumber;

    filterDropdown.classList.remove("active");
    await displayProducts(1);
  });

  // Sort functionality
  const sortbyButton = document.querySelector(".sortby");
  const sortDropdown = document.querySelector(".sort-dropdown");
  const sortOptions = document.querySelectorAll(".sort-option");

  // Toggle sort dropdown
  sortbyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    sortDropdown.classList.toggle("active");
  });

  // Close sort dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!sortDropdown?.contains(e.target) && !sortbyButton.contains(e.target)) {
      sortDropdown?.classList.remove("active");
    }
  });

  // Handle sort option selection
  sortOptions.forEach((option) => {
    option.addEventListener("click", async () => {
      const sortValue = option.dataset.sort;
      currentFilters.sort = sortValue;
      sortbyButton.querySelector("p").textContent = option.textContent;
      sortDropdown.classList.remove("active");
      await displayProducts(1);
    });
  });

  await displayProducts(1);
});
