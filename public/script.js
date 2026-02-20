let items = [];

fetch("/api/items")
  .then(res => res.json())
  .then(data => {
    items = data;
    render(items);
  });

function render(list) {
  const container = document.getElementById("items");
  container.innerHTML = "";

  list.forEach(item => {
    container.innerHTML += `
      <div class="item">
        <img src="${item.icon}">
        <div>${item.name}</div>
        <div>${item.price}</div>
      </div>
    `;
  });
}

document.getElementById("search").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(val)
  );
  render(filtered);
});

document.getElementById("sort").addEventListener("change", e => {
  let sorted = [...items];

  if (e.target.value === "name-asc")
    sorted.sort((a,b)=>a.name.localeCompare(b.name));
  if (e.target.value === "name-desc")
    sorted.sort((a,b)=>b.name.localeCompare(a.name));

  if (e.target.value === "price-asc")
    sorted.sort((a,b)=>extract(a.price)-extract(b.price));
  if (e.target.value === "price-desc")
    sorted.sort((a,b)=>extract(b.price)-extract(a.price));

  render(sorted);
});

function extract(price) {
  return Number(price.replace(/[^\d]/g,""));
}