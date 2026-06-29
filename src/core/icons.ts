import { DEFAULT_ICON_TEMPLATE } from './constants';
import { normalizeMaterial } from './util';

export function materialToTextureId(material: unknown): string {
  return normalizeMaterial(material, '')
    .toLowerCase()
    .replace(/^minecraft:/, '')
    .replace(/_wall$/, '')
    .replace(/_item$/, '');
}

/**
 * Variant blocks have no flat `block/{id}.png` texture; they are rendered from
 * directional faces. The suffixes are listed in the order we want to try them,
 * so the most representative face (usually the front or top) comes first.
 */
const VARIANT_BLOCK_FACES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  grass_block: ['top', 'side'],
  furnace: ['front', 'side', 'top'],
  blast_furnace: ['front', 'side', 'top'],
  smoker: ['front', 'side', 'top'],
  crafting_table: ['top', 'front', 'side'],
  loom: ['front', 'side', 'top'],
  barrel: ['top', 'side', 'bottom'],
  composter: ['top', 'side'],
  jukebox: ['top', 'side'],
  lectern: ['front', 'sides', 'top'],
  cauldron: ['top', 'side'],
});

/**
 * Entity-rendered materials have no flat block texture at all. They are drawn
 * from a model + entity texture, so we curate a reasonable still texture from
 * the `entity/` tree. Each entry is a `[folder, id]` candidate pair.
 */
const ENTITY_TEXTURES: Readonly<Record<string, readonly [string, string]>> = Object.freeze({
  chest: ['entity/chest', 'normal'],
  trapped_chest: ['entity/chest', 'trapped'],
  ender_chest: ['entity/chest', 'ender'],
  creeper_head: ['entity/creeper', 'creeper'],
  zombie_head: ['entity/zombie', 'zombie'],
  skeleton_skull: ['entity/skeleton', 'skeleton'],
  wither_skeleton_skull: ['entity/skeleton', 'wither_skeleton'],
  piglin_head: ['entity/piglin', 'piglin'],
  dragon_head: ['entity/enderdragon', 'dragon'],
});

const SHULKER_COLORS: ReadonlySet<string> = new Set([
  'black',
  'blue',
  'brown',
  'cyan',
  'gray',
  'green',
  'light_blue',
  'light_gray',
  'lime',
  'magenta',
  'orange',
  'pink',
  'purple',
  'red',
  'white',
  'yellow',
]);

export function iconCandidates(material: unknown, template: string = DEFAULT_ICON_TEMPLATE): string[] {
  const id = materialToTextureId(material);
  const candidates: Array<[string, string]> = [];

  if (id === 'player_head') {
    candidates.push(['entity/player/wide', 'steve']);
  }

  // Curated entity-rendered materials (chests, skulls/heads).
  const entity = ENTITY_TEXTURES[id];
  if (entity) {
    candidates.push([entity[0], entity[1]]);
  }

  // Shulker boxes render from an entity texture (plain or per-colour).
  if (id === 'shulker_box') {
    candidates.push(['entity/shulker', 'shulker']);
  } else if (id.endsWith('_shulker_box')) {
    const color = id.replace(/_shulker_box$/, '');
    if (SHULKER_COLORS.has(color)) {
      candidates.push(['entity/shulker', `shulker_${color}`]);
    }
    // Fall back to the plain shulker if the colour is unexpected.
    candidates.push(['entity/shulker', 'shulker']);
  }

  if (id.endsWith('_stained_glass_pane')) {
    candidates.push(['block', id.replace(/_pane$/, '')]);
  } else if (id === 'glass_pane') {
    candidates.push(['block', 'glass']);
  }
  if (id.endsWith('_pane')) {
    candidates.push(['block', `${id}_top`]);
  }

  // Variant blocks: try the directional faces before the (non-existent) flat texture.
  const faces = VARIANT_BLOCK_FACES[id];
  if (faces) {
    for (const face of faces) {
      candidates.push(['block', `${id}_${face}`]);
    }
  }

  // Generic fallbacks, kept last so the curated/variant candidates win.
  candidates.push(['item', id], ['block', id]);

  return [
    ...new Set(
      candidates.map(([folder, textureId]) =>
        String(template)
          .replaceAll('{material}', normalizeMaterial(material, ''))
          .replaceAll('{id}', textureId)
          .replaceAll('{folder}', folder),
      ),
    ),
  ];
}
