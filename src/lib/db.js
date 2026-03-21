import Dexie from 'dexie';

// Create database
export const db = new Dexie('GardenAtlasDB');

// Version 1: Unified section system with editable plant labels
db.version(1).stores({
  plants: '++id, name, type, sectionId, color, &label',
  events: '++id, [plantId+eventType], plantId, eventType, date, modifiedAt',
  settings: 'key',
  photos: '++id, plantId, isMain',
  todos: '++id, createdAt, doneAt'
});

// Event types - labels are i18n keys, will be translated at runtime
export const EVENT_TYPES = [
  { id: 'planted', label: 'planted', icon: '🌱' },
  { id: 'flowering', label: 'flowering', icon: '🌸' },
  { id: 'spray', label: 'spray', icon: '💨' },
  { id: 'pruned', label: 'pruned', icon: '✂️' },
  { id: 'harvested', label: 'harvested', icon: '🧺' },
  { id: 'sickness', label: 'sickness', icon: '🦠' },
  { id: 'crop', label: 'crop', icon: '📊' }
];

// Default spray interval (days) — used for spray status calculation
export const DEFAULT_SPRAY_DAYS = 14;

// CRUD Operations for Plants
export async function getAllPlants() {
  return await db.plants.toArray();
}

export async function getPlant(id) {
  return await db.plants.get(id);
}

export async function addPlant(plant) {
  return await db.plants.add(plant);
}

export async function updatePlant(id, changes) {
  return await db.plants.update(id, changes);
}

export async function deletePlant(id) {
  await db.events.where('plantId').equals(id).delete();
  await db.photos.where('plantId').equals(id).delete();
  return await db.plants.delete(id);
}

// CRUD Operations for Events
export async function getEventsForPlant(plantId) {
  return await db.events
    .where('plantId')
    .equals(plantId)
    .reverse()
    .sortBy('date');
}

export async function addEvent(event) {
  return await db.events.add({
    ...event,
    modifiedAt: new Date().toISOString()
  });
}

export async function updateEvent(id, changes) {
  return await db.events.update(id, {
    ...changes,
    modifiedAt: new Date().toISOString()
  });
}

export async function deleteEvent(id) {
  return await db.events.delete(id);
}

export async function getLastEventOfType(plantId, eventType) {
  const events = await db.events
    .where(['plantId', 'eventType'])
    .equals([plantId, eventType])
    .reverse()
    .sortBy('date');
  return events[0] || null;
}

// Settings Operations
export async function getSetting(key, defaultValue = null) {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
}

export async function setSetting(key, value) {
  return await db.settings.put({ key, value });
}

// Helper to convert Blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to convert base64 to Blob
function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

// Export all data
export async function exportData() {
  const plants = await db.plants.toArray();
  const events = await db.events.toArray();
  const settings = await db.settings.toArray();
  const photosRaw = await db.photos.toArray();

  // Convert photo blobs to base64 for JSON export
  const photos = await Promise.all(photosRaw.map(async (photo) => {
    const base64 = await blobToBase64(photo.data);
    return { ...photo, data: base64 };
  }));

  return { plants, events, settings, photos, exportedAt: new Date().toISOString() };
}

// Import data (replaces existing)
export async function importData(data) {
  await db.transaction('rw', db.plants, db.events, db.settings, db.photos, async () => {
    await db.plants.clear();
    await db.events.clear();
    await db.settings.clear();
    await db.photos.clear();

    if (data.plants?.length) await db.plants.bulkAdd(data.plants);
    if (data.events?.length) await db.events.bulkAdd(data.events);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings);

    // Convert base64 photos back to blobs
    if (data.photos?.length) {
      const photosWithBlobs = data.photos.map(photo => ({
        ...photo,
        data: base64ToBlob(photo.data)
      }));
      await db.photos.bulkAdd(photosWithBlobs);
    }
  });
}

// Forecast calculation
export async function calculateNextSpray(plantId) {
  const plant = await getPlant(plantId);
  if (!plant) return null;

  const sprayIntervals = await getSetting('sprayIntervals', {});
  const interval = sprayIntervals[plant.sectionId] ?? DEFAULT_SPRAY_DAYS;
  if (!interval) return null;

  const lastSpray = await getLastEventOfType(plantId, 'spray');
  if (!lastSpray) return { status: 'never', date: null };

  const lastDate = new Date(lastSpray.date);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + interval);

  const now = new Date();
  const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

  return {
    status: daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'soon' : 'ok',
    date: nextDate.toISOString().split('T')[0],
    daysUntil
  };
}

// Batch version: compute spray status for all plants in one pass.
// Fetches sprayIntervals setting once, then queries spray events in bulk.
export async function calculateAllSprayStatuses(plants) {
  const nonPlaceholders = plants.filter(p => p.type !== 'placeholder');
  if (!nonPlaceholders.length) return {};

  const interval = (await getSetting('sprayIntervals', DEFAULT_SPRAY_DAYS)) ?? DEFAULT_SPRAY_DAYS;
  const effectiveInterval = typeof interval === 'number' ? interval : DEFAULT_SPRAY_DAYS;

  // Fetch all spray events for these plants in one query
  const plantIds = nonPlaceholders.map(p => p.id);
  const sprayEvents = await db.events
    .where('plantId').anyOf(plantIds)
    .filter(e => e.eventType === 'spray')
    .toArray();

  // Find most recent spray per plant
  const lastSprayByPlant = {};
  for (const e of sprayEvents) {
    const cur = lastSprayByPlant[e.plantId];
    if (!cur || e.date > cur.date) lastSprayByPlant[e.plantId] = e;
  }

  const now = new Date();
  const result = {};
  for (const plant of nonPlaceholders) {
    const lastSpray = lastSprayByPlant[plant.id];
    if (!lastSpray) {
      result[plant.id] = 'never';
      continue;
    }
    const nextDate = new Date(lastSpray.date);
    nextDate.setDate(nextDate.getDate() + effectiveInterval);
    const daysUntil = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
    result[plant.id] = daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'soon' : 'ok';
  }
  return result;
}

// Get plant care status based on recent events (for status color)
export async function getPlantCareStatus(plantId) {
  const events = await db.events
    .where('plantId')
    .equals(plantId)
    .reverse()
    .sortBy('date');

  if (!events || events.length === 0) {
    return 'neglected'; // No events = red
  }

  // Find most recent care event (exclude spraying as per user request)
  const careEvents = events.filter(e => e.eventType !== 'spray');

  if (careEvents.length === 0) {
    return 'neglected';
  }

  const lastCareDate = new Date(careEvents[0].date);
  const now = new Date();
  const daysSinceLastCare = Math.floor((now - lastCareDate) / (1000 * 60 * 60 * 24));

  if (daysSinceLastCare <= 7) {
    return 'healthy'; // Green - cared for within a week
  } else if (daysSinceLastCare <= 14) {
    return 'attention'; // Yellow - needs attention
  } else {
    return 'neglected'; // Red - neglected
  }
}

// CRUD Operations for Photos
const MAX_PHOTOS_PER_PLANT = 3;
const MAX_IMAGE_SIZE = 800; // Max width/height in pixels
const IMAGE_QUALITY = 0.7; // JPEG quality (0-1)

// Compress and resize image
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if larger than max size
        if (width > height) {
          if (width > MAX_IMAGE_SIZE) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width);
            width = MAX_IMAGE_SIZE;
          }
        } else {
          if (height > MAX_IMAGE_SIZE) {
            width = Math.round((width * MAX_IMAGE_SIZE) / height);
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          IMAGE_QUALITY
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Get photos for a plant
export async function getPhotosForPlant(plantId) {
  return await db.photos.where('plantId').equals(plantId).toArray();
}

// Get main photo for a plant
export async function getMainPhotoForPlant(plantId) {
  const mainPhoto = await db.photos.where({ plantId, isMain: 1 }).first();
  if (mainPhoto) return mainPhoto;
  // If no main photo, return the first one
  const photos = await getPhotosForPlant(plantId);
  return photos[0] || null;
}

// Get main photo for every plant in a list, returns { [plantId]: photo }
export async function getMainPhotosForPlants(plantIds) {
  if (!plantIds.length) return {};
  // Fetch all photos for the given plants in one query, then pick main per plant
  const all = await db.photos.where('plantId').anyOf(plantIds).toArray();
  const byPlant = {};
  for (const photo of all) {
    const id = photo.plantId;
    if (!byPlant[id]) {
      byPlant[id] = photo;
    } else if (photo.isMain === 1) {
      byPlant[id] = photo;
    }
  }
  return byPlant;
}

// Add photo to plant
export async function addPhotoToPlant(plantId, file) {
  const existingPhotos = await getPhotosForPlant(plantId);
  if (existingPhotos.length >= MAX_PHOTOS_PER_PLANT) {
    throw new Error(`Maximum ${MAX_PHOTOS_PER_PLANT} photos allowed per plant`);
  }

  const compressedBlob = await compressImage(file);
  const isMain = existingPhotos.length === 0 ? 1 : 0; // First photo is main

  return await db.photos.add({
    plantId,
    data: compressedBlob,
    isMain,
    createdAt: new Date().toISOString()
  });
}

// Set main photo
export async function setMainPhoto(photoId) {
  const photo = await db.photos.get(photoId);
  if (!photo) return;

  // Unset all other photos as main for this plant
  await db.photos.where('plantId').equals(photo.plantId).modify({ isMain: 0 });
  // Set this photo as main
  await db.photos.update(photoId, { isMain: 1 });
}

// Delete photo
export async function deletePhoto(photoId) {
  const photo = await db.photos.get(photoId);
  if (!photo) return;

  const wasMain = photo.isMain === 1;
  await db.photos.delete(photoId);

  // If deleted photo was main, make the first remaining photo main
  if (wasMain) {
    const remainingPhotos = await getPhotosForPlant(photo.plantId);
    if (remainingPhotos.length > 0) {
      await db.photos.update(remainingPhotos[0].id, { isMain: 1 });
    }
  }
}

// Delete all photos for a plant
export async function deletePhotosForPlant(plantId) {
  await db.photos.where('plantId').equals(plantId).delete();
}

// Convert a real plant to a placeholder in-place (tree cut down etc.)
export async function convertToPlaceholder(id) {
  const plant = await db.plants.get(id);
  if (!plant || plant.type === 'placeholder') return;
  // Delete associated events and photos - placeholder has no history
  await db.events.where('plantId').equals(id).delete();
  await db.photos.where('plantId').equals(id).delete();
  return await db.plants.update(id, {
    type: 'placeholder',
    name: '',
    color: null,
    notes: null,
    label: null
    // sectionId is preserved as-is
  });
}

// ── Layout column/row adjustment helpers ──────────────────────────────────

// Get all plants of a section instance (real + placeholders) in DB order
async function getSectionPlants(sectionId) {
  const all = await db.plants.toArray();
  return all
    .filter(p => p.sectionId === sectionId)
    .sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
}

// Validate whether columns can be decreased by N.
// Rule: every row must have at least N placeholders.
// Returns { ok: true } or { ok: false, message, blockingPlants }
export async function validateColDecrease(sectionId, currentCols, newCols) {
  const decrease = currentCols - newCols;
  if (decrease <= 0) return { ok: true };
  const plants = await getSectionPlants(sectionId);
  const rowCount = Math.ceil(plants.length / currentCols);
  const blockingPlants = [];
  for (let row = 0; row < rowCount; row++) {
    const rowPlants = plants.slice(row * currentCols, (row + 1) * currentCols);
    const placeholderCount = rowPlants.filter(p => p.type === 'placeholder').length;
    if (placeholderCount < decrease) {
      const real = rowPlants.filter(p => p.type !== 'placeholder');
      blockingPlants.push(...real.slice(0, decrease - placeholderCount));
    }
  }
  if (blockingPlants.length > 0) {
    return { ok: false, blockingPlants };
  }
  return { ok: true };
}

// Apply a column decrease: remove one placeholder per row, N times.
export async function applyColDecrease(sectionId, currentCols, newCols) {
  const decrease = currentCols - newCols;
  if (decrease <= 0) return;
  let plants;
  for (let pass = 0; pass < decrease; pass++) {
    plants = await getSectionPlants(sectionId);
    const cols = currentCols - pass;
    const rowCount = Math.ceil(plants.length / cols);
    for (let row = rowCount - 1; row >= 0; row--) {
      const rowPlants = plants.slice(row * cols, (row + 1) * cols);
      const lastPlaceholder = [...rowPlants].reverse().find(p => p.type === 'placeholder');
      if (lastPlaceholder) {
        await db.plants.delete(lastPlaceholder.id);
      }
    }
  }
}

// Apply a column increase: add one placeholder per existing row for each new column.
export async function applyColIncrease(sectionId, currentCols, newCols) {
  const increase = newCols - currentCols;
  if (increase <= 0) return;
  const plants = await getSectionPlants(sectionId);
  if (plants.length === 0) return;
  const rowCount = Math.ceil(plants.length / currentCols);
  for (let pass = 0; pass < increase; pass++) {
    for (let row = 0; row < rowCount; row++) {
      await db.plants.add({
        name: '',
        type: 'placeholder',
        sectionId,
        color: null
      });
    }
  }
}

// Validate row decrease (same logic, operates on full rows)
export async function validateRowDecrease(sectionId, currentCols, currentRows, newRows) {
  const decrease = currentRows - newRows;
  if (decrease <= 0) return { ok: true };
  const plants = await getSectionPlants(sectionId);
  const blockingPlants = [];
  for (let row = currentRows - decrease; row < currentRows; row++) {
    const rowPlants = plants.slice(row * currentCols, (row + 1) * currentCols);
    const real = rowPlants.filter(p => p.type !== 'placeholder');
    blockingPlants.push(...real);
  }
  if (blockingPlants.length > 0) {
    return { ok: false, blockingPlants };
  }
  return { ok: true };
}

// Apply a row decrease: delete all plants (placeholders only, validated) in removed rows
export async function applyRowDecrease(sectionId, currentCols, currentRows, newRows) {
  const decrease = currentRows - newRows;
  if (decrease <= 0) return;
  const plants = await getSectionPlants(sectionId);
  for (let row = currentRows - decrease; row < currentRows; row++) {
    const rowPlants = plants.slice(row * currentCols, (row + 1) * currentCols);
    for (const p of rowPlants) {
      await db.plants.delete(p.id);
    }
  }
}

// Apply a row increase: add a full row of placeholders
export async function applyRowIncrease(sectionId, currentCols, newRows, currentRows) {
  const increase = newRows - currentRows;
  if (increase <= 0) return;
  for (let r = 0; r < increase; r++) {
    for (let c = 0; c < currentCols; c++) {
      await db.plants.add({
        name: '',
        type: 'placeholder',
        sectionId,
        color: null
      });
    }
  }
}

// ── Garden Sections ─────────────────────────────────────────────────────────

// Maps old type-based sections to color/wire defaults for migration
const TYPE_MIGRATION = {
  fruit:     { color: '#a8d5a2', showWires: false },
  grape:     { color: '#9b59b6', showWires: true },
  raspberry: { color: '#e74c3c', showWires: false },
  shrub:     { color: '#8b6f47', showWires: false },
  other:     { color: '#27ae60', showWires: false },
  bed:       { color: '#8b6f47', showWires: false },
};

export const DEFAULT_SECTIONS = [
  { instanceId: 'section-1', name: 'Fruit Trees',  cols: 6, rows: 1, color: '#a8d5a2', showWires: false },
  { instanceId: 'section-2', name: 'Grapevines',   cols: 5, rows: 4, color: '#9b59b6', showWires: true },
  { instanceId: 'section-3', name: 'Raspberries',  cols: 4, rows: 1, color: '#e74c3c', showWires: false },
  { instanceId: 'section-4', name: 'Raised Beds',  cols: 3, rows: 1, color: '#8b6f47', showWires: false },
  { instanceId: 'section-5', name: 'Other Plants', cols: 5, rows: 1, color: '#27ae60', showWires: false },
];

export async function getSections() {
  const saved = await getSetting('sections', null);
  if (saved && Array.isArray(saved)) {
    // Migrate old typed sections: add color/showWires if missing
    let patched = false;
    const result = saved.map(s => {
      if (s.color != null && s.showWires != null) return s;
      const defaults = TYPE_MIGRATION[s.type] ?? { color: '#a8d5a2', showWires: false };
      patched = true;
      // eslint-disable-next-line no-unused-vars
      const { type, ...rest } = s;
      return {
        ...rest,
        color: s.color ?? defaults.color,
        showWires: s.showWires ?? defaults.showWires
      };
    });
    if (patched) await setSetting('sections', result);
    return result;
  }
  // Migrate from old named-key layout format
  const oldLayout = await getSetting('layout', null);
  if (oldLayout && !Array.isArray(oldLayout)) {
    const migrated = [
      { instanceId: 'section-1', name: 'Fruit Trees',  cols: oldLayout.fruitTrees?.cols ?? 6,  rows: 1, color: '#a8d5a2', showWires: false },
      { instanceId: 'section-2', name: 'Grapevines',   cols: oldLayout.grapevines?.cols ?? 5,  rows: oldLayout.grapevines?.rows ?? 4, color: '#9b59b6', showWires: true },
      { instanceId: 'section-3', name: 'Raspberries',  cols: 4, rows: 1, color: '#e74c3c', showWires: false },
      { instanceId: 'section-4', name: 'Raised Beds',  cols: 3, rows: 1, color: '#8b6f47', showWires: false },
      { instanceId: 'section-5', name: 'Other Plants', cols: oldLayout.herbsFlowers?.cols ?? 5, rows: 1, color: '#27ae60', showWires: false },
    ];
    await setSetting('sections', migrated);
    return migrated;
  }
  return JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
}

export async function saveSections(sections) {
  await setSetting('sections', sections);
}

// Check whether a label is already taken by another plant
export async function isLabelTaken(label, excludeId = null) {
  const existing = await db.plants.where('label').equals(label).first();
  if (!existing) return false;
  return existing.id !== excludeId;
}

// Generate the next available numeric label string
async function nextLabel() {
  const all = await db.plants.toArray();
  const used = new Set(all.map(p => p.label).filter(Boolean));
  let n = all.length + 1;
  while (used.has(String(n))) n++;
  return String(n);
}

// Add a placeholder plant for a given section instance
export async function addPlaceholderPlant(sectionId) {
  return await db.plants.add({
    name: '',
    type: 'placeholder',
    sectionId,
    color: null,
    label: null
  });
}

// Add a real named plant directly to a section (no placeholder step)
export async function addSectionPlant(sectionId, name, color) {
  const label = await nextLabel();
  return await db.plants.add({
    name,
    type: 'plant',
    sectionId,
    color: color || null,
    label
  });
}

// Convert a placeholder to a real plant in-place.
// position: 1-based target column within its row (optional).
export async function convertPlaceholder(id, name, color, position) {
  const plant = await db.plants.get(id);
  if (!plant || plant.type !== 'placeholder') return;

  if (position != null) {
    const sectionId = plant.sectionId;
    const all = await db.plants.toArray();
    const section = all
      .filter(p => p.sectionId === sectionId)
      .sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));

    const idx = section.findIndex(p => p.id === id);

    const allSections = await getSections();
    const sec = allSections.find(s => s.instanceId === sectionId);
    const cols = sec?.cols ?? 1;

    const row = Math.floor(idx / cols);
    const rowStart = row * cols;

    const targetCol = Math.max(0, Math.min(cols - 1, (position - 1)));
    const currentCol = idx - rowStart;

    if (targetCol !== currentCol) {
      let order = 0;
      for (const p of section) {
        if (p.sortOrder == null) await db.plants.update(p.id, { sortOrder: order });
        order++;
      }
      const refreshed = (await db.plants.toArray())
        .filter(p => p.sectionId === sectionId)
        .sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
      const refreshedRow = refreshed.slice(rowStart, rowStart + cols);

      const targetPlant = refreshedRow[targetCol];
      const thisPlant   = refreshedRow[currentCol];
      if (targetPlant && thisPlant) {
        const tmpOrder = thisPlant.sortOrder ?? thisPlant.id;
        await db.plants.update(thisPlant.id,   { sortOrder: targetPlant.sortOrder ?? targetPlant.id });
        await db.plants.update(targetPlant.id, { sortOrder: tmpOrder });
      }
    }
  }

  return await db.plants.update(id, {
    type: 'plant',
    name,
    color: color || null,
    label: await nextLabel()
  });
}

// Assign sectionId to any plants that are missing it (legacy migration)
export async function migratePlantSectionIds() {
  const allPlants = await db.plants.toArray();
  const needsMigration = allPlants.some(p => p.sectionId == null);
  if (!needsMigration) return false;
  const sections = await getSections();
  // Default: assign to first section
  const defaultSectionId = sections[0]?.instanceId ?? 'section-1';
  for (const p of allPlants) {
    if (p.sectionId != null) continue;
    await db.plants.update(p.id, { sectionId: defaultSectionId });
  }
  return true;
}

// Auto-backup prompt logic
const BACKUP_INTERVAL_DAYS = 7;
const SNOOZE_DAYS = 3;

export async function shouldShowBackupPrompt() {
  const lastBackup = await getSetting('lastBackupDate', null);
  const lastSnooze = await getSetting('lastBackupSnooze', null);
  const now = Date.now();

  if (lastSnooze) {
    const snoozeAge = (now - new Date(lastSnooze).getTime()) / 86400000;
    if (snoozeAge < SNOOZE_DAYS) return false;
  }

  if (!lastBackup) return true;

  const backupAge = (now - new Date(lastBackup).getTime()) / 86400000;
  return backupAge >= BACKUP_INTERVAL_DAYS;
}

export async function recordBackupDone() {
  await setSetting('lastBackupDate', new Date().toISOString());
}

export async function snoozeBackupPrompt() {
  await setSetting('lastBackupSnooze', new Date().toISOString());
}

// ── Todos ──────────────────────────────────────────────────────────────────

export async function getAllTodos() {
  return await db.todos.orderBy('createdAt').toArray();
}

export async function addTodo(text) {
  return await db.todos.add({
    text: text.trim(),
    createdAt: new Date().toISOString(),
    doneAt: null,
    doneDate: null,
    blockedBy: []
  });
}

export async function updateTodo(id, changes) {
  return await db.todos.update(id, changes);
}

export async function deleteTodo(id) {
  const all = await getAllTodos();
  for (const todo of all) {
    if (todo.blockedBy && todo.blockedBy.includes(id)) {
      await db.todos.update(todo.id, {
        blockedBy: todo.blockedBy.filter(bid => bid !== id)
      });
    }
  }
  return await db.todos.delete(id);
}

export async function completeTodo(id, doneDate) {
  const now = new Date().toISOString();
  return await db.todos.update(id, {
    doneAt: now,
    doneDate: doneDate || now.split('T')[0]
  });
}

export async function reopenTodo(id) {
  return await db.todos.update(id, { doneAt: null, doneDate: null });
}

export function computePriorityScores(todos) {
  const open = todos.filter(t => !t.doneAt);

  const blocks = new Map();
  for (const t of open) {
    blocks.set(t.id, new Set());
  }
  for (const t of open) {
    for (const bid of (t.blockedBy || [])) {
      if (blocks.has(bid)) {
        blocks.get(bid).add(t.id);
      }
    }
  }

  const scores = new Map();
  for (const t of open) {
    const visited = new Set();
    const queue = [...(blocks.get(t.id) || [])];
    while (queue.length) {
      const nxt = queue.shift();
      if (visited.has(nxt)) continue;
      visited.add(nxt);
      for (const child of (blocks.get(nxt) || [])) {
        queue.push(child);
      }
    }
    scores.set(t.id, visited.size);
  }
  return scores;
}

export function wouldCreateCycle(todos, todoId, prereqId) {
  if (todoId === prereqId) return true;
  const map = new Map(todos.map(t => [t.id, t]));
  const visited = new Set();
  const queue = [prereqId];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === todoId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const node = map.get(cur);
    if (node) {
      for (const bid of (node.blockedBy || [])) queue.push(bid);
    }
  }
  return false;
}
