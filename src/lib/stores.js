import { writable, derived } from 'svelte/store';
import { getAllPlants, getEventsForPlant, calculateNextSpray } from './db.js';

// Current view state
export const currentView = writable('map'); // 'map', 'detail', 'settings', 'multiEvent'
export const selectedPlantId = writable(null);
export const searchQuery = writable('');

// Plants data
export const plants = writable([]);

// Load plants from database
export async function loadPlants() {
  const data = await getAllPlants();
  plants.set(data);
}

// Selected plant details
export const selectedPlant = derived(
  [plants, selectedPlantId],
  ([$plants, $selectedPlantId]) => {
    if (!$selectedPlantId) return null;
    return $plants.find(p => p.id === $selectedPlantId) || null;
  }
);

// Plant events (needs to be loaded separately)
export const plantEvents = writable([]);
export const plantForecast = writable(null);

export async function loadPlantDetails(plantId) {
  if (!plantId) {
    plantEvents.set([]);
    plantForecast.set(null);
    return;
  }
  
  const events = await getEventsForPlant(plantId);
  plantEvents.set(events);
  
  const forecast = await calculateNextSpray(plantId);
  plantForecast.set(forecast);
}

// Search results
export const searchResults = derived(
  [plants, searchQuery],
  ([$plants, $query]) => {
    if (!$query.trim()) return [];
    const q = $query.toLowerCase().trim();
    return $plants.filter(p => 
      p.id.toString() === q ||
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  }
);

// Navigation helpers
export function navigateToMap() {
  currentView.set('map');
  selectedPlantId.set(null);
}

export function navigateToPlant(plantId) {
  selectedPlantId.set(plantId);
  loadPlantDetails(plantId);
  currentView.set('detail');
}

export function navigateToPlantDetail(plant) {
  navigateToPlant(plant.id);
}

export function navigateToSettings() {
  currentView.set('settings');
}

export function navigateToMultiEvent() {
  currentView.set('multiEvent');
}

// Toast notifications
export const toasts = writable([]);

export function showToast(message, type = 'info', duration = 3000) {
  const id = Date.now();
  toasts.update(t => [...t, { id, message, type }]);
  setTimeout(() => {
    toasts.update(t => t.filter(toast => toast.id !== id));
  }, duration);
}
