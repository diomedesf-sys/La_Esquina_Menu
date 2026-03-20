// ============================================================
// LA ESQUINA GASTROBAR — MENU APP
// ============================================================

// ---- TUNEABLE CONSTANTS ----
var FLIP_DURATION_MS = 600;   // total CSS rotation duration (milliseconds)
                               // Try: 400 = very snappy, 600 = default, 900 = dramatic
var FLIP_SWAP_RATIO  = 0.80;  // swap screen at this fraction of the rotation
                               // 0.80 = swap at 80%, logo just returning to front
                               // 0.75 = swap slightly earlier (more overlap)
                               // 0.90 = swap later (more pause at end)
// HOW IT WORKS:
//   CSS rotates 360deg in FLIP_DURATION_MS.
//   JS swaps the screen at FLIP_DURATION_MS * FLIP_SWAP_RATIO.
//   At 0.80 ratio the logo is almost back to front when the new page appears
//   — feels like a seamless handoff with no dead pause.

// ---- STATE ----
var MENU_DATA           = null;
var currentSection      = null;
var currentItemIndex    = 0;
var isTransitionRunning = false;
var categoriesBuilt     = false;

// Navigation history stack for back button
var navStack = [];

// ---- UTILS ----
var qs = function(sel) { return document.querySelector(sel); };

function formatPrice(amount) {
  if (amount == null || isNaN(Number(amount))) return null;
  return "RD$" + Number(amount).toLocaleString("es-DO");
}

// ---- DATA ----
async function loadMenuData() {
  var res = await fetch("menu-data.json");
  MENU_DATA = await res.json();
}

// ---- VIEW SWITCHING ----
function showView(id) {
  document.querySelectorAll(".app-view").forEach(function(v) {
    v.classList.toggle("active", v.id === id);
  });
}

// ---- NAV BAR ----
function setNavVisible(visible, instant) {
  var nav = qs("#global-nav");
  if (!nav) return;
  if (visible) {
    nav.classList.remove("hidden", "fading");
  } else if (instant) {
    nav.classList.add("hidden");
    nav.classList.remove("fading");
  } else {
    nav.classList.add("fading");
    setTimeout(function() { nav.classList.add("hidden"); }, 320);
  }
}

// ---- RESET HOME CTA ----
// Called every time we navigate back to home so the pulse text reappears
// and the phrase sequence restarts from the beginning.
var CTA_PHRASES  = ["DESCUBRE NUESTRO MENÚ", "AL PULSAR LA PANTALLA"];
var ctaPhraseIdx = 0;
var ctaSwapTimer = null;

function resetHomeCta() {
  var homeCta = qs("#home-cta");
  if (!homeCta) return;

  // Clear any pending swap timer from a previous visit
  if (ctaSwapTimer) { clearTimeout(ctaSwapTimer); ctaSwapTimer = null; }

  // Reset phrase to first
  ctaPhraseIdx        = 0;
  homeCta.textContent = CTA_PHRASES[0];

  // Restart CSS animation from scratch
  homeCta.style.animation = "none";
  homeCta.style.opacity   = "";
  void homeCta.offsetWidth; // force reflow
  homeCta.style.animation = "";

  // Total CSS cycle is 17 s.
  // Phrase 1 runs 0–8 s, silence 8–9 s, phrase 2 runs 9–17 s.
  // We swap text at 8.5 s — the midpoint of the silence — then every 17 s.
  function swap() {
    var el = qs("#home-cta");
    if (!el) return;
    ctaPhraseIdx   = (ctaPhraseIdx + 1) % CTA_PHRASES.length;
    el.textContent = CTA_PHRASES[ctaPhraseIdx];
    ctaSwapTimer   = setTimeout(swap, 17000);
  }

  ctaSwapTimer = setTimeout(swap, 8500);
}

// ---- FLIP TRANSITION ----
// Tuning guide: change FLIP_DURATION_MS at line 7 above.
// The CSS animation duration is set inline here to stay in sync with JS timing.
function navigateWithFlip(targetViewId, afterTransition) {
  if (isTransitionRunning) return;
  isTransitionRunning = true;

  setNavVisible(false);

  // Show flip screen and restart its CSS animation at the new duration
  var flipEl = qs("#flip-transition");
  flipEl.classList.remove("active");
  void flipEl.offsetWidth; // reflow to restart animation
  // Override animation duration to match our JS constant
  flipEl.style.setProperty("--flip-dur", FLIP_DURATION_MS + "ms");
  showView("flip-transition");

  // Swap screen at FLIP_SWAP_RATIO of the rotation — logo nearly back to front,
  // new page appears seamlessly without a dead pause at the end
  var swapAt = Math.round(FLIP_DURATION_MS * FLIP_SWAP_RATIO);
  setTimeout(function() {
    showView(targetViewId);

    if (targetViewId === "home-screen") {
      setNavVisible(false, true);
      resetHomeCta();
    } else {
      setNavVisible(true);
    }

    if (typeof afterTransition === "function") afterTransition();
  }, swapAt);

  // Unlock input after full CSS animation completes
  setTimeout(function() {
    isTransitionRunning = false;
  }, FLIP_DURATION_MS);
}

// ---- CATEGORIES SCREEN ----
function buildCategories() {
  if (categoriesBuilt) return; // build DOM only once
  categoriesBuilt = true;

  var grid = qs("#categories-grid");
  if (!grid || !MENU_DATA) return;

  grid.innerHTML = "";

  MENU_DATA.sections.forEach(function(section) {
    var card = document.createElement("button");
    card.className = "category-card";
    card.type      = "button";

    // Background: real photo or CSS vignette placeholder
    if (section.categoryImage) {
      var img      = document.createElement("img");
      img.className = "cat-photo";
      img.src       = section.categoryImage;
      img.alt       = "";
      img.loading   = "lazy";
      card.appendChild(img);
    } else {
      var ph = document.createElement("div");
      ph.className = "cat-placeholder";
      card.appendChild(ph);
    }

    // Overlay for text legibility
    var overlay = document.createElement("div");
    overlay.className = "cat-overlay";
    card.appendChild(overlay);

    // Label
    var label = document.createElement("span");
    label.className   = "cat-label";
    label.textContent = section.name;
    card.appendChild(label);

    card.addEventListener("click", function() {
      if (isTransitionRunning) return;
      currentSection   = section;
      currentItemIndex = 0;
      navStack.push("items-screen");
      navigateWithFlip("items-screen", function() {
        buildItemsForSection();
        scrollToCurrentItem(true);
      });
    });

    grid.appendChild(card);
  });
}

// ---- ITEMS SCREEN ----
function buildItemsForSection() {
  var container = qs("#items-container");
  if (!container || !currentSection || !currentSection.items) return;

  container.innerHTML = "";

  currentSection.items.forEach(function(item, index) {
    var view = document.createElement("div");
    view.className     = "dish-view";
    view.dataset.index = index;

    // Photo wrapper
    var imgWrapper = document.createElement("div");
    imgWrapper.className = "dish-image-wrapper";

    var img    = document.createElement("img");
    var imgSrc = typeof item.image === "string"
      ? item.image
      : (item.image && item.image.src ? item.image.src : "");
    var imgAlt = (item.image && item.image.alt) ? item.image.alt : item.name;
    img.src     = imgSrc;
    img.alt     = imgAlt;
    img.loading = "lazy";
    imgWrapper.appendChild(img);

    // Name
    var nameEl = document.createElement("div");
    nameEl.className   = "dish-name";
    nameEl.textContent = item.name;

    // Hint
    var hint = document.createElement("div");
    hint.className   = "dish-hint";
    hint.textContent = "Tocar para ver detalles \u2192";

    view.appendChild(imgWrapper);
    view.appendChild(nameEl);
    view.appendChild(hint);

    view.addEventListener("click", function() {
      if (isTransitionRunning) return;
      currentItemIndex = index;
      navStack.push("description-screen");
      navigateWithFlip("description-screen", buildDescription);
    });

    container.appendChild(view);
  });
}

function scrollToCurrentItem(instant) {
  var container = qs("#items-container");
  if (!container) return;
  var target = container.querySelector(".dish-view[data-index=\"" + currentItemIndex + "\"]");
  if (target) {
    target.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
  }
}

function attachScrollTracker() {
  var container = qs("#items-container");
  if (!container) return;
  container.addEventListener("scroll", function() {
    var h = container.clientHeight;
    if (h > 0) currentItemIndex = Math.round(container.scrollTop / h);
  }, { passive: true });
}

// ---- DESCRIPTION SCREEN ----
function buildDescription() {
  var box = qs("#description-inner");
  if (!box || !currentSection || !currentSection.items) return;

  var item = currentSection.items[currentItemIndex];
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

  // Sizes variant (e.g. Parrillada Mixta)
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

  // Apply CSS background classes
  qs("#home-screen").classList.add("bg-2");
  qs("#flip-transition").classList.add("bg-2");
  qs("#categories-screen").classList.add("bg-1");
  qs("#description-screen").classList.add("bg-1");

  attachScrollTracker();

  // Start the CTA phrase cycle on first load
  resetHomeCta();

  var homeScreen = qs("#home-screen");

  // HOME tap → categories
  homeScreen.addEventListener("click", function() {
    if (isTransitionRunning) return;
    // Stop swap timer and hide CTA before leaving home
    if (ctaSwapTimer) { clearTimeout(ctaSwapTimer); ctaSwapTimer = null; }
    var homeCta = qs("#home-cta");
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
