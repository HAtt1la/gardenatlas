# GardenAtlas

An offline-first Progressive Web App for garden management. Track plants, log care events, forecast spray schedules, and visualize your garden layout - all stored locally, no account needed.

**Live app**: [HAtt1la.github.io/gardenatlas](https://hatt1la.github.io/gardenatlas/)

---

## Features

- **Garden map** - SVG top-down view of all sections; tap a plant to open its detail
- **Modular sections** - add multiple instances of any section type (fruit trees, grapevines, raspberries, raised beds, herbs & flowers); each section is independently configurable
- **One-step plant adding** - tap the section name to open the section sheet, then add a plant directly
- **Spray forecasting** - calculates next spray date from last event; status dot on each card (green / orange / red)
- **Event timeline** - log flowering, spraying, pruning, fertilizing, harvesting, planting per plant
- **Bulk events** - add an event to many plants at once (e.g. spray the whole garden)
- **Photos** - up to 3 compressed photos per plant stored in IndexedDB
- **Todo list** - task tracker with priority scoring and dependency chains
- **Export / import** - full JSON backup; auto-backup reminder after 30 days
- **Offline** - service worker caches the app shell; works without internet after first load
- **PWA** - installable on Android home screen
- **English / Hungarian** - language switch in Settings

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
npm run lint       # ESLint
```

### Test on mobile

```bash
npm run dev -- --host
# open http://<your-local-ip>:5173 in the mobile browser
```

---

## Project Structure

```
src/
  main.js                     # entry point, SW registration
  App.svelte                  # app shell, routing
  lib/
    db.js                     # Dexie/IndexedDB - all CRUD, migrations, forecasts
    stores.js                 # Svelte reactive stores
    i18n.js                   # EN/HU translations
    sampleData.js             # seed data for first launch
  components/
    GardenMap.svelte          # SVG map, section rendering loop
    SectionSheet.svelte       # bottom sheet for section editing + plant adding
    AddPlantInline.svelte     # reusable plant-add form (convert placeholder mode)
    PlantDetail.svelte        # plant detail view
    BedDetail.svelte          # raised-bed detail with plant list
    EventForm.svelte          # single-plant event form
    MultiEventForm.svelte     # bulk event form
    Settings.svelte           # settings, export/import, section management
    SearchBar.svelte          # plant search
    TodoList.svelte           # todo tracker
    Toast.svelte              # toast notifications
  sections/                   # ← modular section system
    index.js                  # registry: imports all descriptors + renderers
    fruit/
      descriptor.js
      Renderer.svelte
    grape/
      descriptor.js
      Renderer.svelte
    raspberry/
      descriptor.js           # uses FruitRenderer (aliased in index.js)
    bed/
      descriptor.js
      Renderer.svelte
    other/
      descriptor.js           # uses FruitRenderer (aliased in index.js)
public/
  sw.js                       # service worker
  manifest.json               # PWA manifest
docs/
  architecture.md             # system architecture reference
  contributor/
    technical-guide.md        # codebase internals for contributors
    adding-sections.md        # step-by-step: add a new section type
  user/
    user-guide.md             # end-user documentation
```

---

## Documentation

| Document | Audience |
|----------|----------|
| [Architecture](docs/architecture.md) | Overview of system design |
| [Technical Guide](docs/contributor/technical-guide.md) | Contributors - codebase internals |
| [Adding Sections](docs/contributor/adding-sections.md) | Contributors - how to add a new section type |
| [User Guide](docs/user/user-guide.md) | End users - how to use the app |

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | Svelte 4 |
| Build | Vite 5 |
| Database | Dexie.js 4 (IndexedDB) |
| Offline | Service Worker + Web App Manifest |
| UI | Custom CSS, SVG map |
| i18n | Custom (localStorage persistence) |
| Deploy | GitHub Pages (`/gardenatlas/` base path) |

---

## Database Schema (v8)

| Table | Key fields |
|-------|------------|
| `plants` | `id`, `name`, `type`, `sectionId`, `emoji`, `color`, `bedId` |
| `events` | `id`, `plantId`, `eventType`, `date`, `modifiedAt` |
| `settings` | `key` (key-value store) |
| `photos` | `id`, `plantId`, `isMain` (blob) |

Schema changes always add a new `db.version(N+1)` block - never modify existing versions.

---

## Versioning

Follows semver. Current version: **1.2.0**

- **PATCH** - bug fixes, UI tweaks
- **MINOR** - new user-visible features
- **MAJOR** - significant redesigns or breaking data migrations

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome / Brave (Android & Desktop) | Full |
| Edge (Desktop) | Full |
| Safari (iOS 14+, Desktop) | Full |
| Firefox | IndexedDB works; PWA install limited |

---

## License

Personal garden management tool. Use and modify freely.
