import { db, getAllPlants } from './db.js';

const SAMPLE_PLANTS = [
  // Fruit Trees — section-1 (6 cols)
  { id: 1,  name: 'Apple 1',     label: '1',  type: 'plant', sectionId: 'section-1', color: '#a8d5a2', notes: 'Golden Delicious' },
  { id: 2,  name: 'Apple 2',     label: '2',  type: 'plant', sectionId: 'section-1', color: '#a8d5a2', notes: 'Red Chief' },
  { id: 3,  name: 'Pear 1',      label: '3',  type: 'plant', sectionId: 'section-1', color: '#a8d5a2', notes: 'Conference' },
  { id: 4,  name: 'Pear 2',      label: '4',  type: 'plant', sectionId: 'section-1', color: '#a8d5a2', notes: 'Williams' },
  { id: 5,  name: 'Cherry',      label: '5',  type: 'plant', sectionId: 'section-1', color: '#e07a8e', notes: 'Sweet cherry' },
  { id: 6,  name: 'Plum 1',      label: '6',  type: 'plant', sectionId: 'section-1', color: '#8e44ad', notes: 'Stanley' },
  { id: 7,  name: 'Plum 2',      label: '7',  type: 'plant', sectionId: 'section-1', color: '#8e44ad', notes: 'Bluefree' },
  { id: 8,  name: 'Apricot',     label: '8',  type: 'plant', sectionId: 'section-1', color: '#e67e22', notes: 'Hungarian' },
  { id: 9,  name: 'Peach',       label: '9',  type: 'plant', sectionId: 'section-1', color: '#e67e22', notes: 'Redhaven' },
  { id: 10, name: 'Walnut',      label: '10', type: 'plant', sectionId: 'section-1', color: '#8b5e3c', notes: 'Large tree' },
  { id: 11, name: 'Quince',      label: '11', type: 'plant', sectionId: 'section-1', color: '#f0c040', notes: 'Aromatic' },
  { id: 12, name: 'Almond',      label: '12', type: 'plant', sectionId: 'section-1', color: '#8b5e3c', notes: 'Valencia' },

  // Grapevines — section-2 (5 cols × 4 rows), with wires
  { id: 20, name: 'Vine 1-1', label: '20', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 21, name: 'Vine 1-2', label: '21', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 22, name: 'Vine 1-3', label: '22', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 23, name: 'Vine 1-4', label: '23', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 24, name: 'Vine 1-5', label: '24', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 25, name: 'Vine 2-1', label: '25', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 26, name: 'Vine 2-2', label: '26', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 27, name: 'Vine 2-3', label: '27', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 28, name: 'Vine 2-4', label: '28', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 29, name: 'Vine 2-5', label: '29', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 30, name: 'Vine 3-1', label: '30', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 31, name: 'Vine 3-2', label: '31', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 32, name: 'Vine 3-3', label: '32', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 33, name: 'Vine 3-4', label: '33', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 34, name: 'Vine 3-5', label: '34', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 35, name: 'Vine 4-1', label: '35', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 36, name: 'Vine 4-2', label: '36', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },
  { id: 37, name: 'Vine 4-3', label: '37', type: 'plant', sectionId: 'section-2', color: '#c0392b' },
  { id: 38, name: 'Vine 4-4', label: '38', type: 'plant', sectionId: 'section-2', color: '#8e44ad' },
  { id: 39, name: 'Vine 4-5', label: '39', type: 'plant', sectionId: 'section-2', color: '#6aaa2a' },

  // Raspberries — section-3 (4 cols)
  { id: 40, name: 'Raspberry 1', label: '40', type: 'plant', sectionId: 'section-3', color: '#c0392b', notes: 'Autumn Bliss' },
  { id: 41, name: 'Raspberry 2', label: '41', type: 'plant', sectionId: 'section-3', color: '#c0392b', notes: 'Glen Ample' },
  { id: 42, name: 'Raspberry 3', label: '42', type: 'plant', sectionId: 'section-3', color: '#f0c040', notes: 'All Gold' },
  { id: 43, name: 'Raspberry 4', label: '43', type: 'plant', sectionId: 'section-3', color: '#e07a8e', notes: 'Polka' },

  // Raised Bed A — section-4a (3 cols × 2 rows)
  { id: 50, name: 'Tomato 1',  label: '50', type: 'plant', sectionId: 'section-4a', color: '#e74c3c', notes: 'Cherry tomato' },
  { id: 51, name: 'Tomato 2',  label: '51', type: 'plant', sectionId: 'section-4a', color: '#e74c3c', notes: 'Beefsteak' },
  { id: 52, name: 'Pepper 1',  label: '52', type: 'plant', sectionId: 'section-4a', color: '#e67e22', notes: 'Bell pepper' },
  { id: 53, name: 'Pepper 2',  label: '53', type: 'plant', sectionId: 'section-4a', color: '#e67e22', notes: 'Hot pepper' },
  { id: 54, name: 'Eggplant',  label: '54', type: 'plant', sectionId: 'section-4a', color: '#8e44ad', notes: 'Purple eggplant' },
  { id: 55, name: 'Basil',     label: '55', type: 'plant', sectionId: 'section-4a', color: '#6aaa2a', notes: 'Companion plant' },

  // Raised Bed B — section-4b (3 cols × 2 rows)
  { id: 56, name: 'Cucumber 1', label: '56', type: 'plant', sectionId: 'section-4b', color: '#27ae60', notes: 'Pickling' },
  { id: 57, name: 'Cucumber 2', label: '57', type: 'plant', sectionId: 'section-4b', color: '#27ae60', notes: 'Slicing' },
  { id: 58, name: 'Zucchini',   label: '58', type: 'plant', sectionId: 'section-4b', color: '#6aaa2a', notes: 'Green zucchini' },
  { id: 59, name: 'Dill',       label: '59', type: 'plant', sectionId: 'section-4b', color: '#a8d5a2', notes: 'Herb' },
  { id: 60, name: 'Parsley',    label: '60', type: 'plant', sectionId: 'section-4b', color: '#a8d5a2', notes: 'Herb' },
  { id: 61, name: 'Chive',      label: '61', type: 'plant', sectionId: 'section-4b', color: '#a8d5a2', notes: 'Herb' },

  // Raised Bed C — section-4c (3 cols × 2 rows)
  { id: 62, name: 'Lettuce 1',  label: '62', type: 'plant', sectionId: 'section-4c', color: '#a8d5a2', notes: 'Butterhead' },
  { id: 63, name: 'Lettuce 2',  label: '63', type: 'plant', sectionId: 'section-4c', color: '#6aaa2a', notes: 'Romaine' },
  { id: 64, name: 'Spinach',    label: '64', type: 'plant', sectionId: 'section-4c', color: '#27ae60', notes: 'Baby spinach' },
  { id: 65, name: 'Radish',     label: '65', type: 'plant', sectionId: 'section-4c', color: '#e74c3c', notes: 'Cherry Belle' },
  { id: 66, name: 'Carrot',     label: '66', type: 'plant', sectionId: 'section-4c', color: '#e67e22', notes: 'Nantes' },
  { id: 67, name: 'Beetroot',   label: '67', type: 'plant', sectionId: 'section-4c', color: '#8e44ad', notes: 'Boltardy' },

  // Other Plants — section-5 (5 cols)
  { id: 70, name: 'Lavender',  label: '70', type: 'plant', sectionId: 'section-5', color: '#8e44ad' },
  { id: 71, name: 'Rosemary',  label: '71', type: 'plant', sectionId: 'section-5', color: '#27ae60' },
  { id: 72, name: 'Mint',      label: '72', type: 'plant', sectionId: 'section-5', color: '#16a085' },
  { id: 73, name: 'Thyme',     label: '73', type: 'plant', sectionId: 'section-5', color: '#27ae60' },
  { id: 74, name: 'Sage',      label: '74', type: 'plant', sectionId: 'section-5', color: '#8e44ad' },
];

const SAMPLE_EVENTS = [
  { plantId: 1,  eventType: 'spray',   date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 2,  eventType: 'spray',   date: '2026-01-15', notes: 'Winter spray' },
  { plantId: 3,  eventType: 'spray',   date: '2026-01-20', notes: 'Dormant oil' },
  { plantId: 5,  eventType: 'spray',   date: '2025-12-20', notes: 'Overdue test' },
  { plantId: 20, eventType: 'spray',   date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 21, eventType: 'spray',   date: '2026-01-28', notes: 'Fungicide' },
  { plantId: 22, eventType: 'spray',   date: '2026-02-01', notes: 'Recent spray' },
  { plantId: 1,  eventType: 'planted', date: '2018-03-15', notes: 'Original planting' },
  { plantId: 50, eventType: 'planted', date: '2023-04-01', notes: 'Spring planting' },
  { plantId: 1,  eventType: 'pruned',  date: '2026-01-10', notes: 'Winter pruning' },
  { plantId: 20, eventType: 'pruned',  date: '2026-01-05', notes: 'Spur pruning' },
];

export async function initializeSampleData() {
  const existingPlants = await getAllPlants();
  if (existingPlants.length > 0) return;

  await db.plants.bulkAdd(SAMPLE_PLANTS);
  await db.events.bulkAdd(SAMPLE_EVENTS.map(e => ({ ...e, modifiedAt: new Date().toISOString() })));
}
