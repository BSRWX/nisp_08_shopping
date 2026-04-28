const CART_STORAGE_KEY = "xkom_clone_cart";
let allProducts = []; // Przechowuje oryginalną listę pobraną z JSON

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  updateCartCounter();
  allProducts = await fetchProducts();

  if (allProducts.length > 0) {
    renderCategories(allProducts);
    renderProducts(allProducts); // Domyślnie pokaż wszystkie
  } else {
    document.getElementById("product-grid").innerHTML =
      "<p>Brak produktów do wyświetlenia.</p>";
  }
}

async function fetchProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) throw new Error("Błąd pobierania danych");
    return await response.json();
  } catch (error) {
    console.error("Wystąpił błąd:", error);
    document.getElementById("product-count").textContent =
      "Błąd wczytywania produktów";
    return [];
  }
}

// --- GENEROWANIE PRZYCISKÓW KATEGORII ---
function renderCategories(products) {
  const filtersContainer = document.getElementById("category-filters");

  // Użycie Set do wyciągnięcia unikalnych wartości kategorii
  const uniqueCategories = [
    "Wszystkie",
    ...new Set(products.map((p) => p.category)),
  ];

  filtersContainer.innerHTML = uniqueCategories
    .map(
      (cat) => `
        <button class="filter-btn ${cat === "Wszystkie" ? "active" : ""}" data-category="${cat}">
            ${cat}
        </button>
    `,
    )
    .join("");

  // Obsługa kliknięć w filtry
  const filterButtons = filtersContainer.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Zmiana aktywnego przycisku
      filterButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // Logika filtrowania
      const selectedCategory = e.target.getAttribute("data-category");

      if (selectedCategory === "Wszystkie") {
        renderProducts(allProducts);
      } else {
        const filteredProducts = allProducts.filter(
          (p) => p.category === selectedCategory,
        );
        renderProducts(filteredProducts);
      }
    });
  });
}

// --- RENDEROWANIE PRODUKTÓW ---
function renderProducts(products) {
  const grid = document.getElementById("product-grid");

  // Aktualizacja licznika widocznych produktów
  document.getElementById("product-count").textContent =
    `Wyświetlane: ${products.length} z ${allProducts.length}`;

  const productsHTML = products
    .map(
      (product) => `
        <article class="product-card">
            <a href="#" class="product-link">
                <div class="product-image">
                    <div class="img-placeholder">IMG</div>
                </div>
                <h2 class="product-title">${product.title}</h2>
            </a>
            
            <ul class="product-specs">
                ${product.specs.map((spec) => `<li>${spec}</li>`).join("")}
            </ul>

            <div class="product-bottom">
                <p class="product-availability">${product.availability}</p>
                <div class="product-price">${product.price.toFixed(2).replace(".", ",")} zł</div>
                
                <button class="add-to-cart-btn" data-id="${product.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    Do koszyka
                </button>
            </div>
        </article>
    `,
    )
    .join("");

  grid.innerHTML = productsHTML;

  // Ponowne podpięcie eventów po wyrenderowaniu nowych kart
  const buttons = grid.querySelectorAll(".add-to-cart-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = parseInt(button.getAttribute("data-id"));
      // Szukamy w pełnej bazie (allProducts), a nie w przefiltrowanej
      const selectedProduct = allProducts.find((p) => p.id === productId);
      addToCart(selectedProduct);
    });
  });
}

// --- LOGIKA KOSZYKA I LOCALSTORAGE ---
function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const existingProductIndex = cart.findIndex((item) => item.id === product.id);

  if (existingProductIndex > -1) {
    cart[existingProductIndex].quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartCounter();
}

function updateCartCounter() {
  const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cart-counter").textContent = totalItems;
}
