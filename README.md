# GardenAtlas

An offline-first Progressive Web App for garden management. Track plants, log care events, forecast spray schedules, and visualize your garden layout - all stored locally, no account needed.

**Live app**: [HAtt1la.github.io/gardenatlas](https://hatt1la.github.io/gardenatlas/)

---

## Features

- **Garden map** - SVG top-down view of all sections; tap a plant card to open its detail
- **Unified sections** - add any number of sections, each fully configurable (name, columns, rows, color, wire lines)
- **Plant labels (sorszám)** - each plant has an editable label for physical garden markers; searchable
- **Plant health** - rule-based health score (good / fair / poor / bad) derived from care profiles and event history; shown as a colored status dot on each card
- **Care profiles** - named rule sets (e.g. "Apple tree") with seasonal and event-triggered care rules; assign one profile per plant
- **Event timeline** - log flowering, spraying, pruning, harvesting, planting, sickness per plant; events are editable
- **Bulk events** - add an event to many plants at once (e.g. spray the whole garden)
- **Photos** - up to 3 compressed photos per plant stored in IndexedDB; photo replaces color fallback on card
- **Todo list** - task tracker with dependency chains
- **Export / import** - full JSON backup; auto-backup reminder
- **Update prompt** - notified when a new version is available; choose when to apply it
- **Offline** - service worker caches the app shell; works without internet after first load
- **PWA** - installable on Android / iOS home screen
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
  App.svelte                  # app shell, routing, update detection
  lib/
    db.js                     # Dexie/IndexedDB - all CRUD, migrations, care profile seed
    health.js                 # health engine - derives status from care rules + events
    stores.js                 # Svelte reactive stores
    i18n.js                   # EN/HU translations
    sampleData.js             # seed data for first launch
  components/
    GardenMap.svelte          # SVG map, inlined section + plant card renderer
    SectionSheet.svelte       # bottom sheet: section config + add plant
    AddPlantInline.svelte     # convert-placeholder form
    PlantDetail.svelte        # plant detail view (events, photos, health, edit)
    EventForm.svelte          # single-plant event form (add + edit)
    MultiEventForm.svelte     # bulk event form
    CareProfiles.svelte       # care profile + rule CRUD page
    Settings.svelte           # settings, export/import, section management
    SearchBar.svelte          # plant search (name + label)
    TodoList.svelte           # todo tracker
    Toast.svelte              # toast notifications
    BackupBanner.svelte       # backup reminder banner
    UpdateBanner.svelte       # PWA update prompt banner
    PhotoGallery.svelte       # photo management UI
public/
  sw.js                       # service worker
  manifest.json               # PWA manifest
  icon.svg / icon-192.png / icon-512.png
docs/
  architecture.md             # system architecture reference
  contributor/
    technical-guide.md        # codebase internals for contributors
  user/
    user-guide.md             # end-user documentation
```

---

## Documentation

| Document | Audience |
|----------|----------|
| [Architecture](docs/architecture.md) | Overview of system design |
| [Technical Guide](docs/contributor/technical-guide.md) | Contributors - codebase internals |
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

## Database Schema (v2)

| Table | Key fields |
|-------|------------|
| `plants` | `id`, `name`, `type`, `sectionId`, `color`, `label`, `profileId` |
| `events` | `id`, `plantId`, `eventType`, `date`, `modifiedAt`, `source` |
| `settings` | `key` (key-value store) |
| `photos` | `id`, `plantId`, `isMain` (blob) |
| `todos` | `id`, `createdAt`, `doneAt` |
| `careProfiles` | `id`, `name`, `description`, `isBuiltin` |
| `careRules` | `id`, `profileId`, `trigger`, `triggerMonths`, `action`, `product`, `purpose`, `windowDays` |

Plant `type` values: `grape`, `fruit`, `raspberry`, `bed`, `other`, `placeholder`.

---

## Versioning

Follows semver. Current version: **1.3.0**

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
