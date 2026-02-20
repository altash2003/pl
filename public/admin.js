const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= CUSTOM SELECT (perfect centered dropdown) ================= */
const CustomSelect = (() => {
  const map = new WeakMap();

  function closeAll(exceptEl) {
    document.querySelectorAll(".cselect.open").forEach(el => {
      if (el !== exceptEl) el.classList.remove("open");
    });
  }

  function build(select) {
    if (!select) return;
    select.setAttribute("data-custom-select", "1");

    const existing = map.get(select);
    if (existing) {
      refresh(select);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "cselect";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cselectButton";
    btn.innerHTML = `<span class="cselectLabel"></span><span class="cselectArrow"></span>`;

    const menu = document.createElement("div");
    menu.className = "cselectMenu";

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    select.parentNode.insertBefore(wrap, select.nextSibling);

    function setLabelFromValue() {
      const opt = select.options[select.selectedIndex];
      btn.querySelector(".cselectLabel").textContent = opt ? opt.textContent : "";
    }

    function renderOptions() {
      menu.innerHTML = "";
      Array.from(select.options).forEach((opt) => {
        const div = document.createElement("div");
        div.className = "cselectOption";
        div.textContent = opt.textContent;
        if (opt.value === select.value) div.classList.add("active");

        div.addEventListener("click", () => {
          select.value = opt.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          setLabelFromValue();
          renderOptions();
          wrap.classList.remove("open");
        });

        menu.appendChild(div);
      });
    }

    btn.addEventListener("click", () => {
      const willOpen = !wrap.classList.contains("open");
      closeAll(wrap);
      wrap.classList.toggle("open", willOpen);
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove("open");
    });

    setLabelFromValue();
    renderOptions();

    map.set(select, { wrap, setLabelFromValue, renderOptions });
  }

  function refresh(select) {
    const obj = map.get(select);
    if (!obj) {
      build(select);
      return;
    }
    obj.setLabelFromValue();
    obj.renderOptions();
  }

  return { build, refresh };
})();

/* Toasts */
function toast(message, type = "good") {
  const host = $("toastHost");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  host.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0.0";
    el.style.transform = "translateY(4px)";
    setTimeout(() => el.remove(), 220);
  }, 2200);
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
    toast(data.error || "Login failed.", "bad");
    return;
  }

  toast("Logged in ✅", "good");
  await bootAdmin();
}

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  toast("Logged out.", "good");
  setTimeout(() => location.reload(), 250);
}

let categories = [];
let items = [];

/* ---------- EDIT MODAL STATE ---------- */
let editingItemId = null;

function openEditModal(item) {
  editingItemId = item._id;

  $("editCategory").innerHTML = categories.map(c =>
    `<option value="${c._id}">${escapeHtml(c.name)}</option>`
  ).join("");

  $("editCategory").value = item.categoryId;
  $("editName").value = item.name || "";
  $("editPrice").value = item.price || "";
  $("editIcon").value = "";
  $("editFileName").textContent = "No file";
  $("editMsg").textContent = "";

  // ✅ custom dropdown refresh
  CustomSelect.build($("editCategory"));
  CustomSelect.refresh($("editCategory"));

  $("editModal").classList.remove("hidden");
  $("editModal").setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  $("editModal").classList.add("hidden");
  $("editModal").setAttribute("aria-hidden", "true");
  editingItemId = null;
}

async function loadCategories() {
  categories = await fetch("/api/categories").then(r => r.json());

  $("catSelect").innerHTML = categories.length
    ? categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("")
    : `<option value="">No categories</option>`;

  $("filterCat").innerHTML =
    `<option value="">All Categories</option>` +
    categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("");

  // ✅ build/refresh custom dropdowns
  ["catSelect","filterCat"].forEach(id => {
    const sel = $(id);
    CustomSelect.build(sel);
    CustomSelect.refresh(sel);
  });

  const catList = $("catList");
  catList.innerHTML = "";

  if (!categories.length) {
    catList.innerHTML = `<div class="empty">No categories.</div>`;
    return;
  }

  for (const c of categories) {
    const row = document.createElement("div");
    row.className = "catRow";
    row.innerHTML = `
      <div>
        <div class="catName">${escapeHtml(c.name)}</div>
        <div class="catMeta">ID: <span class="mono">${escapeHtml(c._id)}</span></div>
      </div>
      <button class="btn danger small">Delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => deleteCategory(c._id, c.name));
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
      <div>Price</div>
      <div>Actions</div>
    </div>
  `;

  if (!list.length) {
    wrap.innerHTML += `<div class="emptyTable">No items.</div>`;
    return;
  }

  for (const it of list) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="iconCell">
        <img class="icon smallIcon" src="${it.iconDataUrl}" alt="">
      </div>
      <div class="cellName">${escapeHtml(it.name)}</div>
      <div class="cellPrice">${escapeHtml(it.price)}</div>
      <div class="actionCell">
        <button class="btn ghost small editBtn">Edit</button>
        <button class="btn danger small delBtn">Delete</button>
      </div>
    `;
    row.querySelector(".editBtn").addEventListener("click", () => openEditModal(it));
    row.querySelector(".delBtn").addEventListener("click", () => deleteItem(it._id, it.name));
    wrap.appendChild(row);
  }
}

async function addCategory() {
  const name = $("newCat").value.trim();
  if (!name) return toast("Enter category name.", "bad");

  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return toast(data.error || "Failed.", "bad");
  }

  $("newCat").value = "";
  toast("Category added ✅", "good");
  await loadCategories();
  await loadItems();
}

async function deleteCategory(id, name) {
  const ok = confirm(`Delete category "${name}"?`);
  if (!ok) return;

  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) return toast(data.error || "Failed.", "bad");

  toast("Category deleted ✅", "good");
  await loadCategories();
  await loadItems();
}

async function addItem() {
  const categoryId = $("catSelect").value;
  const name = $("itemName").value.trim();
  const price = $("itemPrice").value.trim();
  const iconFile = $("itemIcon").files[0];

  if (!categoryId || !name || !price || !iconFile) {
    return toast("Fill name, price, icon.", "bad");
  }

  const fd = new FormData();
  fd.append("categoryId", categoryId);
  fd.append("name", name);
  fd.append("price", price);
  fd.append("icon", iconFile);

  const res = await fetch("/api/items", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return toast(data.error || "Failed.", "bad");

  $("itemName").value = "";
  $("itemPrice").value = "";
  $("itemIcon").value = "";
  $("fileName").textContent = "No file";

  toast("Item added ✅", "good");
  await loadItems();
}

async function saveEdit() {
  $("editMsg").textContent = "";
  if (!editingItemId) return;

  const categoryId = $("editCategory").value;
  const name = $("editName").value.trim();
  const price = $("editPrice").value.trim();
  const iconFile = $("editIcon").files[0];

  if (!categoryId || !name || !price) {
    toast("Fill name and price.", "bad");
    return;
  }

  const fd = new FormData();
  fd.append("categoryId", categoryId);
  fd.append("name", name);
  fd.append("price", price);
  if (iconFile) fd.append("icon", iconFile);

  const res = await fetch(`/api/items/${editingItemId}`, {
    method: "PUT",
    body: fd
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(data.error || "Update failed.", "bad");
    return;
  }

  toast("Item updated ✅", "good");
  closeEditModal();
  await loadItems();
}

async function deleteItem(id, name) {
  const ok = confirm(`Delete "${name}"?`);
  if (!ok) return;

  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) return toast("Failed.", "bad");

  toast("Item deleted ✅", "good");
  await loadItems();
}

async function bootAdmin() {
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
    toast("Refreshed ✅", "good");
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
  $("pass").addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });

  // File label update (add item)
  $("itemIcon")?.addEventListener("change", () => {
    $("fileName").textContent = $("itemIcon").files?.[0]?.name || "No file";
  });

  // Edit modal file label update
  $("editIcon")?.addEventListener("change", () => {
    $("editFileName").textContent = $("editIcon").files?.[0]?.name || "No file";
  });

  // Modal controls
  $("editCloseBtn")?.addEventListener("click", closeEditModal);
  $("editBackdrop")?.addEventListener("click", closeEditModal);
  $("saveEditBtn")?.addEventListener("click", saveEdit);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("editModal").classList.contains("hidden")) closeEditModal();
  });

  if (await isAdmin()) await bootAdmin();
});
