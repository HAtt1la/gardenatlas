export default {
  type: 'fruit',
  defaultName: 'fruitTrees',
  icon: '🌳',
  cardW: 44, cardH: 60, rowGap: 10,
  hasCols: true, hasRows: false,
  defaultCols: 6, defaultRows: null,
  minCols: 1, maxCols: 8, minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  defaultSprayDays: 21,
  labels: {
    en: { section: 'Fruit Trees', type: 'Fruit Tree' },
    hu: { section: 'Gyümölcsfák', type: 'Gyümölcsfa' },
  },
  emojis: ['🌳', '🍎', '🍐', '🍊', '🍋', '🍒', '🍑', '🥭', '🍌', '🍇', '🫐', '🥝', '🌰', '🥜', '🍂'],
  colors: ['#c0392b', '#e67e22', '#f0c040', '#6aaa2a', '#27ae60', '#8b5e3c', '#7f8c8d', '#d4c46e'],
};
