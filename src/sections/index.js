import fruitDesc     from './fruit/descriptor.js';
import grapeDesc     from './grape/descriptor.js';
import raspberryDesc from './raspberry/descriptor.js';
import bedDesc       from './bed/descriptor.js';
import otherDesc     from './other/descriptor.js';
import shrubDesc     from './shrub/descriptor.js';

import FruitRenderer from './fruit/Renderer.svelte';
import GrapeRenderer from './grape/Renderer.svelte';
import BedRenderer   from './bed/Renderer.svelte';

import { injectTranslations } from '../lib/i18n.js';

// raspberry, other and shrub use the same plain grid renderer as fruit
const RaspberryRenderer = FruitRenderer;
const OtherRenderer     = FruitRenderer;
const ShrubRenderer     = FruitRenderer;

export const SECTION_REGISTRY = [
  { ...fruitDesc,     Renderer: FruitRenderer },
  { ...grapeDesc,     Renderer: GrapeRenderer },
  { ...raspberryDesc, Renderer: RaspberryRenderer },
  { ...bedDesc,       Renderer: BedRenderer },
  { ...otherDesc,     Renderer: OtherRenderer },
  { ...shrubDesc,     Renderer: ShrubRenderer },
];

export const SECTION_BY_TYPE = Object.fromEntries(
  SECTION_REGISTRY.map(d => [d.type, d])
);

// Inject each descriptor's labels into the i18n translation tables.
// This runs once at module load — no manual i18n.js edits needed for new section types.
const injections = {};
for (const d of SECTION_REGISTRY) {
  for (const [lang, strings] of Object.entries(d.labels)) {
    if (!injections[lang]) injections[lang] = {};
    injections[lang][d.defaultName] = strings.section;
    injections[lang][d.type]        = strings.type;
  }
}
injectTranslations(injections);
