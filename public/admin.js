<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin Panel</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>

  <!-- Sticky top admin bar -->
  <header class="adminTop">
    <div class="adminTopInner">
      <div class="adminBrand">
        <div class="dot"></div>
        <div>
          <div class="adminTitle">Admin Panel</div>
          <div class="adminSub">Manage Categories & Items</div>
        </div>
      </div>

      <div class="adminActions">
        <a class="btn ghost" href="/">View Pricelist</a>
        <button id="logoutBtn" class="btn danger hidden">Logout</button>
      </div>
    </div>
  </header>

  <main class="wrap adminWrap">

    <!-- LOGIN -->
    <section class="card" id="loginCard">
      <h2 class="sectionTitle">Login</h2>
      <p class="muted">Only admins can access this panel.</p>

      <div class="formGrid">
        <label class="field">
          <span>Username</span>
          <input id="user" class="input" placeholder="Enter username" autocomplete="username" />
        </label>

        <label class="field">
          <span>Password</span>
          <input id="pass" class="input" placeholder="Enter password" type="password" autocomplete="current-password" />
        </label>
      </div>

      <div class="rowButtons">
        <button id="loginBtn" class="btn">Login</button>
        <div class="msg" id="loginMsg"></div>
      </div>
    </section>

    <!-- ADMIN -->
    <section class="adminGrid hidden" id="adminCard">

      <!-- LEFT COLUMN -->
      <section class="card">
        <div class="cardHead">
          <h2 class="sectionTitle">Categories</h2>
          <p class="muted">Create categories and organize items.</p>
        </div>

        <div class="inlineForm">
          <input id="newCat" class="input" placeholder="New category name..." />
          <button id="addCatBtn" class="btn">Add</button>
        </div>

        <div id="catList" class="list"></div>

        <div class="hint">
          Note: You can only delete a category if it has no items.
        </div>
      </section>

      <!-- RIGHT COLUMN -->
      <section class="card">
        <div class="cardHead">
          <h2 class="sectionTitle">Add Item</h2>
          <p class="muted">Upload icon + set name/price + select category.</p>
        </div>

        <div class="formGrid">
          <label class="field">
            <span>Category</span>
            <select id="catSelect" class="input"></select>
          </label>

          <label class="field">
            <span>Item Name</span>
            <input id="itemName" class="input" placeholder="e.g. Pacman Hair" />
          </label>

          <label class="field">
            <span>Price</span>
            <input id="itemPrice" class="input" placeholder="e.g. 60,000-100,000" />
          </label>

          <label class="field">
            <span>Icon</span>
            <input id="itemIcon" class="input" type="file" accept="image/*" />
          </label>
        </div>

        <div class="rowButtons">
          <button id="addItemBtn" class="btn">Add Item</button>
          <div class="msg" id="itemMsg"></div>
        </div>
      </section>

      <!-- FULL WIDTH -->
      <section class="card adminWide">
        <div class="cardHead">
          <h2 class="sectionTitle">Items</h2>
          <p class="muted">Filter and delete items fast.</p>
        </div>

        <div class="toolbar">
          <select id="filterCat" class="input"></select>
          <input id="searchItems" class="input" placeholder="Search items..." />
          <button id="refreshBtn" class="btn ghost">Refresh</button>
        </div>

        <div id="itemsTable" class="table mini"></div>
      </section>

    </section>
  </main>

  <script src="./admin.js"></script>
</body>
</html>
