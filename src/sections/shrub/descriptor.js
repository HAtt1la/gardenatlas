export default {
  type: 'shrub',
  defaultName: 'shrubFruits',
  icon: '🫐',
  cardW: 52, cardH: 60, rowGap: 10,
  hasCols: true, hasRows: false,
  defaultCols: 4, defaultRows: null,
  minCols: 1, maxCols: 6, minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  defaultSprayDays: 14,
  labels: {
    en: { section: 'Shrub Fruits', type: 'Shrub Fruit' },
    hu: { section: 'Bogyós gyümölcsök', type: 'Bogyós gyümölcs' },
  },
  emojis: ['🫐', '🍒', '🍓', '🌿', '🪴', '🌱', '🍇', '🍋'],
  colors: ['#c0392b', '#8e44ad', '#e07a8e', '#6aaa2a', '#27ae60', '#e67e22', '#2980b9', '#8b5e3c'],
};
