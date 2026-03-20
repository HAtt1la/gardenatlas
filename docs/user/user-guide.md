# GardenAtlas User Guide

GardenAtlas is an app for tracking the plants in your garden. You can record care events, see when plants need spraying, add photos, and keep a todo list - all stored on your device with no account needed.

---

## Contents

1. [Getting the app](#1-getting-the-app)
2. [The garden map](#2-the-garden-map)
3. [Managing sections](#3-managing-sections)
4. [Adding plants](#4-adding-plants)
5. [Plant detail](#5-plant-detail)
6. [Recording events](#6-recording-events)
7. [Bulk events](#7-bulk-events)
8. [Raised beds](#8-raised-beds)
9. [Spray forecasting](#9-spray-forecasting)
10. [Photos](#10-photos)
11. [Todo list](#11-todo-list)
12. [Search](#12-search)
13. [Settings](#13-settings)
14. [Backing up your data](#14-backing-up-your-data)
15. [Language](#15-language)

---

## 1. Getting the app

### Install on Android (recommended)

1. Open Chrome or Brave on your phone
2. Navigate to the app URL
3. Tap the browser menu (⋮) → **Add to Home Screen** or **Install App**
4. Confirm - the app icon appears on your home screen
5. Open from there to use it in full-screen mode, completely offline

### Use in browser

The app works in any modern browser (Chrome, Firefox, Safari, Edge) without installation.

---

## 2. The garden map

The map is the main screen. It shows all your garden sections stacked vertically. Each plant appears as a card with:

- **Emoji icon** - the plant's chosen symbol
- **Name** - shown below the icon
- **Status dot** (top-right corner of the card):
  - 🟢 Green - spray/care is up to date
  - 🟠 Orange - due soon (within 3 days)
  - 🔴 Red - overdue
  - ⚪ Grey - no data / not tracked

Tap any plant card to open its detail view.

---

## 3. Managing sections

Sections are the containers that organize your plants on the map. Each section can be configured independently - you can have multiple grape sections, multiple fruit tree sections, etc.

### Open section settings

**Tap the section name** (the label at the top of each section). A panel slides up from the bottom.

### What you can change

- **Section name** - edit the label shown on the map
- **Columns** - how many cards per row (use the − / + stepper)
- **Rows** - for sections with a fixed grid (e.g. grapevines), set the number of rows
- **Add Plant** - add a new plant directly to this section (see section 4)

Tap **Save** to apply name/layout changes. Changes to columns and rows take effect immediately on the map.

### Add a new section

1. Go to **Settings** (gear icon in the header)
2. Scroll to **Garden Sections**
3. Tap **+ Add** next to the section type you want
4. The new section appears at the bottom of the map

Available section types:
- 🌳 **Fruit Trees** - grid of tree cards
- 🍇 **Grapevines** - rows with wire lines, for trellis layouts
- 🫐 **Raspberries** - grid, smaller card footprint
- 🥬 **Raised Beds** - special three-slot bed view
- 🌿 **Herbs & Flowers** - general grid for anything else

You can add as many sections as you like, including multiple of the same type.

### Remove a section

In **Settings → Garden Sections**, tap the **Remove** button next to the section you want to delete.

---

## 4. Adding plants

### To a regular section (fruit, grape, raspberry, herbs)

1. Tap the **section name** on the map to open the section sheet
2. Tap **+ Add Plant**
3. Enter the plant name
4. Pick an emoji from the curated palette for that section type
5. Pick a color (used as a visual tint on the map card)
6. Tap **Save**

The plant appears immediately on the map.

### To a raised bed

1. Tap any bed card on the map to open the bed detail view
2. Tap **Add Plant to Bed**
3. Fill in name, amount, emoji, and color
4. Tap **Add Plant**

### Converting a placeholder

When you increase the columns or rows of a section, empty placeholder slots are created automatically. They appear as dashed cards with a `+` symbol.

Tap a placeholder to convert it into a real plant:
1. Enter the name
2. Pick emoji and color
3. Optionally set the column position within the row (to rearrange order)
4. Tap **Save**

---

## 5. Plant detail

Tap any plant card on the map to open its detail view.

The detail view shows:
- Plant name, type, and assigned section
- Spray forecast (next due date and status)
- Event timeline - all recorded events in reverse chronological order
- Photos

### Edit a plant

Tap the **✏️ Edit** button to change the plant's name, notes, emoji, or color.

### Delete a plant

In the edit view, scroll to the bottom and tap **Delete Plant**. This also removes all associated events and photos.

> Raised bed plants and herbs/flowers can be deleted. Placeholder slots cannot be deleted individually - decrease the column/row count in the section settings to remove them.

---

## 6. Recording events

Events are the history of care actions for a plant.

### Add an event to one plant

1. Open the plant's detail view (tap its card on the map)
2. Tap **+ Add Event**
3. Choose the event type:
   - 🌱 Planted
   - 🌸 Flowering
   - 💨 Sprayed
   - ✂️ Pruned
   - 🧺 Harvested
   - 📊 Crop Recorded
   - 🌿 Fertilized
4. Pick the date
5. Add optional notes
6. Tap **Save**

The event appears in the timeline immediately and the status dot on the map updates.

---

## 7. Bulk events

Use bulk events to record the same action across many plants at once - for example, spraying the entire garden on one day.

1. Tap the **📋 icon** in the top header
2. Choose the event type
3. Set the date and optional notes
4. Search for plants by name if needed, or use **Select All**
5. Check the plants you want to update
6. Tap **Add Event to X Plants**

All selected plants receive the event and their status dots update.

---

## 8. Raised beds

Raised beds are a special section type. Each bed holds multiple plant types side by side.

- Tap a bed card on the map to open the bed detail
- See all plants in the bed displayed as emoji icons
- Tap a plant emoji to view its detail and event history
- Add plants with **Add Plant to Bed** (name, amount, emoji, color)
- Each bed supports multiple different plant types

> The number of beds per section is fixed at three. To have more beds, add another Raised Beds section in Settings.

---

## 9. Spray forecasting

The app automatically calculates when each plant is next due for spraying, based on:
- The date of the most recent **Sprayed** event
- The spray interval you have set for that plant type

### Set spray intervals

1. Go to **Settings**
2. Find **Spray Intervals**
3. Adjust the number of days for each plant type

The status dot on each map card reflects the forecast:
- 🟢 More than 3 days until due
- 🟠 Due within 3 days
- 🔴 Overdue (past the due date)
- ⚪ No spray event recorded yet

---

## 10. Photos

Each plant can have up to 3 photos.

### Add a photo

1. Open the plant's detail view
2. Tap the photo area or **Add Photo**
3. Select a photo from your device

Photos are automatically compressed (max 800px, 70% JPEG quality) and stored on your device.

### Manage photos

- Tap the main photo to open the gallery
- In the gallery, tap any photo to set it as the **main photo** (shown prominently in the detail view) - it is marked with ★
- Tap the trash icon to delete a photo

---

## 11. Todo list

The todo list is a simple task tracker for garden work.

### Access

Tap the **✓ Todo** tab in the bottom navigation.

### Add a task

Tap **+ New Task** and enter the task text.

### Task features

- **Mark done** - tap the ✓ button on a task to complete it
- **Priority scoring** - tasks that are blockers for other tasks are shown at the top
- **Dependencies** - tap a task to open its detail sheet; you can link it to other tasks as blockers
- **Done list** - completed tasks are shown below the active list

---

## 12. Search

Tap the **🔍 Search** field in the map header to search plants by name. Matching plants are highlighted; tap a result to open its detail.

---

## 13. Settings

Access via the **⚙️ gear icon** in the header.

| Setting | Description |
|---------|-------------|
| Language | Switch between English and Hungarian |
| Spray Intervals | Days between sprays for each plant type |
| Garden Sections | Add or remove sections from your map |
| Export Data | Download a full JSON backup of all data |
| Import Data | Restore from a previously exported backup |

---

## 14. Backing up your data

Your data is stored only on your device. If you clear browser data or switch devices, it will be lost unless you have a backup.

### Export a backup

1. Go to **Settings**
2. Tap **Export**
3. Save the downloaded `.json` file somewhere safe (cloud storage, email to yourself, etc.)

The app will remind you to back up after 30 days without an export.

### Restore from backup

1. Go to **Settings**
2. Tap **Import**
3. Select your previously exported `.json` file

> Importing replaces all current data. Export first if you want to keep your current data.

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
No spray events have been recorded yet, or spray intervals are not configured. Add a Sprayed event to a plant and check Settings → Spray Intervals.

**App won't install on Android**
Make sure you're using Chrome or Brave. The app must be served over HTTPS (or from localhost). Try clearing the browser cache and reloading.

**App not loading offline**
The service worker needs one online load to cache the app. Connect to the internet, reload the app once, then it will work offline.
