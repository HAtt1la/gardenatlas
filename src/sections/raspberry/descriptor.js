export default {
  type: 'raspberry',
  defaultName: 'raspberries',
  icon: '🫐',
  cardW: 52, cardH: 60, rowGap: 10,
  hasCols: true, hasRows: false,
  defaultCols: 4, defaultRows: null,
  minCols: 1, maxCols: 4, minRows: 1, maxRows: 8,
  isBedSection: false,
  wireColor: null,
  defaultSprayDays: 14,
  labels: {
    en: { section: 'Raspberries', type: 'Raspberry' },
    hu: { section: 'Málna', type: 'Málna' },
  },
  emojis: ['🍓', '🫐'],
  colors: ['#c0392b', '#f0c040', '#e07a8e', '#8e44ad'],
};
