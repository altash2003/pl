const $ = (id) => document.getElementById(id);

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
    // Mark as enhanced
    select.setAttribute("data-custom-select", "1");

    // If already built, refresh options only
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

    // Insert wrap after select
    select.parentNode.insertBefore(wrap, select.nextSibling);

    function setLabelFromValue() {
      const opt = select.options[select.selectedIndex];
      const label = opt ? opt.textContent : "";
      btn.querySelector(".cselectLabel").textContent = label;
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
          // trigger native change for your existing listeners
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

    // Initial render
    setLabelFromValue();
    renderOptions();

    map.set(select, { wrap, btn, menu, setLabelFromValue, renderOptions });
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

/* ================= Viewer logic ================= */

let categories = [];
let items = [];

async function loadCategories() {
  categories = await fetch("/api/categories").then(r => r.json());

  const sel = $("category");
  sel.innerHTML =
    `<option value="">All Categories</option>` +
    categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join("");

  // ✅ build/refresh centered dropdown
  CustomSelect.build(sel);
  CustomSelect.refresh(sel);
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
