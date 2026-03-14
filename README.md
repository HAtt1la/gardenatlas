# 🌱 GardenAtlas

A fully offline Progressive Web App (PWA) for garden plant cataloging and management. Designed to run on Android browsers (Chrome/Brave) with complete offline functionality.

## 📁 Project Structure

```
gardenatlas/
├── src/
│   ├── main.js                 # Application entry point + Service Worker registration
│   ├── App.svelte              # Main application shell with routing
│   ├── lib/
│   │   ├── db.js               # Dexie/IndexedDB database layer and CRUD operations
│   │   ├── stores.js           # Svelte stores for state management
│   │   ├── sampleData.js       # Initial sample plant data (34 plants)
│   │   └── i18n.js             # Internationalization (English/Hungarian)
│   └── components/
│       ├── GardenMap.svelte    # SVG-based garden visualization
│       ├── PlantDetail.svelte  # Plant details view with event timeline
│       ├── BedDetail.svelte    # Bed details view with plant management
│       ├── EventForm.svelte    # Form for adding events to a single plant
│       ├── MultiEventForm.svelte # Form for adding events to multiple plants
│       ├── AddPlantInline.svelte # Reusable inline form for adding plants
│       ├── AddPlantForm.svelte # (Deprecated) Form for adding custom plants
│       ├── SearchBar.svelte    # Search plants by ID or name
│       ├── Settings.svelte     # Settings, export/import, interval config
│       └── Toast.svelte        # Toast notification component
├── public/
│   ├── manifest.json           # PWA manifest for installability
│   ├── sw.js                   # Service worker for offline support
│   ├── icon.svg                # App icon (SVG)
│   ├── icon-192.png            # PWA icon 192x192
│   └── icon-512.png            # PWA icon 512x512
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite build configuration
├── svelte.config.js            # Svelte compiler configuration
└── architecture-plan.md        # Original architecture documentation
```

## ✅ Features Implemented

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Garden Map View** | Top-down SVG visualization of entire garden | ✅ |
| **Plant Markers** | 24 fruit trees, 3 raised beds, 20 grapevines (4 rows × 5), 3 raspberry plants | ✅ |
| **Bed Plant Management** | Add up to 6 plants per bed with emojis, colors and amounts | ✅ |
| **Custom Plants Section** | Add herbs, flowers, and other plants with custom emojis and colors | ✅ |
| **Color Coding** | Visual indicators for spray schedule, plant care status, and variety color | ✅ |
| **Plant Details** | Name, ID, type, notes, full event history | ✅ |
| **Edit Plants** | Inline editing of plant name and notes (all plant types) | ✅ |
| **Delete Plants** | Remove bed plants and herbs/flowers (trees/vines are permanent) | ✅ |
| **Event Timeline** | Track flowering, spraying, pruning, fertilizing, harvesting, planting, crops | ✅ |
| **Add Events** | Date picker and notes for each event (single plant) | ✅ |
| **Bulk Events** | Add events to multiple plants at once (e.g., spraying all plants) | ✅ |
| **Search** | Quick search by plant ID or name | ✅ |
| **Spray Forecasts** | Automatic calculation of next spray date based on intervals | ✅ |
| **Configurable Intervals** | Set spray intervals per plant type (grapes, fruit trees) | ✅ |
| **Multi-language** | English and Hungarian interface | ✅ |
| **Data Export** | Download complete backup as JSON | ✅ |
| **Data Import** | Restore from backup file | ✅ |
| **Offline First** | Full functionality without internet connection | ✅ |
| **PWA Ready** | Installable on Android home screen | ✅ |
| **Photo Attachments** | Add up to 3 photos per plant with auto-compression | ✅ |

### Event Types

- 🌱 **Planted** - Initial planting date
- 🌸 **Flowering** - Flower bloom tracking
- 💨 **Sprayed** - Pesticide/fungicide applications
- ✂️ **Pruned** - Pruning events
- 🧺 **Harvested** - Harvest dates
- 📊 **Crop Recorded** - Crop yield tracking

## 🚀 How to Run

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Navigate to http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy the dist/ folder to your web server
```

## 📱 How to Install on Android

### Option 1: Install as PWA (Recommended)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Serve the `dist/` folder** on your local network or a server

3. **Open in Chrome/Brave** on your Android device:
   - Navigate to `http://your-server-ip:port`
   
4. **Install to Home Screen**:
   - Tap the browser menu (⋮)
   - Select "Add to Home Screen" or "Install App"
   - Confirm installation

5. **Use Offline**:
   - Launch from home screen icon
   - Works completely offline after first load

### Option 2: Development Testing

1. **Find your local IP**:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. **Start dev server with network access**:
   ```bash
   npm run dev -- --host
   ```

3. **Connect from Android**:
   - Open `http://your-ip:5173` in mobile browser
   - Follow installation steps above

## 📝 Notes

### Database

- **Storage**: IndexedDB via Dexie.js
- **Location**: Browser local storage (persistent)
- **Size**: Unlimited (within browser quotas)
- **Schema Version**: 6
- **Tables**:
  - `plants` - Plant information (name, type, emoji, color, bedId, amount)
  - `events` - Event history with timestamps
  - `settings` - User preferences and intervals
  - `photos` - Plant photos stored as compressed blobs

### Sample Data

On first launch, the app initializes with sample data:
- **24 Fruit Trees**: Apple (2), Pear (2), Cherry, Plum (2), Apricot, Peach, Walnut, Quince, and more
- **3 Raised Beds**: Bed A (tomatoes/peppers), Bed B (cucumbers/herbs), Bed C (salad/spinach)
- **20 Grapevines**: 4 rows × 5 vines, each row with a distinct variety color (purple, green, red, mixed)
- **3 Raspberry plants**: 1 vertical line with red and yellow varieties
- **Custom Plants**: Add your own herbs, flowers, and other plants with emoji icons and colors
- **Sample Events**: Various spray, planting, and pruning events

### Default Spray Intervals

- **Grapevines**: 14 days
- **Raspberries**: 14 days
- **Fruit Trees**: 21 days
- **Raised Beds**: N/A (null)
- **Custom Plants**: N/A (null)

These can be customized in Settings.

### Variety Colors

Every plant can have a background color assigned to visually distinguish varieties — especially useful when multiple plants share the same emoji (e.g., different grape varieties or herb species):

- **Grapevines**: Each vine has a variety color shown as the card background tint on the map
- **Raspberries**: Red or yellow background distinguishes summer vs. autumn and yellow varieties
- **Fruit Trees**: Color the card to indicate variety (e.g., red for Red Chief apple, yellow for Golden Delicious)
- **Herbs & Flowers**: Use color to tell apart plants that share the same emoji (e.g., two different 🌿 herbs)
- **Bed Plants**: Color is visible in the bed detail view

A small colored dot in the top-right corner of each card shows the **spray/care status** (green = ok, orange = soon, red = overdue), while the card background tint shows the **variety color**.

To change a plant's color: open the plant detail, tap ✏️ to edit, and pick from the 12-color palette.

### Garden Layout

The garden map is organized into sections (top to bottom):

```
┌───────────────────────────────┬────────┐
│  🌳 Fruit Trees (6×4)         │🍓 Rasp │
├───────────────────────────────┴────────┤
│  🍇 Grapevines row 1                   │
│  🍇 Grapevines row 2                   │
│  🍇 Grapevines row 3                   │
│  🥬 Raised Beds A / B / C              │
│  🍇 Grapevines row 4                   │
├────────────────────────────────────────┤
│  🌿 Herbs & Flowers (unlimited)        │
└────────────────────────────────────────┘
```



1. Scroll to the "Herbs & Flowers" section on the map
2. Click the "+ Add New Plant" button
3. An inline form appears (no page navigation)
4. Enter the plant name
5. Select an emoji icon (26+ plant-related emojis available)
6. Choose a background color from the 12-color palette to visually distinguish the plant
7. Preview your plant with the colored circle
8. Click "Add Plant"

Custom plants support all features: notes, events, spray tracking, and more.

### Adding Events to Multiple Plants

1. On the garden map view, click the 📋 button in the header (next to search)
2. Select the event type (Sprayed, Pruned, Planted, Flowering, Harvested, or Crop Recorded)
3. Pick the date for the event
4. Add optional notes
5. Search for plants by name or ID (optional)
6. Select plants:
   - Click checkboxes to select individual plants
   - Use "Select All" to select all plants at once
   - Use "Clear Selection" to deselect all
7. Click "Add Event to X Plants" to save
8. The event is automatically added to all selected plants and appears in their detail view

**Use Case**: Spray all plants in the garden on the same date - just select all and add the "Sprayed" event.

### Managing Bed Plants

1. Click on any bed in the garden map
2. View the bed layout with plants shown as emojis
3. Click "Add Plant to Bed" to add a new plant:
   - Enter plant name (e.g., Tomato, Basil)
   - Set quantity amount
   - Choose an emoji icon
   - Choose a background color
4. Click any plant emoji to view its details and event history
5. Each bed supports up to 6 different plant types
6. Plants in beds display with color-coded status rings:
   - 🟢 Green: Well cared for (within 7 days)
   - 🟡 Yellow: Needs attention (7-14 days)
   - 🔴 Red: Neglected (over 14 days)

**Note**: Bed plants can be deleted, but the beds themselves are permanent.

### Plant Photos

Each plant can have up to 3 photos attached:

1. **Adding Photos**: Click on any plant to view its details, then tap the photo area or "Add Photo" button
2. **Main Photo**: The first photo added becomes the main photo displayed on the plant detail page
3. **Gallery View**: Tap the main photo to open a gallery showing all photos for that plant
4. **Change Main Photo**: In the gallery, tap any photo to set it as the new main photo (marked with ★)
5. **Delete Photos**: Tap the trash icon on any photo in the gallery to remove it

**Technical Details**:
- Photos are automatically compressed and resized (max 800px) to save storage
- Quality is optimized for mobile viewing (70% JPEG)
- Photos are stored locally in IndexedDB and included in data exports
- Works completely offline

### Language Support

The app is available in:
- **English** 🇬🇧
- **Hungarian** 🇭🇺

Change language in Settings. Your preference is saved automatically.

### Data Backup

**Important**: Your data is stored locally in the browser. Always maintain backups:

1. Go to Settings
2. Click "Export" to download JSON backup
3. Store the file safely
4. Import when needed or on a new device

### PWA Icons

The current icons are placeholders. For production:

1. Create proper 192×192 and 512×512 PNG icons with your garden logo
2. Replace `public/icon-192.png` and `public/icon-512.png`
3. Update `public/icon.svg` if needed
4. Rebuild the app

### Browser Compatibility

- ✅ Chrome/Chromium (Android & Desktop)
- ✅ Brave (Android & Desktop)
- ✅ Edge (Desktop)
- ✅ Safari (iOS 14+, Desktop)
- ⚠️ Firefox (IndexedDB supported, PWA install limited)

### Offline Functionality

The service worker caches:
- App shell (HTML, CSS, JS)
- All static assets
- SVG icons

After first load, the app works completely offline. Data sync is manual via export/import.

### Future Enhancements

Potential features for future versions:
- Multi-season analytics
- Harvest yield tracking
- Disease/pest logging
- Planting calendar

## 🛠️ Technology Stack

- **Framework**: Svelte 4.2
- **Build Tool**: Vite 5.2
- **Database**: Dexie.js 4.0 (IndexedDB wrapper)
- **PWA**: Service Worker + Web App Manifest
- **UI**: Custom CSS (no framework)
- **Rendering**: SVG for garden map
- **i18n**: Custom translation system with localStorage persistence

## 📄 License

This project is created for personal garden management. Feel free to use and modify as needed.

## 🐛 Troubleshooting

### App won't install on Android
- Ensure you're using HTTPS or localhost
- Check that manifest.json is served correctly
- Clear browser cache and try again

### Data disappeared
- Check if browser storage was cleared
- Import from your latest backup
- Ensure browser isn't in incognito/private mode

### Spray forecasts not showing
- Add at least one spray event to a plant
- Check that spray intervals are configured in Settings
- Verify the plant type has a spray interval set

### Can't see the garden map
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page
- Clear cache and reload

---

**Version**: 1.1.1
**Last Updated**: March 14, 2026
