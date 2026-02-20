const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   🔥 YOU EDIT ITEMS HERE ONLY
   =============================== */

const ITEMS = [
  { icon: "/icons/pacman-pack.png", name: "Pacman Pack", price: "300,000-400,000" },
  { icon: "/icons/pacman-hair.png", name: "Pacman Hair", price: "60,000-100,000" },
  { icon: "/icons/pacman-eyes.png", name: "Pacman Eyes", price: "60,000-100,000" },
  { icon: "/icons/pacman-cloak.png", name: "Pacman Cloak", price: "60,000-100,000" }
];

/* =============================== */

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/items", (req, res) => {
  res.json(ITEMS);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});