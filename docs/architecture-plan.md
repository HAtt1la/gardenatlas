# 🌱 Offline PWA Garden App – Architecture Plan

## 1. Overview

A fully offline Progressive Web App (PWA) that runs in an Android browser (Chrome/Brave). The app can be installed to the home screen and used without internet access.

* Offline-first design
* Local data storage
* Optional sync when PC/server is available
* Designed for garden plant cataloging and visualization

---

## 2. Core Goals

* Visualize the garden from a top-down view
* Represent physical layout:
  * very bottom: mixed plants
  * Bottom: 4 grape rows (~5 grapevines per row)
  * Middle: 3 raised beds with mixed plants
  * Top: 3 rows of fruit trees, and 5 trees in a row
* Each plant has a visible label (name + ID)
* Click/tap a plant to view and edit details
* Search plants directly by ID
* Store historical events and calculate forecasts (e.g. next spray date)

---

## 3. Main Screens

### 3.1 Garden Map View

* SVG or Canvas-based top-down garden layout
* Clickable plant markers
* Optional color indicators (e.g. needs spray soon)
* Inline add plant form (no page navigation)
* Button to open multi-plant event adder (📋 icon)

### 3.2 Plant Detail View

* Plant name, ID, type
* Timeline of events:

  * flowering
  * sprayed
  * crop
  * planted
  * pruned
  * harvested
* Add new event to single plant with date picker
* Forecast information (next spray, expected crop)

### 3.3 Multi-Plant Event Adder

* Select event type (spray, prune, plant, flower, harvest, crop)
* Choose date and optional notes
* Search and select multiple plants at once
* Quick actions: "Select All" / "Clear Selection"
* Bulk add event to all selected plants
* Perfect for garden-wide operations (e.g., spray all plants)

### 3.4 ID Search

* Input field to jump directly to a plant by ID

### 3.5 Settings / Data Management

* Export data (JSON or SQLite)
* Import data (restore backup)
* Configure forecast rules (spray intervals, etc.)

---

## 4. Data Architecture

### 4.1 Plant Entity

* id (numeric, matches physical label)
* name
* type (grape, bed, fruit)
* row / bed index
* x, y coordinates (for map positioning)
* notes

### 4.2 Event Entity

* plant_id (reference to plant)
* event_type (flowering, spray, crop, planted)
* date
* notes
* modified_at timestamp

### 4.3 Storage

* IndexedDB (default)
* Optional: SQLite via SQL.js (WebAssembly)

---

## 5. Forecast Logic

* Rule-based calculation using last known events
* Example:

  * next_spray = last_spray_date + spray_interval_days
* Rules configurable per plant type

---

## 6. Offline Support

### 6.1 Service Worker

* Cache app shell (HTML, JS, CSS, icons)
* Enable offline startup and usage

### 6.2 Local Persistence

* All plant and event data stored locally
* Works fully offline (garden usage)

---

## 7. Sync Strategy (Optional)

* Export data file on phone
* Import file on PC

---

## 8. Technology Choices

### Recommended Stack

* Frontend: Svelte or Vanilla JS
* Storage: IndexedDB or SQL.js
* UI: SVG map
* Offline: Service Worker + Web App Manifest

### Why PWA

* No Play Store needed
* Works offline
* Installable on Android
* Easy maintenance and backup

---

## 9. Future Enhancements

* Seasonal analytics

## 10. Implemented Enhancements

* ✅ Photo attachments per plant (up to 3 photos, auto-compressed, stored in IndexedDB)
* ✅ Inline plant adding (unified approach for bed plants and custom plants - no page navigation)
* ✅ Multi-plant event adder (add events to multiple plants at once)
* ✅ Global event management (spray all plants on a single date)
* ✅ Plant search and filtering in multi-event form
* ✅ Quick select/deselect actions for bulk operations
