// ============================================================
// LA ESQUINA GASTROBAR — MENU APP
// ============================================================

// ---- STATE ----
let MENU_DATA        = null;
let currentSection   = null;
let currentItemIndex = 0;
let isTransitionRunning = false;
let categoriesBuilt  = false;

// Navigation history stack for back button
const navStack = [];

// ---- UTILS ----
const qs = sel => document.querySelector(sel);

function formatPrice(amount) {
  if (amount == null || isNaN(Number(amount))) return null;
  return `RD$${Number(amount).toLocaleString("es-DO")}`;
}

// ---- DATA ----
async function loadMenuData() {
  const res  = await fetch("menu-data.json");
  MENU_DATA  = await res.json();
}

// ---- VIEW SWITCHING ----
function showView(id) {
  document.querySelectorAll(".app-view").forEach(v => {
    v.classList.toggle("active", v.id === id);
  });
}

// ---- NAV BAR ----
function setNavVisible(visible, instant) {
  const nav = qs("#global-nav");
  if (!nav) return;
  if (visible) {
    nav.classList.remove("hidden", "fading");
  } else if (instant) {
    nav.classList.add("hidden");
    nav.classList.remove("fading");
  } else {
    nav.classList.add("fading");
    setTimeout(() => nav.classList.add("hidden"), 320);
  }
}

// ---- FLIP TRANSITION ----
function navigateWithFlip(targetViewId, afterTransition) {
  if (isTransitionRunning) return;
  isTransitionRunning = true;

  setNavVisible(false);

  // Force CSS animation restart on the flip element
  const flipEl = qs("#flip-transition");
  flipEl.classList.remove("active");
  void flipEl.offsetWidth; // trigger reflow
  showView("flip-transition");

  setTimeout(() => {
    showView(targetViewId);
    isTransitionRunning = false;

    if (targetViewId === "home-screen") {
      setNavVisible(false, true);
    } else {
      setNavVisible(true);
    }

    if (typeof afterTransition === "function") afterTransition();
  }, 1500);
}

// ---- CATEGORIES SCREEN ----
function buildCategories() {
  if (categoriesBuilt) return; // build DOM only once
  categoriesBuilt = true;

  const grid = qs("#categories-grid");
  if (!grid || !MENU_DATA) return;

  grid.innerHTML = "";

  MENU_DATA.sections.forEach((section, index) => {
    // Insert a scroll-snap anchor before every group of 6 cards
    if (index % 6 === 0) {
      const snapRow = document.createElement("div");
      snapRow.className = "page-snap-row";
      grid.appendChild(snapRow);
    }

    const card = document.createElement("button");
    card.className = "category-card";
    card.type      = "button";

    // Background: real photo or CSS vignette placeholder
    if (section.categoryImage) {
      const img   = document.createElement("img");
      img.className = "cat-photo";
      img.src       = section.categoryImage;
      img.alt       = "";
      img.loading   = "lazy";
      card.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "cat-placeholder";
      card.appendChild(ph);
    }

    // Overlay for text legibility
    const overlay = document.createElement("div");
    overlay.className = "cat-overlay";
    card.appendChild(overlay);

    // Label
    const label = document.createElement("span");
    label.className   = "cat-label";
    label.textContent = section.name;
    card.appendChild(label);

    card.addEventListener("click", () => {
      if (isTransitionRunning) return;
      currentSection   = section;
      currentItemIndex = 0;
      navStack.push("items-screen");
      navigateWithFlip("items-screen", () => {
        buildItemsForSection();
        scrollToCurrentItem(true);
      });
    });

    grid.appendChild(card);
  });
}

// ---- ITEMS SCREEN ----
function buildItemsForSection() {
  const container = qs("#items-container");
  if (!container || !currentSection || !currentSection.items) return;

  container.innerHTML = "";

  currentSection.items.forEach((item, index) => {
    const view = document.createElement("div");
    view.className     = "dish-view";
    view.dataset.index = index;

    // Photo wrapper
    const imgWrapper = document.createElement("div");
    imgWrapper.className = "dish-image-wrapper";

    const img    = document.createElement("img");
    const imgSrc = typeof item.image === "string"
      ? item.image
      : (item.image && item.image.src ? item.image.src : "");
    const imgAlt = (item.image && item.image.alt) ? item.image.alt : item.name;
    img.src     = imgSrc;
    img.alt     = imgAlt;
    img.loading = "lazy";
    imgWrapper.appendChild(img);

    // Name
    const nameEl = document.createElement("div");
    nameEl.className   = "dish-name";
    nameEl.textContent = item.name;

    // Hint
    const hint = document.createElement("div");
    hint.className   = "dish-hint";
    hint.textContent = "Tocar para ver detalles \u2192";

    view.appendChild(imgWrapper);
    view.appendChild(nameEl);
    view.appendChild(hint);

    view.addEventListener("click", () => {
      if (isTransitionRunning) return;
      currentItemIndex = index;
      navStack.push("description-screen");
      navigateWithFlip("description-screen", buildDescription);
    });

    container.appendChild(view);
  });
}

function scrollToCurrentItem(instant) {
  const container = qs("#items-container");
  if (!container) return;
  const target = container.querySelector(".dish-view[data-index=\"" + currentItemIndex + "\"]");
  if (target) {
    target.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
  }
}

function attachScrollTracker() {
  const container = qs("#items-container");
  if (!container) return;
  container.addEventListener("scroll", function() {
    var h = container.clientHeight;
    if (h > 0) currentItemIndex = Math.round(container.scrollTop / h);
  }, { passive: true });
}

// ---- DESCRIPTION SCREEN ----
function buildDescription() {
  const box = qs("#description-inner");
  if (!box || !currentSection || !currentSection.items) return;

  const item = currentSection.items[currentItemIndex];
  if (!item) return;

  box.innerHTML = "";

  var cat = document.createElement("div");
  cat.className   = "desc-category";
  cat.textContent = currentSection.name;

  var nameEl = document.createElement("div");
  nameEl.className   = "desc-name";
  nameEl.textContent = item.name;

  var textEl = document.createElement("div");
  textEl.className   = "desc-text";
  textEl.textContent = item.description || "";

  box.appendChild(cat);
  box.appendChild(nameEl);
  box.appendChild(textEl);

  // Sizes variant
  if (Array.isArray(item.sizes) && item.sizes.length > 0) {
    var sizesList = document.createElement("div");
    sizesList.className = "desc-sizes";

    item.sizes.forEach(function(size) {
      var row = document.createElement("div");
      row.className = "desc-size-row";

      var lbl = document.createElement("span");
      lbl.className   = "desc-size-label";
      lbl.textContent = size.label;

      var val = document.createElement("span");
      val.textContent = formatPrice(size.price) || "Consultar";

      row.appendChild(lbl);
      row.appendChild(val);
      sizesList.appendChild(row);
    });

    box.appendChild(sizesList);

  } else {
    var priceEl   = document.createElement("div");
    var formatted = formatPrice(item.price);

    if (formatted) {
      priceEl.className   = "desc-price";
      priceEl.textContent = formatted;
    } else {
      priceEl.className   = "desc-price consultar";
      priceEl.textContent = "Consultar";
    }

    box.appendChild(priceEl);
  }
}

// ---- BACK NAVIGATION ----
function goBack() {
  if (isTransitionRunning) return;
  if (navStack.length === 0) return;

  var current = navStack[navStack.length - 1];
  navStack.pop();

  if (current === "categories-screen") {
    navigateWithFlip("home-screen");
  } else if (current === "items-screen") {
    navigateWithFlip("categories-screen");
  } else if (current === "description-screen") {
    navigateWithFlip("items-screen", function() { scrollToCurrentItem(false); });
  } else {
    navigateWithFlip("home-screen");
  }
}

// ---- INIT ----
document.addEventListener("DOMContentLoaded", async function() {
  await loadMenuData();

  // Apply CSS background classes to screens
  qs("#home-screen").classList.add("bg-2");
  qs("#flip-transition").classList.add("bg-2");
  qs("#categories-screen").classList.add("bg-1");
  qs("#description-screen").classList.add("bg-1");

  attachScrollTracker();

  var homeScreen = qs("#home-screen");
  var homeCta    = qs("#home-cta");

  // HOME → CATEGORIES
  homeScreen.addEventListener("click", function() {
    if (isTransitionRunning) return;
    if (homeCta) {
      homeCta.style.animation = "none";
      homeCta.style.opacity   = "0";
    }
    navStack.push("categories-screen");
    navigateWithFlip("categories-screen", buildCategories);
  });

  // BACK button
  qs("#nav-back").addEventListener("click", function(e) {
    e.stopPropagation();
    goBack();
  });

  // HOME icon — clear stack and go home
  qs("#nav-home").addEventListener("click", function(e) {
    e.stopPropagation();
    if (isTransitionRunning) return;
    navStack.length = 0;
    navigateWithFlip("home-screen");
  });
});
