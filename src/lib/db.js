import Dexie from 'dexie';

// Create database
export const db = new Dexie('GardenAtlasDB');

// Define schema
db.version(1).stores({
  plants: '++id, name, type, row, x, y',
  events: '++id, plantId, eventType, date, modifiedAt',
  settings: 'key'
});

// Version 2: Add emoji field for plants
db.version(2).stores({
  plants: '++id, name, type, row, x, y, emoji',
  events: '++id, plantId, eventType, date, modifiedAt',
  settings: 'key'
});

// Version 3: Add bedId field for plants in beds
db.version(3).stores({
  plants: '++id, name, type, row, x, y, emoji, bedId',
  events: '++id, plantId, eventType, date, modifiedAt',
  settings: 'key'
});

// Version 4: Add photos table for plant photo attachments
db.version(4).stores({
  plants: '++id, name, type, row, x, y, emoji, bedId',
  events: '++id, plantId, eventType, date, modifiedAt',
  settings: 'key',
  photos: '++id, plantId, isMain'
});

// Version 5: Add composite index for events
db.version(5).stores({
  plants: '++id, name, type, row, x, y, emoji, bedId',
  events: '++id, [plantId+eventType], plantId, eventType, date, modifiedAt',
  settings: 'key',
  photos: '++id, plantId, isMain'
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

// Plant types
export const PLANT_TYPES = [
  { id: 'grape', label: 'Grape', icon: '🍇' },
  { id: 'fruit', label: 'Fruit Tree', icon: '🌳' },
  { id: 'bed', label: 'Raised Bed', icon: '🥬' },
  { id: 'other', label: 'Other', icon: '🌿' }
];

// Default spray intervals (in days)
export const DEFAULT_INTERVALS = {
  grape: { spray: 14 },
  fruit: { spray: 21 },
  bed: { spray: null },
  other: { spray: null }
};

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
  
  const intervals = await getSetting('sprayIntervals', DEFAULT_INTERVALS);
  const interval = intervals[plant.type]?.spray;
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

// CRUD Operations for Bed Plants
export async function getPlantsInBed(bedId) {
  return await db.plants.where('bedId').equals(bedId).toArray();
}

export async function addPlantToBed(bedId, plant) {
  return await db.plants.add({
    ...plant,
    bedId,
    type: 'bed-plant',
    row: null,
    x: null,
    y: null
  });
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
