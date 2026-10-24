import Dexie from 'dexie';
import { findFreeHex } from './hex.js';

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

// Version 2: Care profiles and rules for plant health system
db.version(2).stores({
  plants: '++id, name, type, sectionId, color, &label, profileId',
  events: '++id, [plantId+eventType], plantId, eventType, date, modifiedAt, source',
  settings: 'key',
  photos: '++id, plantId, isMain',
  todos: '++id, createdAt, doneAt',
  careProfiles: '++id, isBuiltin',
  careRules: '++id, profileId'
});

// Version 3: Compound index on photos [plantId+isMain] for faster main photo lookup
db.version(3).stores({
  photos: '++id, plantId, isMain, [plantId+isMain]'
});

// Version 4: Hexagonal grid layout - replace rows/cols with axial coordinates
db.version(4).stores({
  plants: '++id, name, type, sectionId, color, &label, profileId, [sectionId+q+r]',
  events: '++id, [plantId+eventType], plantId, eventType, date, modifiedAt, source',
  settings: 'key',
  photos: '++id, plantId, isMain, [plantId+isMain]',
  todos: '++id, createdAt, doneAt',
  careProfiles: '++id, isBuiltin',
  careRules: '++id, profileId'
}).upgrade(async tx => {
  // Migrate plants to hex coordinates
  const plants = await tx.table('plants').toArray();
  const sectionsSetting = await tx.table('settings').get('sections');
  const sections = sectionsSetting?.value || [];
  
  // Build a map of section info
  const sectionMap = {};
  for (const sec of sections) {
    sectionMap[sec.instanceId] = sec;
  }
  
  // Group plants by section
  const plantsBySection = {};
  for (const plant of plants) {
    if (!plantsBySection[plant.sectionId]) {
      plantsBySection[plant.sectionId] = [];
    }
    plantsBySection[plant.sectionId].push(plant);
  }
  
  // Migrate each section
  for (const [sectionId, sectionPlants] of Object.entries(plantsBySection)) {
    const section = sectionMap[sectionId];
    const cols = section?.cols || 6;
    const rows = section?.rows || 1;
    
    // Sort by old order
    const sorted = sectionPlants.sort((a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id));
    
    // Convert to hex coordinates - place in rows
    // Use axial coordinates with r as row, q as column
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        if (idx < sorted.length) {
          const plant = sorted[idx++];
          await tx.table('plants').update(plant.id, {
            q,
            r,
            sortOrder: null
          });
        }
      }
    }
  }
  
  // Update sections to remove cols/rows
  if (sectionsSetting) {
    const updatedSections = sections.map(sec => {
      // eslint-disable-next-line no-unused-vars
      const { cols, rows, showWires, ...rest } = sec;
      return rest;
    });
    await tx.table('settings').put({ key: 'sections', value: updatedSections });
  }
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

// ── Care Profiles ────────────────────────────────────────────────────────────
//
// A care profile defines what care actions are expected for a plant and when.
// Each profile has a name and a list of rules. Rules define:
//   trigger:       'season' | 'event:flowering' | 'event:sickness' | 'event:pruned'
//   triggerMonths: [1..12]  — only for 'season' trigger
//   action:        'spray' | 'prune' | 'water'
//   product:       optional string (e.g. 'rézkénes', 'fungicide')
//   purpose:       why this action is needed (shown in UI)
//   windowDays:    how many days the task stays open before expiring
//
// Built-in profiles cover common European fruit trees and vines.
// Users can add their own profiles and rules via the CRUD page (Phase 4).

const BUILTIN_PROFILES = [
  {
    key: 'apple',
    name: 'Almafa / Apple',
    description: 'Common apple tree care',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [2, 3],    action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — dormant season', windowDays: 21 },
      { trigger: 'season', triggerMonths: [10, 11],  action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — late autumn',    windowDays: 21 },
      { trigger: 'season', triggerMonths: [2, 3],    action: 'prune',  product: '',          purpose: 'Winter pruning',             windowDays: 30 },
      { trigger: 'event:flowering',                  action: 'spray',  product: 'fungicide', purpose: 'Scab prevention',            windowDays: 10 },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
  {
    key: 'peach',
    name: 'Őszibarack / Peach',
    description: 'Peach tree care — monilia sensitive',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [2, 3],    action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — dormant season', windowDays: 21 },
      { trigger: 'season', triggerMonths: [10, 11],  action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — late autumn',    windowDays: 21 },
      { trigger: 'season', triggerMonths: [2, 3],    action: 'prune',  product: '',          purpose: 'Winter pruning',             windowDays: 30 },
      { trigger: 'event:flowering',                  action: 'spray',  product: 'fungicide', purpose: 'Monilia prevention',         windowDays: 7  },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
  {
    key: 'cherry',
    name: 'Cseresznye/Meggy / Cherry',
    description: 'Sweet and sour cherry care',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [2, 3],    action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — dormant season', windowDays: 21 },
      { trigger: 'season', triggerMonths: [10, 11],  action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — late autumn',    windowDays: 21 },
      { trigger: 'season', triggerMonths: [2, 3],    action: 'prune',  product: '',          purpose: 'Winter pruning',             windowDays: 30 },
      { trigger: 'event:flowering',                  action: 'spray',  product: 'fungicide', purpose: 'Monilia prevention',         windowDays: 7  },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
  {
    key: 'pear',
    name: 'Körte / Pear',
    description: 'Pear tree care',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [2, 3],    action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — dormant season', windowDays: 21 },
      { trigger: 'season', triggerMonths: [10, 11],  action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — late autumn',    windowDays: 21 },
      { trigger: 'season', triggerMonths: [2, 3],    action: 'prune',  product: '',          purpose: 'Winter pruning',             windowDays: 30 },
      { trigger: 'event:flowering',                  action: 'spray',  product: 'fungicide', purpose: 'Fire blight prevention',     windowDays: 10 },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
  {
    key: 'grape',
    name: 'Szőlő / Grape',
    description: 'Grapevine care — mildew sensitive',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [3, 4],    action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — early spring',   windowDays: 21 },
      { trigger: 'season', triggerMonths: [10, 11],  action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — late autumn',    windowDays: 21 },
      { trigger: 'season', triggerMonths: [11, 12, 1, 2], action: 'prune', product: '',     purpose: 'Winter pruning',             windowDays: 60 },
      { trigger: 'event:flowering',                  action: 'spray',  product: 'fungicide', purpose: 'Mildew prevention',          windowDays: 10 },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
  {
    key: 'raspberry',
    name: 'Málna / Raspberry',
    description: 'Raspberry cane care',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [3],        action: 'spray',  product: 'rézkénes',  purpose: 'Fungicide — early spring',  windowDays: 14 },
      { trigger: 'season', triggerMonths: [11],        action: 'prune',  product: '',          purpose: 'Autumn cane pruning',       windowDays: 30 },
      { trigger: 'event:sickness',                    action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',         windowDays: 7  },
    ]
  },
  {
    key: 'shrub',
    name: 'Cserje / Shrub',
    description: 'General shrub care',
    isBuiltin: true,
    rules: [
      { trigger: 'season', triggerMonths: [2, 3],    action: 'prune',  product: '',          purpose: 'Spring pruning',             windowDays: 30 },
      { trigger: 'event:sickness',                   action: 'spray',  product: 'fungicide', purpose: 'Disease treatment',          windowDays: 7  },
    ]
  },
];

// Seed built-in care profiles if they don't exist yet
export async function seedCareProfiles() {
  const existing = await db.careProfiles.where('isBuiltin').equals(1).toArray();
  const existingKeys = new Set(existing.map(p => p.key));

  for (const profile of BUILTIN_PROFILES) {
    if (existingKeys.has(profile.key)) continue;
    const { rules, ...profileData } = profile;
    const profileId = await db.careProfiles.add({ ...profileData, isBuiltin: 1 });
    for (const rule of rules) {
      await db.careRules.add({ ...rule, profileId });
    }
  }
}

// ── Care Profile CRUD ────────────────────────────────────────────────────────

export async function getCareProfiles() {
  return await db.careProfiles.toArray();
}

export async function getCareProfile(id) {
  return await db.careProfiles.get(id);
}

export async function getCareRulesForProfile(profileId) {
  return await db.careRules.where('profileId').equals(profileId).toArray();
}

export async function addCareProfile(profile) {
  return await db.careProfiles.add({ ...profile, isBuiltin: 0 });
}

export async function updateCareProfile(id, changes) {
  return await db.careProfiles.update(id, changes);
}

export async function deleteCareProfile(id) {
  await db.careRules.where('profileId').equals(id).delete();
  return await db.careProfiles.delete(id);
}

export async function addCareRule(rule) {
  return await db.careRules.add(rule);
}

export async function updateCareRule(id, changes) {
  return await db.careRules.update(id, changes);
}

export async function deleteCareRule(id) {
  return await db.careRules.delete(id);
}


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
  // Older backups may carry no/invalid hex coordinates, dead section
  // references and obsolete fields — normalize before the UI reads them.
  await healImportedData();
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

// Remove plant (tree cut down etc.) — deletes its events and photos too
export async function removePlant(id) {
  const plant = await db.plants.get(id);
  if (!plant) return;
  await db.events.where('plantId').equals(id).delete();
  await db.photos.where('plantId').equals(id).delete();
  return await db.plants.delete(id);
}

// Hexagonal grid - no row/column layout helpers needed

// ── Garden Sections ─────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS = [
  { instanceId: 'section-1',  name: 'Fruit Trees',   color: '#a8d5a2' },
  { instanceId: 'section-2',  name: 'Grapevines',    color: '#9b59b6' },
  { instanceId: 'section-3',  name: 'Raspberries',   color: '#e74c3c' },
  { instanceId: 'section-4a', name: 'Raised Bed A',  color: '#8b6f47' },
  { instanceId: 'section-4b', name: 'Raised Bed B',  color: '#8b6f47' },
  { instanceId: 'section-4c', name: 'Raised Bed C',  color: '#8b6f47' },
  { instanceId: 'section-5',  name: 'Other Plants',  color: '#27ae60' },
];

export async function getSections() {
  const saved = await getSetting('sections', null);
  if (saved && Array.isArray(saved)) {
    // Clean up old fields
    const result = saved.map(s => {
      // eslint-disable-next-line no-unused-vars
      const { cols, rows, showWires, type, ...rest } = s;
      return rest;
    });
    return result;
  }
  // Migrate from old named-key layout format
  const oldLayout = await getSetting('layout', null);
  if (oldLayout && !Array.isArray(oldLayout)) {
    const migrated = [
      { instanceId: 'section-1',  name: 'Fruit Trees',   color: '#a8d5a2' },
      { instanceId: 'section-2',  name: 'Grapevines',    color: '#9b59b6' },
      { instanceId: 'section-3',  name: 'Raspberries',   color: '#e74c3c' },
      { instanceId: 'section-4a', name: 'Raised Bed A',  color: '#8b6f47' },
      { instanceId: 'section-4b', name: 'Raised Bed B',  color: '#8b6f47' },
      { instanceId: 'section-4c', name: 'Raised Bed C',  color: '#8b6f47' },
      { instanceId: 'section-5',  name: 'Other Plants',  color: '#27ae60' },
    ];
    await setSetting('sections', migrated);
    return migrated;
  }
  return JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
}

export async function saveSections(sections) {
  await setSetting('sections', sections);
}

// Hex coordinate operations
export async function updatePlantHexPosition(id, q, r) {
  return await db.plants.update(id, { q, r });
}

// Move a plant to another hex, possibly to a different section
export async function movePlantToHex(id, sectionId, q, r) {
  return await db.plants.update(id, { sectionId, q, r });
}

/**
 * Make sure every plant has usable hex coordinates (q, r).
 *  1. Plants missing q/r get a non-colliding position (rows of 6).
 *  2. Plants stacked on the same hex are spread out to the nearest free hex.
 * Idempotent — safe to call on every startup / after every import.
 * Returns true if anything was written.
 */
export async function ensureHexPositions() {
  const plants = await db.plants.toArray();
  const live = plants.filter(p => p.type !== 'placeholder');

  // working list with coordinates resolved: missing ones get
  // the first free "rows of 6" cell in their section
  const occupied = new Map(); // sectionId -> Set("q,r")
  for (const p of live) {
    if (p.q == null || p.r == null) continue;
    if (!occupied.has(p.sectionId)) occupied.set(p.sectionId, new Set());
    occupied.get(p.sectionId).add(`${p.q},${p.r}`);
  }

  const resolved = [];
  for (const p of live) {
    if (p.q == null || p.r == null) {
      if (!occupied.has(p.sectionId)) occupied.set(p.sectionId, new Set());
      const used = occupied.get(p.sectionId);
      let idx = 0, q = 0, r = 0;
      while (used.has(`${q},${r}`)) {
        q = ++idx % 6;
        r = Math.floor(idx / 6);
      }
      resolved.push({ id: p.id, sectionId: p.sectionId, q, r, moved: true });
      used.add(`${q},${r}`);
    } else {
      resolved.push({ id: p.id, sectionId: p.sectionId, q: p.q, r: p.r, moved: false });
    }
  }

  // spread out plants stacked on the same hex (keep the first, move the rest)
  const seen = new Map(); // sectionId -> Set("q,r")
  for (const p of resolved) {
    if (!seen.has(p.sectionId)) seen.set(p.sectionId, new Set());
    const used = seen.get(p.sectionId);
    const key = `${p.q},${p.r}`;
    if (!used.has(key)) {
      used.add(key);
      continue;
    }
    const free = findFreeHex(used, p.q, p.r);
    if (free) {
      p.q = free.q;
      p.r = free.r;
      p.moved = true;
      used.add(`${p.q},${p.r}`);
    }
  }

  const changed = resolved.filter(p => p.moved);
  if (!changed.length) return false;

  await Promise.all(changed.map(c =>
    db.plants.update(c.id, { q: c.q, r: c.r, sectionId: c.sectionId })
  ));
  return true;
}

/**
 * Fix imported records from older app versions:
 *  - plants referring to a section that no longer exists are moved to the first section
 *  - obsolete fields (sortOrder) are removed
 *  - hex coordinates are ensured afterwards
 * Returns true if any plant was modified (besides coordinate assignment).
 */
export async function healImportedData() {
  const sections = await getSections();
  const sectionIds = new Set(sections.map(s => s.instanceId));
  const fallbackSection = sections[0]?.instanceId ?? null;
  const plants = await db.plants.toArray();

  const updates = [];
  for (const p of plants) {
    const changes = {};
    let touched = false;
    if (p.sectionId == null || !sectionIds.has(p.sectionId)) {
      changes.sectionId = fallbackSection;
      touched = true;
    }
    if (p.sortOrder !== undefined) {
      changes.sortOrder = null;
      touched = true;
    }
    if (touched) {
      // keep an entry even for empty changes so we can strip per-plant
      updates.push({ id: p.id, changes });
    }
  }

  for (const u of updates) {
    await db.plants.update(u.id, u.changes);
  }

  await ensureHexPositions();
  return updates.length > 0;
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

// Add a real named plant to a section at the first free hex position
export async function addSectionPlant(sectionId, name, color) {
  const label = await nextLabel();
  const existing = await db.plants
    .where('sectionId').equals(sectionId)
    .filter(p => p.type !== 'placeholder')
    .toArray();
  const occupied = new Set(existing.map(p => `${p.q ?? 0},${p.r ?? 0}`));
  // row of 6, expanding outward
  let idx = 0, q = 0, r = 0;
  while (occupied.has(`${q},${r}`)) {
    q = ++idx % 6;
    r = Math.floor(idx / 6);
  }
  return await db.plants.add({
    name,
    type: 'plant',
    sectionId,
    color: color || null,
    label,
    q,
    r
  });
}

// Add plant at a specific hex position
export async function addPlantAtHex(sectionId, q, r, name = '', color = null) {
  const label = await nextLabel();
  return await db.plants.add({
    name,
    type: 'plant',
    sectionId,
    color,
    label,
    q,
    r
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
