import { db, getAllPlants } from './db.js';

// Sample plant data based on the architecture plan:
// - 4 grape rows × 5 grapevines = 20 grapes
// - 3 raised beds
// - 11 fruit trees

const SAMPLE_PLANTS = [
  // Fruit Trees (5 rows × 5 = 25 trees)
  // Row 1
  { id: 1, name: 'Apple 1', type: 'fruit', row: null, x: 30, y: 50, notes: 'Golden Delicious', emoji: '🍎' },
  { id: 2, name: 'Apple 2', type: 'fruit', row: null, x: 100, y: 50, notes: 'Red Chief', emoji: '🍎' },
  { id: 3, name: 'Pear 1', type: 'fruit', row: null, x: 170, y: 50, notes: 'Conference', emoji: '🍐' },
  { id: 4, name: 'Pear 2', type: 'fruit', row: null, x: 240, y: 50, notes: 'Williams', emoji: '🍐' },
  { id: 5, name: 'Cherry', type: 'fruit', row: null, x: 310, y: 50, notes: 'Sweet cherry', emoji: '🍒' },
  // Row 2
  { id: 6, name: 'Plum 1', type: 'fruit', row: null, x: 30, y: 110, notes: 'Stanley', emoji: '🍑' },
  { id: 7, name: 'Plum 2', type: 'fruit', row: null, x: 100, y: 110, notes: 'Bluefree', emoji: '🍑' },
  { id: 8, name: 'Apricot', type: 'fruit', row: null, x: 170, y: 110, notes: 'Hungarian', emoji: '🍊' },
  { id: 9, name: 'Peach', type: 'fruit', row: null, x: 240, y: 110, notes: 'Redhaven', emoji: '🍑' },
  { id: 10, name: 'Walnut', type: 'fruit', row: null, x: 310, y: 110, notes: 'Large tree', emoji: '🥜' },
  // Row 3
  { id: 11, name: 'Quince', type: 'fruit', row: null, x: 30, y: 170, notes: 'Aromatic', emoji: '🍐' },
  { id: 12, name: 'Almond', type: 'fruit', row: null, x: 100, y: 170, notes: 'Valencia', emoji: '🥜' },
  { id: 13, name: 'Fig', type: 'fruit', row: null, x: 170, y: 170, notes: 'Brown Turkey', emoji: '🫐' },
  { id: 14, name: 'Mulberry', type: 'fruit', row: null, x: 240, y: 170, notes: 'White Mulberry', emoji: '🫐' },
  { id: 15, name: 'Medlar', type: 'fruit', row: null, x: 310, y: 170, notes: 'Common Medlar', emoji: '🍊' },
  // Row 4
  { id: 16, name: 'Pomegranate', type: 'fruit', row: null, x: 30, y: 230, notes: 'Punica', emoji: '🍎' },
  { id: 17, name: 'Kiwi', type: 'fruit', row: null, x: 100, y: 230, notes: 'Hardy Kiwi', emoji: '🥝' },
  { id: 18, name: 'Elderberry', type: 'fruit', row: null, x: 170, y: 230, notes: 'Black Elder', emoji: '🫐' },
  { id: 19, name: 'Hazelnut', type: 'fruit', row: null, x: 240, y: 230, notes: 'European', emoji: '🥜' },
  { id: 20, name: 'Chestnut', type: 'fruit', row: null, x: 310, y: 230, notes: 'Sweet Chestnut', emoji: '🌰' },
  // Row 5
  { id: 21, name: 'Ash Tree', type: 'fruit', row: null, x: 30, y: 280, notes: 'Ornamental', emoji: '🌳' },
  { id: 22, name: 'Maple', type: 'fruit', row: null, x: 100, y: 280, notes: 'Sugar Maple', emoji: '🍂' },
  { id: 23, name: 'Oak', type: 'fruit', row: null, x: 170, y: 280, notes: 'White Oak', emoji: '🌳' },
  { id: 24, name: 'Birch', type: 'fruit', row: null, x: 240, y: 280, notes: 'Silver Birch', emoji: '🌳' },
  { id: 25, name: 'Hickory', type: 'fruit', row: null, x: 310, y: 280, notes: 'Shagbark', emoji: '🌳' },

  // Raised Beds (2 beds, wider)
  { id: 26, name: 'Bed A', type: 'bed', row: null, x: 120, notes: 'Tomatoes, peppers' },
  { id: 27, name: 'Bed B', type: 'bed', row: null, x: 280, notes: 'Cucumbers, zucchini, herbs' },

  // Grapevines (4 rows × 5 = 20 vines)
  // Row 1
  { id: 28, name: 'Vine 1-1', type: 'grape', row: 1, x: 50, notes: null },
  { id: 29, name: 'Vine 1-2', type: 'grape', row: 1, x: 125, notes: null },
  { id: 30, name: 'Vine 1-3', type: 'grape', row: 1, x: 200, notes: null },
  { id: 31, name: 'Vine 1-4', type: 'grape', row: 1, x: 275, notes: null },
  { id: 32, name: 'Vine 1-5', type: 'grape', row: 1, x: 350, notes: null },
  // Row 2
  { id: 33, name: 'Vine 2-1', type: 'grape', row: 2, x: 50, notes: null },
  { id: 34, name: 'Vine 2-2', type: 'grape', row: 2, x: 125, notes: null },
  { id: 35, name: 'Vine 2-3', type: 'grape', row: 2, x: 200, notes: null },
  { id: 36, name: 'Vine 2-4', type: 'grape', row: 2, x: 275, notes: null },
  { id: 37, name: 'Vine 2-5', type: 'grape', row: 2, x: 350, notes: null },
  // Row 3
  { id: 38, name: 'Vine 3-1', type: 'grape', row: 3, x: 50, notes: null },
  { id: 39, name: 'Vine 3-2', type: 'grape', row: 3, x: 125, notes: null },
  { id: 40, name: 'Vine 3-3', type: 'grape', row: 3, x: 200, notes: null },
  { id: 41, name: 'Vine 3-4', type: 'grape', row: 3, x: 275, notes: null },
  { id: 42, name: 'Vine 3-5', type: 'grape', row: 3, x: 350, notes: null },
  // Row 4
  { id: 43, name: 'Vine 4-1', type: 'grape', row: 4, x: 50, notes: null },
  { id: 44, name: 'Vine 4-2', type: 'grape', row: 4, x: 125, notes: null },
  { id: 45, name: 'Vine 4-3', type: 'grape', row: 4, x: 200, notes: null },
  { id: 46, name: 'Vine 4-4', type: 'grape', row: 4, x: 275, notes: null },
  { id: 47, name: 'Vine 4-5', type: 'grape', row: 4, x: 350, notes: null },
];

// Sample events for demonstration
const SAMPLE_EVENTS = [
  // Some spray events
  { plantId: 1, eventType: 'spray', date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 2, eventType: 'spray', date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 3, eventType: 'spray', date: '2026-01-20', notes: 'Dormant oil' },
  { plantId: 5, eventType: 'spray', date: '2025-12-20', notes: 'Overdue test' },
  
  // Grape sprays
  { plantId: 28, eventType: 'spray', date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 29, eventType: 'spray', date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 30, eventType: 'spray', date: '2026-02-01', notes: 'Recent spray' },
  
  // Planting events
  { plantId: 1, eventType: 'planted', date: '2018-03-15', notes: 'Original planting' },
  { plantId: 26, eventType: 'planted', date: '2023-04-01', notes: 'Built raised bed A' },
  
  // Pruning
  { plantId: 1, eventType: 'pruned', date: '2026-01-10', notes: 'Winter pruning' },
  { plantId: 28, eventType: 'pruned', date: '2026-01-05', notes: 'Spur pruning' },
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
