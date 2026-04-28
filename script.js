const CART_STORAGE_KEY = "xkom_clone_cart";
let allProducts = []; // Przechowuje oryginalną listę pobraną z JSON

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-grid")) {
    initApp();
  }
  if (document.querySelector(".shopping-list")) {
    initCartPage();
  }
  updateCartCounter();
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
  const counterEl = document.getElementById("cart-counter");
  if (counterEl) {
    counterEl.textContent = totalItems;
  }
}

// --- LOGIKA STRONY KOSZYKA ---
function initCartPage() {
  renderCartItems();
}

function renderCartItems() {
  const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const listContainer = document.querySelector('.shopping-list');
  const summaryTotal = document.querySelector('.summary-total');
  const itemCount = document.querySelector('.item-count');

  if (!listContainer) return;

  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="padding: 24px 32px; font-weight: 600;">Twój koszyk jest pusty.</p>';
    summaryTotal.textContent = '0,00 zł';
    itemCount.textContent = '0 produktów';
    return;
  }

  let totalValue = 0;
  let totalItems = 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2
    }).format(price).replace('PLN', 'zł');
  };

  listContainer.innerHTML = cart.map((item) => {
    const itemTotal = item.price * item.quantity;
    totalValue += itemTotal;
    totalItems += item.quantity;

    return `
        <li class="list-item" data-id="${item.id}">
          <div class="item-image">
            <div class="img-placeholder">IMG</div>
          </div>
          <div class="item-details">
            <h2 class="item-title">${item.title}</h2>
            <p class="item-availability">${item.availability || 'W magazynie'}</p>
          </div>
          <div class="item-actions">
            <div class="quantity-control">
              <button class="qty-btn" aria-label="Zmniejsz ilość" onclick="updateCartItemQuantity(${item.id}, -1)">-</button>
              <input
                type="number"
                class="qty-input"
                value="${item.quantity}"
                min="1"
                aria-label="Ilość sztuk"
                onchange="setCartItemQuantity(${item.id}, this.value)"
              />
              <button class="qty-btn" aria-label="Zwiększ ilość" onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="item-price">
              <span>${formatPrice(itemTotal)}</span>
            </div>
            <button class="remove-btn" aria-label="Usuń z listy" onclick="removeCartItem(${item.id})">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </li>
      `;
  }).join('');

  summaryTotal.textContent = formatPrice(totalValue);
  itemCount.textContent = `${totalItems} ${getPluralForm(totalItems)}`;
}

function updateCartItemQuantity(id, delta) {
  let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity < 1) item.quantity = 1;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderCartItems();
    updateCartCounter();
  }
}

function setCartItemQuantity(id, value) {
  let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  const item = cart.find(i => i.id === id);
  if (item) {
    let newQty = parseInt(value);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    item.quantity = newQty;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderCartItems();
    updateCartCounter();
  }
}

function removeCartItem(id) {
  let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  renderCartItems();
  updateCartCounter();
}

function getPluralForm(count) {
  if (count === 1) return 'produkt';
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return 'produkty';
  }
  return 'produktów';
}
