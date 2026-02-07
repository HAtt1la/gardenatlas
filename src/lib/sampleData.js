import { db, getAllPlants } from './db.js';

// Sample plant data based on the architecture plan:
// - 4 grape rows × 5 grapevines = 20 grapes
// - 3 raised beds
// - 11 fruit trees

const SAMPLE_PLANTS = [
  // Fruit Trees (11 trees)
  { id: 1, name: 'Apple 1', type: 'fruit', row: null, x: 30, y: 70, notes: 'Golden Delicious' },
  { id: 2, name: 'Apple 2', type: 'fruit', row: null, x: 65, y: 70, notes: 'Red Chief' },
  { id: 3, name: 'Pear 1', type: 'fruit', row: null, x: 100, y: 70, notes: 'Conference' },
  { id: 4, name: 'Pear 2', type: 'fruit', row: null, x: 135, y: 70, notes: 'Williams' },
  { id: 5, name: 'Cherry', type: 'fruit', row: null, x: 170, y: 70, notes: 'Sweet cherry' },
  { id: 6, name: 'Plum 1', type: 'fruit', row: null, x: 205, y: 70, notes: 'Stanley' },
  { id: 7, name: 'Plum 2', type: 'fruit', row: null, x: 240, y: 70, notes: 'Bluefree' },
  { id: 8, name: 'Apricot', type: 'fruit', row: null, x: 275, y: 70, notes: 'Hungarian' },
  { id: 9, name: 'Peach', type: 'fruit', row: null, x: 310, y: 70, notes: 'Redhaven' },
  { id: 10, name: 'Walnut', type: 'fruit', row: null, x: 345, y: 70, notes: 'Large tree' },
  { id: 11, name: 'Quince', type: 'fruit', row: null, x: 380, y: 70, notes: 'Aromatic' },

  // Raised Beds (3 beds)
  { id: 12, name: 'Bed A', type: 'bed', row: null, x: 80, y: 220, notes: 'Tomatoes, peppers' },
  { id: 13, name: 'Bed B', type: 'bed', row: null, x: 200, y: 220, notes: 'Cucumbers, zucchini' },
  { id: 14, name: 'Bed C', type: 'bed', row: null, x: 320, y: 220, notes: 'Herbs and greens' },

  // Grapevines (4 rows × 5 = 20 vines)
  // Row 1
  { id: 15, name: 'Vine 1-1', type: 'grape', row: 1, x: 50, y: 345, notes: null },
  { id: 16, name: 'Vine 1-2', type: 'grape', row: 1, x: 125, y: 345, notes: null },
  { id: 17, name: 'Vine 1-3', type: 'grape', row: 1, x: 200, y: 345, notes: null },
  { id: 18, name: 'Vine 1-4', type: 'grape', row: 1, x: 275, y: 345, notes: null },
  { id: 19, name: 'Vine 1-5', type: 'grape', row: 1, x: 350, y: 345, notes: null },
  // Row 2
  { id: 20, name: 'Vine 2-1', type: 'grape', row: 2, x: 50, y: 380, notes: null },
  { id: 21, name: 'Vine 2-2', type: 'grape', row: 2, x: 125, y: 380, notes: null },
  { id: 22, name: 'Vine 2-3', type: 'grape', row: 2, x: 200, y: 380, notes: null },
  { id: 23, name: 'Vine 2-4', type: 'grape', row: 2, x: 275, y: 380, notes: null },
  { id: 24, name: 'Vine 2-5', type: 'grape', row: 2, x: 350, y: 380, notes: null },
  // Row 3
  { id: 25, name: 'Vine 3-1', type: 'grape', row: 3, x: 50, y: 415, notes: null },
  { id: 26, name: 'Vine 3-2', type: 'grape', row: 3, x: 125, y: 415, notes: null },
  { id: 27, name: 'Vine 3-3', type: 'grape', row: 3, x: 200, y: 415, notes: null },
  { id: 28, name: 'Vine 3-4', type: 'grape', row: 3, x: 275, y: 415, notes: null },
  { id: 29, name: 'Vine 3-5', type: 'grape', row: 3, x: 350, y: 415, notes: null },
  // Row 4
  { id: 30, name: 'Vine 4-1', type: 'grape', row: 4, x: 50, y: 450, notes: null },
  { id: 31, name: 'Vine 4-2', type: 'grape', row: 4, x: 125, y: 450, notes: null },
  { id: 32, name: 'Vine 4-3', type: 'grape', row: 4, x: 200, y: 450, notes: null },
  { id: 33, name: 'Vine 4-4', type: 'grape', row: 4, x: 275, y: 450, notes: null },
  { id: 34, name: 'Vine 4-5', type: 'grape', row: 4, x: 350, y: 450, notes: null },
];

// Sample events for demonstration
const SAMPLE_EVENTS = [
  // Some spray events
  { plantId: 1, eventType: 'spray', date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 2, eventType: 'spray', date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 3, eventType: 'spray', date: '2026-01-20', notes: 'Dormant oil' },
  { plantId: 5, eventType: 'spray', date: '2025-12-20', notes: 'Overdue test' },
  
  // Grape sprays
  { plantId: 15, eventType: 'spray', date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 16, eventType: 'spray', date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 17, eventType: 'spray', date: '2026-02-01', notes: 'Recent spray' },
  
  // Planting events
  { plantId: 1, eventType: 'planted', date: '2018-03-15', notes: 'Original planting' },
  { plantId: 12, eventType: 'planted', date: '2023-04-01', notes: 'Built raised bed' },
  
  // Pruning
  { plantId: 1, eventType: 'pruned', date: '2026-01-10', notes: 'Winter pruning' },
  { plantId: 15, eventType: 'pruned', date: '2026-01-05', notes: 'Spur pruning' },
];

export async function initializeSampleData() {
  // Check if data already exists
  const existingPlants = await getAllPlants();
  if (existingPlants.length > 0) {
    console.log('Database already has data, skipping initialization');
    return;
  }

  console.log('Initializing sample data...');
  
  // Add plants
  await db.plants.bulkAdd(SAMPLE_PLANTS);
  
  // Add events with timestamps
  const eventsWithTimestamps = SAMPLE_EVENTS.map(event => ({
    ...event,
    modifiedAt: new Date().toISOString()
  }));
  await db.events.bulkAdd(eventsWithTimestamps);

  console.log(`Initialized with ${SAMPLE_PLANTS.length} plants and ${SAMPLE_EVENTS.length} events`);
}
