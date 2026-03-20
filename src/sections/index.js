import fruitDesc     from './fruit/descriptor.js';
import grapeDesc     from './grape/descriptor.js';
import raspberryDesc from './raspberry/descriptor.js';
import bedDesc       from './bed/descriptor.js';
import otherDesc     from './other/descriptor.js';

import FruitRenderer from './fruit/Renderer.svelte';
import GrapeRenderer from './grape/Renderer.svelte';
import BedRenderer   from './bed/Renderer.svelte';

// raspberry and other use the same plain grid renderer as fruit
const RaspberryRenderer = FruitRenderer;
const OtherRenderer     = FruitRenderer;

export const SECTION_REGISTRY = [
  { ...fruitDesc,     Renderer: FruitRenderer },
  { ...grapeDesc,     Renderer: GrapeRenderer },
  { ...raspberryDesc, Renderer: RaspberryRenderer },
  { ...bedDesc,       Renderer: BedRenderer },
  { ...otherDesc,     Renderer: OtherRenderer },
];

export const SECTION_BY_TYPE = Object.fromEntries(
  SECTION_REGISTRY.map(d => [d.type, d])
);
