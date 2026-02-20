const express = require("express");
const path = require("path");
const session = require("express-session");
const mongoose = require("mongoose");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

const {
  MONGODB_URI,
  SESSION_SECRET,
  ADMIN_USER,
  ADMIN_PASS
} = process.env;

if (!MONGODB_URI) console.warn("⚠️ Missing MONGODB_URI env var");
if (!SESSION_SECRET) console.warn("⚠️ Missing SESSION_SECRET env var");
if (!ADMIN_USER || !ADMIN_PASS) console.warn("⚠️ Missing ADMIN_USER / ADMIN_PASS env vars");

// --- DB ---
mongoose.connect(MONGODB_URI, { dbName: "pricelist" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err.message));

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
  // store icon as base64 data URL (simple upload, no external storage)
  iconDataUrl: { type: String, required: true }
}, { timestamps: true });

const Category = mongoose.model("Category", CategorySchema);
const Item = mongoose.model("Item", ItemSchema);

// --- App middleware ---
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET || "dev_secret_change_me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true }
}));

app.use(express.static(path.join(__dirname, "public")));

// --- Upload (memory) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB
});

// --- Auth helpers ---
function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// --- Auth routes ---
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Incorrect username or password." });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/me", (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin });
});

// --- Public read-only endpoints ---
app.get("/api/categories", async (req, res) => {
  const cats = await Category.find().sort({ name: 1 });
  res.json(cats);
});

app.get("/api/items", async (req, res) => {
  const { categoryId, q } = req.query;

  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (q) filter.name = { $regex: String(q), $options: "i" };

  const items = await Item.find(filter).sort({ name: 1 });
  res.json(items);
});

// --- Admin endpoints (CRUD) ---
app.post("/api/categories", requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Category name required" });

  try {
    const cat = await Category.create({ name });
    res.json(cat);
  } catch (e) {
    return res.status(400).json({ error: "Category already exists or invalid." });
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  const itemCount = await Item.countDocuments({ categoryId: id });
  if (itemCount > 0) {
    return res.status(400).json({ error: "Category has items. Delete items first." });
  }
  await Category.findByIdAndDelete(id);
  res.json({ ok: true });
});

app.post("/api/items", requireAdmin, upload.single("icon"), async (req, res) => {
  const { categoryId, name, price } = req.body;

  if (!categoryId || !name || !price) {
    return res.status(400).json({ error: "categoryId, name, price required" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Icon file required" });
  }

  const mime = req.file.mimetype || "image/png";
  if (!mime.startsWith("image/")) {
    return res.status(400).json({ error: "Icon must be an image" });
  }

  const base64 = req.file.buffer.toString("base64");
  const iconDataUrl = `data:${mime};base64,${base64}`;

  const item = await Item.create({
    categoryId,
    name: String(name).trim(),
    price: String(price).trim(),
    iconDataUrl
  });

  res.json(item);
});

app.delete("/api/items/:id", requireAdmin, async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log("✅ Server running on", PORT));
