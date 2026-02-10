import { writable, derived } from 'svelte/store';

// Language preference store
const storedLang = localStorage.getItem('language') || 'en';
export const currentLanguage = writable(storedLang);

// Save language preference
currentLanguage.subscribe(lang => {
  localStorage.setItem('language', lang);
});

// Translations
const translations = {
  en: {
    // App
    appName: 'GardenAtlas',
    backToMap: 'Back to map',
    settings: 'Settings',
    
    // Garden Map
    fruitTrees: 'Fruit Trees',
    raisedBeds: 'Raised Beds',
    grapevines: 'Grapevines',
    herbsFlowers: 'Herbs & Flowers',
    addNewPlant: 'Add New Plant',
    
    // Status
    ok: 'OK',
    soon: 'Soon',
    overdue: 'Overdue',
    noData: 'No data',
    
    // Plant Detail
    plantDetails: 'Plant Details',
    id: 'ID',
    name: 'Name',
    type: 'Type',
    row: 'Row',
    notes: 'Notes',
    nextSpray: 'Next Spray',
    lastSpray: 'Last Spray',
    daysSince: 'Days since last spray',
    daysUntil: 'Days until next spray',
    events: 'Events',
    addEvent: 'Add Event',
    noEvents: 'No events recorded yet',
    noNotesRecorded: 'No notes recorded',
    
    // Plant types
    fruit: 'Fruit Tree',
    grape: 'Grapevine',
    bed: 'Raised Bed',
    other: 'Other Plant',
    
    // Add Plant Form
    plantName: 'Plant Name',
    enterPlantName: 'Enter plant name...',
    chooseEmoji: 'Choose Icon',
    preview: 'Preview',
    addPlant: 'Add Plant',
    plantNameRequired: 'Plant name is required',
    plantAdded: 'Plant added successfully',
    addPlantFailed: 'Failed to add plant',
    
    // Event types
    spray: 'Sprayed',
    pruned: 'Pruned',
    planted: 'Planted',
    flowering: 'Flowering',
    sickness: 'Sickness/Pest',
    harvested: 'Harvested',
    watered: 'Watered',
    crop: 'Crop Recorded',
    otherEvent: 'Other',
    
    // Event Form
    eventType: 'Event Type',
    date: 'Date',
    eventNotes: 'Notes',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    
    // Search
    searchPlaceholder: 'Search by ID, name, or type...',
    
    // Settings
    settingsTitle: 'Settings',
    language: 'Language',
    english: 'English',
    hungarian: 'Hungarian',
    sprayIntervals: 'Spray Intervals',
    sprayIntervalsDesc: 'Number of days between sprays for each plant type',
    fruitTreeInterval: 'Fruit Trees',
    grapeInterval: 'Grapevines',
    bedInterval: 'Raised Beds',
    days: 'days',
    saveSettings: 'Save Settings',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    exportDataDesc: 'Download all plants and events as JSON file',
    exportButton: 'Export',
    exporting: 'Exporting...',
    importData: 'Import Data',
    importDataDesc: 'Replace all data from a backup file',
    importButton: 'Import',
    importing: 'Importing...',
    clearAllData: 'Clear All Data',
    clearAllDataDesc: 'Delete all plants and events (cannot be undone)',
    clearButton: 'Clear All',
    aboutApp: 'About GardenAtlas',
    aboutDesc: 'GardenAtlas is a progressive web app for managing your garden. Track plants, record events, and get spray reminders.',
    version: 'Version',
    
    // Toast messages
    settingsSaved: 'Settings saved',
    dataExported: 'Data exported successfully',
    exportFailed: 'Export failed',
    dataImported: 'Data imported successfully',
    importFailed: 'Import failed',
    allDataCleared: 'All data cleared',
    clearFailed: 'Failed to clear data',
    eventSaved: 'Event saved',
    eventDeleted: 'Event deleted',
    
    // Photos
    photos: 'Photos',
    addPhoto: 'Add Photo',
    selectPhoto: 'Select Photo',
    deletePhoto: 'Delete Photo',
    setAsMain: 'Set as main',
    mainPhoto: 'Main Photo',
    photoAdded: 'Photo added',
    photoDeleted: 'Photo deleted',
    photoSetAsMain: 'Photo set as main',
    maxPhotosReached: 'Maximum 3 photos allowed',
    noPhotos: 'No photos yet',
    tapToSelectMain: 'Tap a photo to set as main',
    confirmDeletePhoto: 'Delete this photo?',
    
    // Confirmations
    confirmClearAll: 'Are you sure you want to delete ALL data? This cannot be undone.',
    confirmClearAllSecond: 'Really delete everything?',
    confirmImport: 'This will replace all current data with {plants} plants and {events} events. Continue?',
  },
  
  hu: {
    // App
    appName: 'KertAtlasz',
    backToMap: 'Vissza a térképhez',
    settings: 'Beállítások',
    
    // Garden Map
    fruitTrees: 'Gyümölcsfák',
    raisedBeds: 'Magaságyások',
    grapevines: 'Szőlőtőke',
    herbsFlowers: 'Gyógynövények és virágok',
    addNewPlant: 'Új növény hozzáadása',
    
    // Status
    ok: 'Rendben',
    soon: 'Hamarosan',
    overdue: 'Lejárt',
    noData: 'Nincs adat',
    
    // Plant Detail
    plantDetails: 'Növény részletei',
    id: 'Azonosító',
    name: 'Név',
    type: 'Típus',
    row: 'Sor',
    notes: 'Jegyzetek',
    nextSpray: 'Következő permetezés',
    lastSpray: 'Utolsó permetezés',
    daysSince: 'Napok az utolsó permetezés óta',
    daysUntil: 'Napok a következő permetezésig',
    events: 'Események',
    addEvent: 'Esemény hozzáadása',
    noEvents: 'Még nincsenek rögzített események',
    noNotesRecorded: 'Nincsenek jegyzetek',
    
    // Plant types
    fruit: 'Gyümölcsfa',
    grape: 'Szőlőtő',
    bed: 'Magaságyás',
    other: 'Egyéb növény',
    
    // Add Plant Form
    plantName: 'Növény neve',
    enterPlantName: 'Írd be a növény nevét...',
    chooseEmoji: 'Válassz ikont',
    preview: 'Előnézet',
    addPlant: 'Növény hozzáadása',
    plantNameRequired: 'A növény neve kötelező',
    plantAdded: 'Növény sikeresen hozzáadva',
    addPlantFailed: 'Nem sikerült hozzáadni a növényt',
    
    // Event types
    spray: 'Permetezés',
    pruned: 'Metszés',
    planted: 'Ültetés',
    flowering: 'Virágzás',
    sickness: 'Betegség/Kártevő',
    harvested: 'Betakarítás',
    watered: 'Öntözés',
    crop: 'Termés rögzítve',
    otherEvent: 'Egyéb',
    
    // Event Form
    eventType: 'Esemény típusa',
    date: 'Dátum',
    eventNotes: 'Jegyzetek',
    cancel: 'Mégse',
    save: 'Mentés',
    delete: 'Törlés',
    
    // Search
    searchPlaceholder: 'Keresés azonosító, név vagy típus alapján...',
    
    // Settings
    settingsTitle: 'Beállítások',
    language: 'Nyelv',
    english: 'Angol',
    hungarian: 'Magyar',
    sprayIntervals: 'Permetezési intervallumok',
    sprayIntervalsDesc: 'Napok száma a permetezések között minden növénytípusnál',
    fruitTreeInterval: 'Gyümölcsfák',
    grapeInterval: 'Szőlőtők',
    bedInterval: 'Magaságyások',
    days: 'nap',
    saveSettings: 'Beállítások mentése',
    dataManagement: 'Adatkezelés',
    exportData: 'Adatok exportálása',
    exportDataDesc: 'Összes növény és esemény letöltése JSON fájlba',
    exportButton: 'Exportálás',
    exporting: 'Exportálás...',
    importData: 'Adatok importálása',
    importDataDesc: 'Összes adat cseréje egy mentési fájlból',
    importButton: 'Importálás',
    importing: 'Importálás...',
    clearAllData: 'Összes adat törlése',
    clearAllDataDesc: 'Összes növény és esemény törlése (nem visszavonható)',
    clearButton: 'Összes törlése',
    aboutApp: 'A KertAtlasz névjegye',
    aboutDesc: 'A KertAtlasz egy progresszív webalkalmazás a kerted kezeléséhez. Kövesd nyomon a növényeket, rögzíts eseményeket és kapj permetezési emlékeztetőket.',
    version: 'Verzió',
    
    // Toast messages
    settingsSaved: 'Beállítások mentve',
    dataExported: 'Adatok sikeresen exportálva',
    exportFailed: 'Exportálás sikertelen',
    dataImported: 'Adatok sikeresen importálva',
    importFailed: 'Importálás sikertelen',
    allDataCleared: 'Összes adat törölve',
    clearFailed: 'Törlés sikertelen',
    eventSaved: 'Esemény mentve',
    eventDeleted: 'Esemény törölve',
    
    // Photos
    photos: 'Fotók',
    addPhoto: 'Fotó hozzáadása',
    selectPhoto: 'Fotó kiválasztása',
    deletePhoto: 'Fotó törlése',
    setAsMain: 'Beállítás főképként',
    mainPhoto: 'Főkép',
    photoAdded: 'Fotó hozzáadva',
    photoDeleted: 'Fotó törölve',
    photoSetAsMain: 'Fotó beállítva főképként',
    maxPhotosReached: 'Maximum 3 fotó engedélyezett',
    noPhotos: 'Még nincsenek fotók',
    tapToSelectMain: 'Koppints egy fotóra a főképnek',
    confirmDeletePhoto: 'Törlöd ezt a fotót?',
    
    // Confirmations
    confirmClearAll: 'Biztosan törölni szeretnéd az ÖSSZES adatot? Ez nem visszavonható.',
    confirmClearAllSecond: 'Tényleg mindent törölsz?',
    confirmImport: 'Ez lecseréli az összes jelenlegi adatot {plants} növényre és {events} eseményre. Folytatod?',
  }
};

// Derived store that returns the current translation function
export const t = derived(currentLanguage, ($currentLanguage) => {
  return (key) => {
    return translations[$currentLanguage]?.[key] || translations['en'][key] || key;
  };
});

// Helper function to change language
export function setLanguage(lang) {
  currentLanguage.set(lang);
}
