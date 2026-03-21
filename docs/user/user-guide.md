# GardenAtlas User Guide

GardenAtlas is an app for tracking the plants in your garden. You can record care events, see when plants need spraying, add photos, and keep a todo list — all stored on your device with no account needed.

---

## Contents

1. [Getting the app](#1-getting-the-app)
2. [The garden map](#2-the-garden-map)
3. [Managing sections](#3-managing-sections)
4. [Adding plants](#4-adding-plants)
5. [Plant detail](#5-plant-detail)
6. [Recording events](#6-recording-events)
7. [Bulk events](#7-bulk-events)
8. [Spray forecasting](#8-spray-forecasting)
9. [Photos](#9-photos)
10. [Todo list](#10-todo-list)
11. [Search](#11-search)
12. [Settings](#12-settings)
13. [Backing up your data](#13-backing-up-your-data)
14. [App updates](#14-app-updates)
15. [Language](#15-language)

---

## 1. Getting the app

### Install on Android (recommended)

1. Open Chrome or Brave on your phone
2. Navigate to the app URL
3. Tap the browser menu (⋮) → **Add to Home Screen** or **Install App**
4. Confirm — the app icon appears on your home screen
5. Open from there to use it in full-screen mode, completely offline

### Use in browser

The app works in any modern browser (Chrome, Firefox, Safari, Edge) without installation.

---

## 2. The garden map

The map is the main screen. It shows all your garden sections stacked vertically. Each plant appears as a card with:

- **Name** — shown at the bottom of the card
- **Photo** — if you have added one, it fills the card background
- **Card color** — a colored background tint when there is no photo
- **Status dot** (top-right corner of the card):
  - 🟢 Green — spray is up to date
  - 🟠 Orange — due soon (within 3 days)
  - 🔴 Red — overdue
  - ⚪ Grey — no spray event recorded yet

Tap any plant card to open its detail view.

---

## 3. Managing sections

Sections are the containers that organize your plants on the map. You can add as many sections as you like and configure each one independently.

### Open section settings

**Tap the section name** (the label at the top of each section). A panel slides up from the bottom.

### What you can change

- **Section name** — edit the label shown on the map
- **Columns** — how many cards per row (use the − / + stepper)
- **Rows** — set a fixed row count; use 1 for an unbounded single row
- **Color** — the background tint of the section and plant cards
- **Show row wires** — draws horizontal lines between rows (useful for trellis layouts like grapevines)

Tap **Save** to apply changes.

### Add a new section

1. Go to **Settings** (gear icon in the header)
2. Scroll to **Garden Sections**
3. Tap **+ Add section**
4. Enter a name and configure the section
5. Tap **Save**

The new section appears at the bottom of the map.

### Remove a section

In **Settings → Garden Sections**, tap the **Remove** button next to the section you want to delete. Plants in the section are **not** deleted — they remain in the database and can be reassigned.

### Reorder sections

In **Settings → Garden Sections**, drag sections up or down to change their order on the map.

---

## 4. Adding plants

### Add a plant to a section

1. Tap the **section name** on the map to open the section sheet
2. Tap **+ Add slot** to add a placeholder, then tap the placeholder to convert it — or tap **Add Plant** directly if available
3. Enter the plant name
4. Pick a card color (used as a visual tint when there is no photo)
5. Tap **Save**

The plant appears immediately on the map.

### Converting a placeholder

When you increase the columns or rows of a section, empty placeholder slots are created automatically. They appear as dashed cards with a `?` symbol.

Tap a placeholder to convert it into a real plant:
1. Enter the name
2. Pick a color
3. Tap **Save**

### Plant label (sorszám)

Each plant has an editable **label** — a short identifier you can use on physical markers in your garden (e.g. `42` or `A1`). Labels are unique across all plants and searchable.

To set or change a label: open the plant detail, tap **Edit**, and update the label field.

---

## 5. Plant detail

Tap any plant card on the map to open its detail view.

The detail view shows:
- Plant name and assigned section
- Label (sorszám)
- Spray forecast (next due date and status)
- Event timeline — all recorded events in reverse chronological order
- Photos

### Edit a plant

Tap the **✏️ Edit** button to change the plant's name, notes, color, or label.

### Delete a plant

In the edit view, scroll to **Danger Zone** and tap **Delete Plant**. This also removes all associated events and photos.

> Placeholder slots cannot be deleted individually — decrease the column or row count in the section settings to remove them.

---

## 6. Recording events

Events are the history of care actions for a plant.

### Add an event to one plant

1. Open the plant's detail view (tap its card on the map)
2. Tap **+ Add Event**
3. Choose the event type:
   - Planted
   - Flowering
   - Sprayed
   - Pruned
   - Harvested
   - Crop Recorded
   - Watered
   - Sickness/Pest
   - Other
4. Pick the date
5. Add optional notes
6. Tap **Save**

The event appears in the timeline immediately and the status dot on the map updates.

---

## 7. Bulk events

Use bulk events to record the same action across many plants at once — for example, spraying the entire garden on one day.

1. Tap the **📋 icon** in the top header
2. Choose the **Events** tab
3. Choose the event type
4. Set the date and optional notes
5. Search for plants by name or label if needed, or use **Select All**
6. Check the plants you want to update
7. Tap **Save Event**

All selected plants receive the event and their status dots update.

---

## 8. Spray forecasting

The app automatically calculates when each plant is next due for spraying, based on:
- The date of the most recent **Sprayed** event
- The global spray interval set in Settings

### Set the spray interval

1. Go to **Settings**
2. Find **Spray Intervals**
3. Set the number of days between sprays

The status dot on each map card reflects the forecast:
- 🟢 More than 3 days until due
- 🟠 Due within 3 days
- 🔴 Overdue (past the due date)
- ⚪ No spray event recorded yet

---

## 9. Photos

Each plant can have up to 3 photos.

### Add a photo

1. Open the plant's detail view
2. Tap **Add Photo**
3. Select a photo from your device

Photos are automatically compressed (max 800px, 70% JPEG quality) and stored on your device.

### Manage photos

- Tap the main photo to open the gallery
- In the gallery, tap any photo to set it as the **main photo** (shown on the card and detail view) — it is marked with ★
- Tap the trash icon to delete a photo

---

## 10. Todo list

The todo list is a task tracker for garden work.

### Access

Tap the **📋 icon** in the header, then switch to the **Tasks** tab.

### Add a task

Type in the input at the top and tap **Add task**.

### Task features

- **Mark done** — tap the checkmark button on a task to complete it
- **Dependencies** — tap a task to open its detail; link it to other tasks as prerequisites
- **Done list** — completed tasks are shown below the active list with their completion date

---

## 11. Search

Tap the **🔍 Search** field in the map header to search plants by name or label (sorszám). Matching plants are highlighted on the map; tap a result card to open its detail.

---

## 12. Settings

Access via the **⚙️ gear icon** in the header.

| Setting | Description |
|---------|-------------|
| Language | Switch between English and Hungarian |
| Spray Intervals | Days between sprays (global setting) |
| Garden Sections | Add, remove, and reorder sections |
| Export Data | Download a full JSON backup of all data |
| Import Data | Restore from a previously exported backup |
| Clear All Data | Delete everything (cannot be undone) |

---

## 13. Backing up your data

Your data is stored only on your device. If you clear browser storage or switch devices, it will be lost unless you have a backup.

### Export a backup

1. Go to **Settings**
2. Tap **Export**
3. Save the downloaded `.json` file somewhere safe (cloud storage, email to yourself, etc.)

The app will show a reminder banner if you haven't backed up in 7 days.

### Restore from backup

1. Go to **Settings**
2. Tap **Import**
3. Select your previously exported `.json` file

> Importing replaces all current data. Export first if you want to keep your current data.

---

## 14. App updates

When a new version of the app is available, a green banner appears at the top of the screen.

- Tap **Update now** to apply the update immediately (the app reloads)
- Tap **Later** to dismiss the banner and update on your next visit

---

## 15. Language

The app is available in **English** and **Hungarian**.

To change language: **Settings → Language**.

Your choice is saved automatically and persists across sessions.

---

## Troubleshooting

**Plants disappeared after browser update**
Browser storage may have been cleared. Import from your last backup (Settings → Import). Always keep an up-to-date backup file.

**Status dots all grey**
No spray events have been recorded yet, or the spray interval is not configured. Add a Sprayed event to a plant and check Settings → Spray Intervals.

**App won't install on Android**
Make sure you're using Chrome or Brave. The app must be served over HTTPS. Try clearing the browser cache and reloading.

**App not loading offline**
The service worker needs one online load to cache the app. Connect to the internet, reload the app once, then it will work offline.
