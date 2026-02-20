const $ = (id) => document.getElementById(id);

let categories = [];
let items = [];

async function loadCategories() {
  categories = await fetch("/api/categories").then(r => r.json());

  const sel = $("category");
  sel.innerHTML =
    `<option value="">All Categories</option>` +
    categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("");
}

async function loadItems() {
  const categoryId = $("category").value;
  const q = $("search").value.trim();

  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (q) params.set("q", q);

  items = await fetch(`/api/items?${params.toString()}`).then(r => r.json());
  render(items);
}

function render(list) {
  const wrap = $("list");
  wrap.innerHTML = "";

  for (const it of list) {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <div class="iconCell">
        <img class="icon" src="${it.iconDataUrl}" alt="">
      </div>
      <div class="cellName">${escapeHtml(it.name)}</div>
      <div class="cellPrice">${escapeHtml(it.price)}</div>
    `;

    wrap.appendChild(row);
  }

  $("count").textContent = `${list.length} item(s)`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await loadItems();

  $("category").addEventListener("change", loadItems);
  $("search").addEventListener("input", debounce(loadItems, 200));
});

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
