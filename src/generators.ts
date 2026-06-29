// Tag Generator: pure, client-side generators that produce tag specs. They emit MiniMessage so
// gradients and rainbows render in the preview (the core renders both). New generators (for
// example AI packs) can slot in behind the GeneratedTag shape without touching the UI.

export interface GeneratedTag {
  tag: string
  item?: string
  displayname?: string
  description?: string[]
  category?: string
}

export interface StylePreset {
  id: string
  label: string
  apply(text: string): string
}

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'rainbow', label: 'Rainbow', apply: (t) => `<rainbow>${t}</rainbow>` },
  { id: 'fire', label: 'Fire', apply: (t) => `<gradient:#ff5500:#ffdd00>${t}</gradient>` },
  { id: 'ice', label: 'Ice', apply: (t) => `<gradient:#00ffff:#ffffff>${t}</gradient>` },
  { id: 'ocean', label: 'Ocean', apply: (t) => `<gradient:#0066ff:#00ffaa>${t}</gradient>` },
  { id: 'sunset', label: 'Sunset', apply: (t) => `<gradient:#ff0066:#ffaa00>${t}</gradient>` },
  { id: 'toxic', label: 'Toxic', apply: (t) => `<gradient:#88ff00:#00ff88>${t}</gradient>` },
  { id: 'gold', label: 'Gold', apply: (t) => `<gradient:#ffd700:#ff8800>${t}</gradient>` },
  { id: 'royal', label: 'Royal', apply: (t) => `<gradient:#aa00ff:#ff00aa>${t}</gradient>` },
]

/** Wrap text in a two-stop gradient. */
export function gradientStyle(text: string, from: string, to: string): string {
  return `<gradient:${from}:${to}>${text}</gradient>`
}

/** Apply a named style preset to text, returning the text unchanged for an unknown id. */
export function applyStylePreset(text: string, id: string): string {
  return STYLE_PRESETS.find((preset) => preset.id === id)?.apply(text) ?? text
}

export interface TagPack {
  id: string
  label: string
  tags: GeneratedTag[]
}

export const TAG_PACKS: TagPack[] = [
  {
    id: 'elements',
    label: 'Elements',
    tags: [
      { tag: '<gradient:#ff5500:#ffdd00>Fire</gradient>', item: 'BLAZE_POWDER' },
      { tag: '<gradient:#00aaff:#00ffcc>Water</gradient>', item: 'WATER_BUCKET' },
      { tag: '<gradient:#88ff00:#338800>Earth</gradient>', item: 'GRASS_BLOCK' },
      { tag: '<gradient:#ffffff:#aaaaaa>Air</gradient>', item: 'FEATHER' },
    ],
  },
  {
    id: 'ranks',
    label: 'Ranks',
    tags: [
      { tag: '<gradient:#55ff55:#00aa00>VIP</gradient>', item: 'EMERALD' },
      { tag: '<gradient:#55ffff:#0066ff>MVP</gradient>', item: 'DIAMOND' },
      { tag: '<gradient:#ffaa00:#ff5500>Elite</gradient>', item: 'GOLD_INGOT' },
      { tag: '<gradient:#ff55ff:#aa00ff>Legend</gradient>', item: 'NETHER_STAR' },
    ],
  },
  {
    id: 'neon',
    label: 'Neon',
    tags: [
      { tag: '<rainbow>Neon</rainbow>', item: 'GLOWSTONE' },
      { tag: '<gradient:#ff00ff:#00ffff>Pulse</gradient>', item: 'SEA_LANTERN' },
      { tag: '<gradient:#00ff66:#ffff00>Glow</gradient>', item: 'SLIME_BALL' },
    ],
  },
]

export function generatePack(id: string): GeneratedTag[] {
  return TAG_PACKS.find((pack) => pack.id === id)?.tags.map((tag) => ({ ...tag })) ?? []
}

const RANDOM_NAMES = [
  'Shadow', 'Frost', 'Ember', 'Storm', 'Nova', 'Venom', 'Blaze', 'Echo', 'Rogue', 'Titan', 'Pixel',
  'Cosmic', 'Phantom', 'Vortex', 'Onyx', 'Cinder', 'Drift', 'Spark', 'Hollow', 'Zephyr',
]
const RANDOM_ICONS = [
  'NAME_TAG', 'NETHER_STAR', 'DIAMOND', 'EMERALD', 'BLAZE_POWDER', 'ENDER_PEARL', 'GOLD_INGOT',
  'PAPER', 'TOTEM_OF_UNDYING', 'AMETHYST_SHARD',
]

/** Generate one random styled tag. The rng is injectable so tests are deterministic. */
export function randomTag(rng: () => number = Math.random): GeneratedTag {
  const name = RANDOM_NAMES[Math.floor(rng() * RANDOM_NAMES.length)]
  const style = STYLE_PRESETS[Math.floor(rng() * STYLE_PRESETS.length)]
  const item = RANDOM_ICONS[Math.floor(rng() * RANDOM_ICONS.length)]
  return { tag: style.apply(name), item }
}
