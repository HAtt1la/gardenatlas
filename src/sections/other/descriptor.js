export default {
  type: 'other',
  defaultName: 'otherPlants',
  icon: '🌿',
  cardW: 44, cardH: 60, rowGap: 10,
  hasCols: true, hasRows: false,
  defaultCols: 5, defaultRows: null,
  minCols: 1, maxCols: 8, minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  defaultSprayDays: null,
  labels: {
    en: { section: 'Other', type: 'Other Plant', herbsFlowers: 'Other' },
    hu: { section: 'Vegyes', type: 'Egyéb növény', herbsFlowers: 'Vegyes' },
  },
  emojis: [
    // herbs & aromatics
    '🌿', '🌱', '🌾', '🎍', '☘️', '🍃', '🧄', '🧅',
    // vegetables
    '🥕', '🥔', '🥒', '🌽', '🥦', '🥬', '🫛', '🧆',
    '🌶️', '🫑', '🍅', '🍆', '🧅', '🫚',
    // flowers
    '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🏵️', '🥀', '💐',
    // trees & shrubs
    '🌲', '🌳', '🌴', '🪴', '🪨',
    // fruits & berries (catch-all)
    '🍓', '🫐', '🍒', '🍑', '🍋', '🍊',
    // other
    '🍄', '🪸', '🌵',
  ],
  colors: [
    '#27ae60', '#6aaa2a', '#16a085', '#1abc9c',
    '#f0c040', '#e67e22', '#d35400',
    '#c0392b', '#e07a8e', '#ff6b9d',
    '#8e44ad', '#9b59b6',
    '#2980b9', '#3498db',
    '#8b5e3c', '#a07040',
    '#7f8c8d', '#95a5a6',
  ],
};
