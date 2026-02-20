const $ = (id) => document.getElementById(id);

function parsePriceToNumber(priceStr) {
  // Converts "60,000-100,000" -> average number (80000) for sorting
  // Also supports "120,000" -> 120000
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d\-]/g, ""); // keep digits and dash
  if (!cleaned) return 0;

  if (cleaned.includes("-")) {
    const [a, b] = cleaned.split("-").map((x) => Number(x) || 0);
    if (!a && !b) return 0;
    return (a + b) / 2;
  }
  return Number(cleaned) || 0;
}

function render(items) {
  const list = $("list");
  list.innerHTML = "";

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <div class="iconCell">
        <img class="icon" src="${item.icon}" alt="${item.name}" onerror="this.src='./icons/placeholder.png'">
      </div>
      <div class="nameCell">${escapeHtml(item.name)}</div>
      <div class="priceCell right">${escapeHtml(item.price)}</div>
    `;

    list.appendChild(row);
  }

  $("count").textContent = `${items.length} item(s)`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function apply() {
  const search = $("search").value.trim().toLowerCase();
  const sort = $("sort").value;

  let items = (window.ITEMS || []).slice();

  if (search) {
    items = items.filter((x) => (x.name || "").toLowerCase().includes(search));
  }

  items.sort((a, b) => {
    if (sort === "name-asc") return (a.name || "").localeCompare(b.name || "");
    if (sort === "name-desc") return (b.name || "").localeCompare(a.name || "");
    if (sort === "price-asc") return parsePriceToNumber(a.price) - parsePriceToNumber(b.price);
    if (sort === "price-desc") return parsePriceToNumber(b.price) - parsePriceToNumber(a.price);
    return 0;
  });

  render(items);
}

window.addEventListener("DOMContentLoaded", () => {
  $("search").addEventListener("input", apply);
  $("sort").addEventListener("change", apply);
  apply();
});