const ensureDomReady = () =>
  new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", resolve, { once: true });
    } else {
      resolve();
    }
  });

await ensureDomReady();

const STORAGE_KEYS = {
  MENU: "spice-garden-menu",
  CART: "spice-garden-cart",
  SALES: "spice-garden-sales",
};

const defaultMenu = [
  {
    id: "idly",
    name: "Idly",
    price: 30,
    image:
      "https://images.unsplash.com/photo-1607434472257-d9c17982a805?auto=format&fit=crop&w=400&q=80",
    description: "Steamed rice cakes served with chutney.",
  },
  {
    id: "puttu",
    name: "Puttu",
    price: 45,
    image:
      "https://images.unsplash.com/photo-1559628233-b9f95c707ae9?auto=format&fit=crop&w=400&q=80",
    description: "Fluffy rice logs with coconut & banana.",
  },
  {
    id: "poori",
    name: "Poori",
    price: 40,
    image:
      "https://images.unsplash.com/photo-1612198527553-427a01145880?auto=format&fit=crop&w=400&q=80",
    description: "Golden fried bread with masala curry.",
  },
  {
    id: "coffee",
    name: "Filter Coffee",
    price: 35,
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80",
    description: "Strong decoction with frothy milk.",
  },
  {
    id: "dosai",
    name: "Dosai",
    price: 50,
    image:
      "https://images.unsplash.com/photo-1612874472290-20ca9cb35ffb?auto=format&fit=crop&w=400&q=80",
    description: "Crisp dosa with sambar and chutney.",
  },
  {
    id: "vada",
    name: "Medu Vada",
    price: 25,
    image:
      "https://images.unsplash.com/photo-1641743517677-fe7f33c074a2?auto=format&fit=crop&w=400&q=80",
    description: "Crispy lentil doughnuts.",
  },
  {
    id: "pazhampori",
    name: "Pazhampori",
    price: 20,
    image:
      "https://images.unsplash.com/photo-1528839590813-7dc16def4ff7?auto=format&fit=crop&w=400&q=80",
    description: "Sweet banana fritters.",
  },
];

const dom = {
  menuGrid: document.getElementById("menu-grid"),
  menuTemplate: document.getElementById("menu-item-template"),
  cartContainer: document.getElementById("cart-items"),
  cartTemplate: document.getElementById("cart-item-template"),
  subtotal: document.getElementById("subtotal"),
  total: document.getElementById("total"),
  printBtn: document.getElementById("print-bill-btn"),
  clearBtn: document.getElementById("clear-cart-btn"),
  payBtn: document.getElementById("pay-now-btn"),
  qrModal: document.getElementById("qr-modal"),
  qrCloseBtn: document.getElementById("qr-close-btn"),
  addMenuBtn: document.getElementById("add-menu-item-btn"),
  menuForm: document.getElementById("menu-form"),
  menuIdInput: document.getElementById("menu-item-id"),
  menuNameInput: document.getElementById("menu-name"),
  menuPriceInput: document.getElementById("menu-price"),
  menuDescriptionInput: document.getElementById("menu-description"),
  menuImageInput: document.getElementById("menu-image"),
  menuPicker: document.getElementById("menu-picker"),
  menuFormCancel: document.getElementById("menu-form-cancel"),
  menuFormDelete: document.getElementById("menu-form-delete"),
  salesReport: document.getElementById("sales-report"),
};

const state = {
  menu: loadMenu(),
  cart: loadCart(),
  sales: loadSales(),
};

function loadMenu() {
  const stored = localStorage.getItem(STORAGE_KEYS.MENU);
  if (!stored) return [...defaultMenu];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed;
    }
    return [...defaultMenu];
  } catch {
    return [...defaultMenu];
  }
}

function saveMenu() {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(state.menu));
}

function loadCart() {
  const stored = localStorage.getItem(STORAGE_KEYS.CART);
  if (!stored) return {};
  try {
    return JSON.parse(stored) ?? {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
}

function loadSales() {
  const stored = localStorage.getItem(STORAGE_KEYS.SALES);
  if (!stored) return [];
  try {
    return JSON.parse(stored) ?? [];
  } catch {
    return [];
  }
}

function saveSales() {
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(state.sales));
}

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

function getMenuItem(itemId) {
  return state.menu.find((item) => item.id === itemId);
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ensureUniqueId(baseId) {
  const fallback = baseId || `item-${Date.now()}`;
  if (!getMenuItem(fallback)) return fallback;
  let counter = 1;
  let candidate = `${fallback}-${counter}`;
  while (getMenuItem(candidate)) {
    counter += 1;
    candidate = `${fallback}-${counter}`;
  }
  return candidate;
}

function renderMenu() {
  dom.menuGrid.innerHTML = "";

  state.menu.forEach((item) => {
    const fragment = dom.menuTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".menu-card");
    card.dataset.itemId = item.id;

    const img = fragment.querySelector("img");
    img.src = item.image;
    img.alt = item.name;

    fragment.querySelector("h4").textContent = item.name;
    fragment.querySelector("p").textContent = item.description;
    fragment.querySelector(".price").textContent = formatCurrency(item.price);

    card.addEventListener("click", () => addToCart(item.id));
    dom.menuGrid.appendChild(fragment);
  });
}

function addToCart(itemId) {
  const menuItem = getMenuItem(itemId);
  if (!menuItem) return;

  state.cart[itemId] = (state.cart[itemId] ?? 0) + 1;
  saveCart();
  renderCart();
}

function updateTotals() {
  const entries = Object.entries(state.cart);
  const subtotalValue = entries.reduce((total, [id, qty]) => {
    const item = getMenuItem(id);
    if (!item) return total;
    return total + item.price * qty;
  }, 0);

  dom.subtotal.textContent = formatCurrency(subtotalValue);
  dom.total.textContent = formatCurrency(subtotalValue);
}

function renderCart() {
  const entries = Object.entries(state.cart);
  dom.cartContainer.innerHTML = "";

  if (!entries.length) {
    dom.cartContainer.classList.add("empty");
    dom.cartContainer.innerHTML =
      "<p>No items yet. Tap a dish to add it to the bill.</p>";
    updateTotals();
    return;
  }

  dom.cartContainer.classList.remove("empty");

  entries.forEach(([id, qty]) => {
    const item = getMenuItem(id);
    if (!item) return;

    const fragment = dom.cartTemplate.content.cloneNode(true);
    fragment.querySelector("h4").textContent = item.name;
    fragment.querySelector("small").textContent = formatCurrency(item.price);
    fragment.querySelector(".qty").textContent = qty;
    fragment.querySelector(".line-total").textContent = formatCurrency(
      qty * item.price
    );

    fragment
      .querySelector(".decrement")
      .addEventListener("click", () => adjustQuantity(id, -1));
    fragment
      .querySelector(".increment")
      .addEventListener("click", () => adjustQuantity(id, 1));

    dom.cartContainer.appendChild(fragment);
  });

  updateTotals();
}

function adjustQuantity(itemId, delta) {
  if (!state.cart[itemId]) return;

  const updated = state.cart[itemId] + delta;
  if (updated <= 0) {
    delete state.cart[itemId];
  } else {
    state.cart[itemId] = updated;
  }
  saveCart();
  renderCart();
}

function clearCart() {
  state.cart = {};
  saveCart();
  renderCart();
}

function generateSaleRecord(total) {
  const items = Object.entries(state.cart).map(([id, qty]) => {
    const item = getMenuItem(id);
    return {
      id,
      name: item?.name ?? id,
      price: item?.price ?? 0,
      quantity: qty,
    };
  });

  return {
    id: crypto.randomUUID?.() ?? Date.now().toString(),
    timestamp: new Date().toISOString(),
    items,
    total,
  };
}

function handlePayment() {
  const entries = Object.entries(state.cart);
  if (!entries.length) {
    alert("Add items to the bill before collecting payment.");
    return;
  }

  const totalAmountText = dom.total.textContent.replace("₹", "") || "0";
  const totalAmount = Number(totalAmountText);
  const saleRecord = generateSaleRecord(totalAmount);
  state.sales.push(saleRecord);
  saveSales();
  renderSalesReport();
  clearCart();
  toggleQrModal(true);
}

function toggleQrModal(forceShow) {
  const show = forceShow ?? dom.qrModal.classList.contains("hidden");
  dom.qrModal.classList.toggle("hidden", !show);
}

function initControls() {
  dom.clearBtn.addEventListener("click", clearCart);
  dom.printBtn.addEventListener("click", () => window.print());
  dom.payBtn.addEventListener("click", handlePayment);
  dom.qrCloseBtn.addEventListener("click", () => toggleQrModal(false));
  dom.qrModal.addEventListener("click", (event) => {
    if (event.target === dom.qrModal) {
      toggleQrModal(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleQrModal(false);
    }
  });
}

function populateMenuPicker(selectedId = "") {
  if (!dom.menuPicker) return;
  dom.menuPicker.innerHTML = '<option value="">New item…</option>';
  state.menu
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      if (item.id === selectedId) option.selected = true;
      dom.menuPicker.appendChild(option);
    });
}

function resetMenuForm() {
  if (!dom.menuForm) return;
  dom.menuIdInput.value = "";
  dom.menuNameInput.value = "";
  dom.menuPriceInput.value = "";
  dom.menuDescriptionInput.value = "";
  dom.menuImageInput.value = "";
  dom.menuPicker.value = "";
  if (dom.menuFormDelete) {
    dom.menuFormDelete.disabled = true;
  }
}

function loadMenuIntoForm(itemId) {
  const item = getMenuItem(itemId);
  if (!item) {
    resetMenuForm();
    return;
  }

  dom.menuIdInput.value = item.id;
  dom.menuNameInput.value = item.name;
  dom.menuPriceInput.value = item.price;
  dom.menuDescriptionInput.value = item.description ?? "";
  dom.menuImageInput.value = item.image;
  if (dom.menuFormDelete) {
    dom.menuFormDelete.disabled = false;
  }
}

function handleMenuSubmit(event) {
  event.preventDefault();

  const existingId = dom.menuIdInput.value.trim();
  const name = dom.menuNameInput.value.trim();
  const price = Number(dom.menuPriceInput.value);
  const description = dom.menuDescriptionInput.value.trim();
  const image = dom.menuImageInput.value.trim();

  if (!name || Number.isNaN(price) || price < 0 || !image) {
    alert("Please provide valid name, price, and image URL.");
    return;
  }

  const baseId = slugifyName(name) || existingId;
  const id = existingId || ensureUniqueId(baseId);
  const updatedItem = {
    id,
    name,
    price: Math.round(price * 100) / 100,
    image,
    description: description || "Customer favorite.",
  };

  const existingIndex = state.menu.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.menu[existingIndex] = updatedItem;
  } else {
    state.menu.push(updatedItem);
  }

  saveMenu();
  renderMenu();
  populateMenuPicker(id);
  loadMenuIntoForm(id);
  alert("Menu saved.");
}

function handleMenuDelete() {
  const id = dom.menuIdInput.value.trim();
  if (!id) return;

  const confirmed = confirm("Remove this item from the menu?");
  if (!confirmed) return;

  state.menu = state.menu.filter((item) => item.id !== id);
  delete state.cart[id];
  saveMenu();
  saveCart();
  renderMenu();
  renderCart();
  populateMenuPicker();
  resetMenuForm();
}

function summarizeSalesByMonth() {
  return state.sales.reduce((acc, sale) => {
    const date = new Date(sale.timestamp);
    if (Number.isNaN(date.valueOf())) return acc;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!acc[key]) {
      acc[key] = { total: 0, orders: 0 };
    }
    acc[key].orders += 1;
    acc[key].total += sale.total ?? 0;
    return acc;
  }, {});
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1);
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function renderSalesReport() {
  if (!dom.salesReport) return;
  const summary = summarizeSalesByMonth();
  const entries = Object.entries(summary).sort(([a], [b]) => (a > b ? -1 : 1));

  dom.salesReport.innerHTML = "";
  if (!entries.length) {
    dom.salesReport.innerHTML =
      "<p>No sales recorded yet. Collect a payment to see monthly totals.</p>";
    return;
  }

  entries.forEach(([month, data]) => {
    const card = document.createElement("div");
    card.className = "sales-card";
    const revenue = formatCurrency(data.total);
    card.innerHTML = `
      <strong>${formatMonthLabel(month)}</strong>
      <span>${data.orders} orders</span>
      <span>${revenue} collected</span>
    `;
    dom.salesReport.appendChild(card);
  });
}

function initMenuManagement() {
  if (!dom.menuForm) return;
  populateMenuPicker();
  resetMenuForm();

  dom.menuPicker.addEventListener("change", (event) => {
    const id = event.target.value;
    if (id) {
      loadMenuIntoForm(id);
    } else {
      resetMenuForm();
    }
  });

  dom.addMenuBtn.addEventListener("click", () => {
    resetMenuForm();
    dom.menuNameInput.focus();
  });

  dom.menuForm.addEventListener("submit", handleMenuSubmit);
  dom.menuFormCancel?.addEventListener("click", resetMenuForm);
  dom.menuFormDelete?.addEventListener("click", handleMenuDelete);
}

function init() {
  renderMenu();
  renderCart();
  initControls();
  initMenuManagement();
  renderSalesReport();
}

init();

