const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function isAdmin() {
  const me = await fetch("/api/admin/me").then(r => r.json());
  return me.isAdmin;
}

async function login() {
  $("loginMsg").textContent = "";
  const username = $("user").value.trim();
  const password = $("pass").value;

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    $("loginMsg").textContent = data.error || "Login failed.";
    return;
  }

  await bootAdmin();
}

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  location.reload();
}

let categories = [];
let items = [];

async function loadCategories() {
  categories = await fetch("/api/categories").then(r => r.json());

  // Add item form category select
  $("catSelect").innerHTML = categories.length
    ? categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("")
    : `<option value="">No categories yet</option>`;

  // Items filter select
  $("filterCat").innerHTML =
    `<option value="">All Categories</option>` +
    categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("");

  // Category list UI
  const catList = $("catList");
  catList.innerHTML = "";

  if (!categories.length) {
    catList.innerHTML = `<div class="empty">No categories yet. Add one above.</div>`;
    return;
  }

  for (const c of categories) {
    const row = document.createElement("div");
    row.className = "catRow";
    row.innerHTML = `
      <div class="catLeft">
        <div class="catName">${escapeHtml(c.name)}</div>
        <div class="catMeta">ID: <span class="mono">${escapeHtml(c._id)}</span></div>
      </div>
      <button class="btn danger small">Delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => deleteCategory(c._id));
    catList.appendChild(row);
  }
}

async function loadItems() {
  const categoryId = $("filterCat").value;
  const q = $("searchItems").value.trim();

  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (q) params.set("q", q);

  items = await fetch(`/api/items?${params.toString()}`).then(r => r.json());
  renderItems(items);
}

function renderItems(list) {
  const wrap = $("itemsTable");

  wrap.innerHTML = `
    <div class="row head">
      <div>Icon</div>
      <div>Item Name</div>
      <div>Price (TC)</div>
      <div>Action</div>
    </div>
  `;

  if (!list.length) {
    wrap.innerHTML += `<div class="emptyTable">No items found.</div>`;
    return;
  }

  for (const it of list) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="iconCell">
        <img class="icon smallIcon" src="${it.iconDataUrl}" alt="">
      </div>
      <div>${escapeHtml(it.name)}</div>
      <div>${escapeHtml(it.price)} TC</div>
      <div>
        <button class="btn danger small">Delete</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => deleteItem(it._id));
    wrap.appendChild(row);
  }
}

async function addCategory() {
  const name = $("newCat").value.trim();
  if (!name) return;

  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || "Failed to add category.");
    return;
  }

  $("newCat").value = "";
  await loadCategories();
  await loadItems();
}

async function deleteCategory(id) {
  if (!confirm("Delete this category? (Must be empty)")) return;

  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    alert(data.error || "Failed to delete category.");
    return;
  }

  await loadCategories();
  await loadItems();
}

async function addItem() {
  $("itemMsg").textContent = "";

  const categoryId = $("catSelect").value;
  const name = $("itemName").value.trim();
  const price = $("itemPrice").value.trim();
  const iconFile = $("itemIcon").files[0];

  if (!categoryId || !name || !price || !iconFile) {
    $("itemMsg").textContent = "Fill category, name, price, and upload an icon.";
    return;
  }

  const fd = new FormData();
  fd.append("categoryId", categoryId);
  fd.append("name", name);
  fd.append("price", price);
  fd.append("icon", iconFile);

  const res = await fetch("/api/items", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    $("itemMsg").textContent = data.error || "Failed to add item.";
    return;
  }

  $("itemName").value = "";
  $("itemPrice").value = "";
  $("itemIcon").value = "";

  $("itemMsg").textContent = "Item added ✅";
  await loadItems();
}

async function deleteItem(id) {
  if (!confirm("Delete this item?")) return;
  await fetch(`/api/items/${id}`, { method: "DELETE" });
  await loadItems();
}

async function bootAdmin() {
  // show admin panel
  $("loginCard").classList.add("hidden");
  $("adminCard").classList.remove("hidden");
  $("logoutBtn").classList.remove("hidden");

  await loadCategories();
  await loadItems();

  $("addCatBtn").addEventListener("click", addCategory);
  $("addItemBtn").addEventListener("click", addItem);
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", async () => {
    await loadCategories();
    await loadItems();
  });

  $("filterCat").addEventListener("change", loadItems);
  $("searchItems").addEventListener("input", debounce(loadItems, 200));
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

window.addEventListener("DOMContentLoaded", async () => {
  $("loginBtn").addEventListener("click", login);

  // Enter key support on login
  $("pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  if (await isAdmin()) {
    await bootAdmin();
  }
});
