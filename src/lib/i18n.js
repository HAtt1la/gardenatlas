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
    eventHistory: 'Event History',
    nextSpray: 'Next Spray',
    lastSpray: 'Last Spray',
    neverSprayed: 'Never sprayed',
    daysOverdue: 'days overdue',
    today: 'Today',
    inDays: 'In {days} days',
    noNotesYet: 'No notes yet. Click the edit button above to add notes.',
    daysSince: 'Days since last spray',
    daysUntil: 'Days until next spray',
    events: 'Events',
    addEvent: 'Add Event',
    noEvents: 'No events recorded yet',
    noNotesRecorded: 'No notes recorded',
    
    // Bed Detail
    bedLayout: 'Bed Layout (Top View)',
    bedNotes: 'Bed Notes',
    addPlantToBed: 'Add Plant to Bed',
    bedFull: 'Bed Full',
    treeIcon: 'Tree Icon',
    vineColor: 'Vine Color',
    plantColor: 'Plant Color',
    amount: 'Amount',
    exampleBedPlants: 'e.g., Tomato, Basil, Pepper...',
    exampleOtherPlants: 'e.g., Rose, Lavender...',
    
    // Plant types — injected from section descriptors at runtime
    // (fruit, grape, raspberry, bed, other, shrub, etc.)

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

    // Backup banner
    backupBannerText: 'No backup in 7 days - download one now?',
    backupBannerDownload: 'Download backup',
    backupBannerLater: 'Later',

    // Garden Layout
    gardenLayout: 'Garden Layout',
    gardenLayoutDesc: 'Customize columns and rows for each section',
    fruitTreeCols: 'Fruit tree columns',
    grapevineCols: 'Grapevine columns',
    grapevineRows: 'Grapevine rows',
    herbCols: 'Herb & flower columns',
    saveLayout: 'Save Layout',
    layoutSaved: 'Layout saved',
    addBlankSlot: 'Add blank slot',
    convertPlaceholder: 'Identify this plant',
    placeholderLabel: '?',
    markAsRemoved: 'Mark as removed',
    markAsRemovedConfirm: 'Convert this plant to an empty slot? All its events and photos will be deleted.',
    markedAsRemoved: 'Plant converted to empty slot',
    layoutColsBlocked: 'Cannot decrease columns: {n} plant(s) must be converted to empty slots first.',
    layoutRowsBlocked: 'Cannot decrease rows: {n} plant(s) must be converted to empty slots first.',

    // Section manager
    sectionManager: 'Garden Sections',
    sectionManagerDesc: 'Add, remove and reorder sections',
    addSection: 'Add section',
    sectionName: 'Section name',
    removeSectionConfirm: 'Remove this section? Plants in it will NOT be deleted.',
    sectionRemoved: 'Section removed',
    sectionAdded: 'Section added',
    sectionSaved: 'Section saved',
    sectionsReordered: 'Order saved',
    addSlot: 'Add empty slot',
    editSection: 'Edit section',
    colsLabel: 'Columns',
    rowsLabel: 'Rows',

    // Todo list
    todoTab: 'Tasks',
    eventTab: 'Events',
    todoTitle: 'Garden Tasks',
    addTodo: 'Add task',
    todoPlaceholder: 'New task...',
    todoOpen: 'To do',
    todoDone: 'Done',
    todoMarkDone: 'Done',
    todoReopen: 'Reopen',
    todoDelete: 'Delete',
    todoDoneDate: 'Completed on',
    todoAddedDate: 'Added',
    todoBlockedBy: 'Waiting for',
    todoBlocks: 'Unblocks',
    todoAddPrereq: 'Add prerequisite',
    todoRemovePrereq: 'Remove',
    todoNone: 'No tasks yet. Add your first garden task above.',
    todoDoneNone: 'No completed tasks.',
    todoBlocked: 'Waiting',
    todoUnblocks: 'unblocks {n}',
    todoEditDoneDate: 'Edit completion date',
  },
  
  hu: {
    // App
    appName: 'KertAtlasz',
    backToMap: 'Vissza a térképhez',
    settings: 'Beállítások',
    
    // Garden Map
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
    eventHistory: 'Eseménytörténet',
    nextSpray: 'Következő permetezés',
    lastSpray: 'Utolsó permetezés',
    neverSprayed: 'Soha nem permetezve',
    daysOverdue: 'nap késett',
    today: 'Ma',
    inDays: '{days} nap múlva',
    noNotesYet: 'Még nincsenek jegyzetek. Kattints a fenti szerkesztés gombra a jegyzetekhez.',
    daysSince: 'Napok az utolsó permetezés óta',
    daysUntil: 'Napok a következő permetezésig',
    events: 'Események',
    addEvent: 'Esemény hozzáadása',
    noEvents: 'Még nincsenek rögzített események',
    noNotesRecorded: 'Nincsenek jegyzet',
    
    // Bed Detail
    bedLayout: 'Ágy elrendezése (felülnézet)',
    bedNotes: 'Ágy jegyzetei',
    addPlantToBed: 'Növény hozzáadása az ágyhoz',
    bedFull: 'Ágy megtelt',
    treeIcon: 'Fa ikon',
    vineColor: 'Szőlő szín',
    plantColor: 'Növény szín',
    amount: 'Mennyiség',
    exampleBedPlants: 'pl. Paradicsom, Bazsalikom, Paprika...',
    exampleOtherPlants: 'pl. Rózsa, Levanda...',
    
    // Plant types — injected from section descriptors at runtime
    // (fruit, grape, raspberry, bed, other, shrub, etc.)

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

    // Backup banner
    backupBannerText: '7 napja nem volt mentés - letöltöd most?',
    backupBannerDownload: 'Mentés letöltése',
    backupBannerLater: 'Később',

    // Garden Layout
    gardenLayout: 'Kert elrendezése',
    gardenLayoutDesc: 'Oszlopok és sorok testreszabása minden szakaszhoz',
    fruitTreeCols: 'Gyümölcsfa oszlopok',
    grapevineCols: 'Szőlő oszlopok',
    grapevineRows: 'Szőlő sorok',
    herbCols: 'Gyógynövény oszlopok',
    saveLayout: 'Elrendezés mentése',
    layoutSaved: 'Elrendezés elmentve',
    addBlankSlot: 'Üres hely hozzáadása',
    convertPlaceholder: 'Növény azonosítása',
    placeholderLabel: '?',
    markAsRemoved: 'Megjelölés eltávolítottként',
    markAsRemovedConfirm: 'Üres hellyé alakítod ezt a növényt? Minden esemény és fotó törlődik.',
    markedAsRemoved: 'Növény üres hellyé alakítva',
    layoutColsBlocked: 'Nem lehet csökkenteni az oszlopokat: {n} növényt előbb üres hellyé kell alakítani.',
    layoutRowsBlocked: 'Nem lehet csökkenteni a sorokat: {n} növényt előbb üres hellyé kell alakítani.',

    // Section manager
    sectionManager: 'Kert részlegek',
    sectionManagerDesc: 'Részlegek hozzáadása, eltávolítása és sorrendezése',
    addSection: 'Részleg hozzáadása',
    sectionName: 'Részleg neve',
    removeSectionConfirm: 'Eltávolítod ezt a részleget? A növények NEM törlődnek.',
    sectionRemoved: 'Részleg eltávolítva',
    sectionAdded: 'Részleg hozzáadva',
    sectionSaved: 'Részleg mentve',
    sectionsReordered: 'Sorrend mentve',
    addSlot: 'Üres hely hozzáadása',
    editSection: 'Részleg szerkesztése',
    colsLabel: 'Oszlopok',
    rowsLabel: 'Sorok',

    // Todo list
    todoTab: 'Feladatok',
    eventTab: 'Események',
    todoTitle: 'Kerti feladatok',
    addTodo: 'Feladat hozzáadása',
    todoPlaceholder: 'Új feladat...',
    todoOpen: 'Elvégzendő',
    todoDone: 'Kész',
    todoMarkDone: 'Kész',
    todoReopen: 'Újranyit',
    todoDelete: 'Törlés',
    todoDoneDate: 'Elvégezve',
    todoAddedDate: 'Hozzáadva',
    todoBlockedBy: 'Vár erre',
    todoBlocks: 'Feloldja',
    todoAddPrereq: 'Előfeltétel hozzáadása',
    todoRemovePrereq: 'Eltávolítás',
    todoNone: 'Még nincsenek feladatok. Add hozzá az első kerti teendőt!',
    todoDoneNone: 'Nincsenek befejezett feladatok.',
    todoBlocked: 'Várakozik',
    todoUnblocks: '{n} feladatot old fel',
    todoEditDoneDate: 'Befejezés dátumának szerkesztése',
  }
};

// Derived store that returns the current translation function
export const t = derived(currentLanguage, ($currentLanguage) => {
  return (key, params = {}) => {
    let translation = translations[$currentLanguage]?.[key] || translations['en'][key] || key;
    
    // Replace parameters in the translation string
    if (params && typeof translation === 'string') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, paramValue);
      });
    }
    
    return translation;
  };
});

// Helper function to change language
export function setLanguage(lang) {
  currentLanguage.set(lang);
}

// Called by src/sections/index.js at module load to inject section-owned keys
export function injectTranslations(map) {
  for (const [lang, keys] of Object.entries(map)) {
    if (translations[lang]) Object.assign(translations[lang], keys);
  }
}
