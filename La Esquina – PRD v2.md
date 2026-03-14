

---

## **1\. Project Overview**

La Esquina Gastrobar needs a **mobile‑first online menu** that feels elegant and “alive,” but is also lightweight and reliable on slow or unstable connections. The app will run in a mobile browser and show four main screens (Home, Categories, Items, Description) with a distinctive flip transition between them

Primary goals:

* Help guests explore the full menu visually and emotionally (photos \+ poetic descriptions \+ prices).  
* Keep navigation simple: tap and scroll only, with no typing.

---

## **2\. Target Platforms and Constraints**

* Platform: Mobile browsers primarily.   
* Network: Must degrade gracefully on slow or unstable networks; assets should be optimized and limited in size.  
* Technology stack:  
  * HTML \+ CSS \+ JavaScript.

---

## **3\. Information Architecture**

## **3.1 Screens**

1. **Home Screen**  
   * Visual elements:  
     * Background 2 (dark textured background image).  
     * Thin golden frame around the safe area.  
     * Radial gradient from center to edges (bright center, darker corners).  
     * Top text: “Descubre nuestro menú”.  
     * Center: restaurant logo placed in the “black shape” of Background 2\.  
     * Bottom‑right: “Impuestos no incluidos” in low opacity.  
   * Behavior:  
     * “Descubre nuestro menú” slowly gains and loses opacity (pulsing).  
     * When user taps anywhere on the screen:  
       * Text opacity animates to 0 and stays at 0\.  
       * Navigation to Categories Screen starts.  
       * Further taps are **locked** until the next screen is fully visible.  
2. **Categories Screen**  
   * Visual elements:  
     * Background 1 (diagonal lines pattern).  
     * Navigation bar at top, low opacity:  
       * Left: back arrow (to previous screen).  
       * Center: stacked text “La Esquina” / “Gastrobar”.  
       * Right: home icon (returns to Home Screen).  
     * Grid/page of 6 category “cards” using Background 2 style with category name inside a black shape.  
   * Behavior:  
     * Vertical scroll with **snap** between pages of categories (no half cards).  
     * Tap on a category card → go to Items Screen for that section.  
     * When navigation begins:  
       * Nav bar opacity fades to 0 as loading feedback.  
       * Taps are locked until Items screen has fully appeared.  
     * Back arrow returns to the previous screen; home icon always returns to Home.  
3. **Items Screen**  
   * Visual elements:​  
     * Solid black background.  
     * Same navigation bar style.  
     * For the current item:  
       * Large picture of the dish.  
       * Item name.  
       * Text “Tocar para ver detalles” in medium opacity.  
   * Behavior:  
     * Vertical scroll with snap between items; only one item fully visible at a time.  
     * Tap anywhere on the item area → go to Description Screen for that item.  
4. **Description Screen**  
   * Visual elements:  
     * Background 1  
     * Navigation bar.  
     * Category name.  
     * Item name.  
     * Full description text.  
     * Price aligned to the right (using currency DOP).  
   * Behavior:  
     * All information appears on one screen.  
5. **Flip Transition Screen** (global animation)  
   * Used whenever navigating between any two main screens (Home, Categories, Items, Description).  
   * Visual:  
     * Home Screen layout without “Descubre nuestro menú” and “Impuestos no incluidos” text.  
     * Performs a **360° rotation** (flip) animation.  
   * Animation spec:  
     * Total duration: 1500 ms.  
     * Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` (smooth, weighty feel).  
     * Rotation: always \+360 degrees.  
     * Midpoint at 750 ms:  
       * Hide starting screen image.  
       * Briefly show home screen image with no text  
       * Then show target screen image.  
     * Input lock: all taps disabled for full 1500 ms to avoid glitches and double navigation.

---

## **4\. Content Model**

## **4.1 Sections and Items**

* Sections correspond to restaurant groups such as:  
  Entradas, Embutidos, Al Grill, Cortes Angus Importados, Hamburguesas, Pastas, Mofongos, Ensaladas / Wraps & Más, Guarniciones, Caldos & Cremas, Postres.  
* Each section contains items with:  
  * Name.  
  * Descriptive text (the “poetic” descriptions already written).  
  * Price in DOP (or special handling when price is missing, like “Especial del día”).  
  * Image path.

---

## **5\. Interaction and State Rules**

* Navigation always goes through the flip transition; there is no instant jump between main screens.  
* While a transition is running (1500 ms), user input is ignored.  
* Scroll containers for Categories and Items use CSS scroll snapping so cards always land fully visible.  
* If any item has no price, UI should show the alternative “Consultar”)

---

## **6\. Performance and Assets**

* Food images:  
  * Stored as WEBP, optimized (around a few dozen KB each where possible).  
  * Paths referenced in JSON `image.src`.  
* UI graphics (logo, frames, backgrounds):  
  * PNG or SVG allowed; should still be optimized for mobile.  
* All assets hosted on the same domain as HTML/JS to avoid CORS issues.

---

## **7\. Out of Scope (Not Included)**

The following features and design ideas are explicitly out of scope for this version of the La Esquina online menu:​

* No online ordering, shopping cart, or payment processing.  
* No user accounts, logins, or personal data storage.  
* No table‑side ordering or waiter notification system.  
* No multi‑language switching (only Spanish for now).  
* No complex admin panel; menu updates will be done by editing JSON/files manually.  
* No social media integrations, reviews, or rating system.  
* No analytics dashboard beyond what the hosting provider or basic tools provide.

