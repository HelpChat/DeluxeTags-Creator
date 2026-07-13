(function () {
const {
  STATIC_ITEM_KEYS,
  buildPreview,
  clone,
  createDefaultState,
  dumpConfigYaml,
  escapeHtml,
  formatTextHtml,
  iconCandidates,
  normalizeImportedConfig,
  parseSlotList,
  parseConfigYaml,
  renameKey,
  selectableCategories,
  validateConfig
} = window.DeluxeTagsCore;

const yamlLib = window.jsyaml;
const app = document.getElementById("builder-app");
const contextPanel = document.getElementById("context-panel");
const inventoryContent = document.getElementById("inventory-content");
const messages = document.getElementById("messages");

// ── State ──────────────────────────────────────────────
let state = createDefaultState();
state.config.use_minimessage = true;
state.yamlDraft = "";
let selectedSlot = null;
let selectedPreviewItem = null;
let selectedTag = "example";
let selectedCategory = "general";
let currentPreview = null;
let draggedSlot = null;
let lastFocusedInput = null;

// ── Color data ─────────────────────────────────────────
const MC_COLORS = [
  { code: "0", name: "black",        hex: "#000000", mm: "black" },
  { code: "1", name: "dark_blue",    hex: "#0000aa", mm: "dark_blue" },
  { code: "2", name: "dark_green",   hex: "#00aa00", mm: "dark_green" },
  { code: "3", name: "dark_aqua",    hex: "#00aaaa", mm: "dark_aqua" },
  { code: "4", name: "dark_red",     hex: "#aa0000", mm: "dark_red" },
  { code: "5", name: "dark_purple",  hex: "#aa00aa", mm: "dark_purple" },
  { code: "6", name: "gold",         hex: "#ffaa00", mm: "gold" },
  { code: "7", name: "gray",         hex: "#aaaaaa", mm: "gray" },
  { code: "8", name: "dark_gray",    hex: "#555555", mm: "dark_gray" },
  { code: "9", name: "blue",         hex: "#5555ff", mm: "blue" },
  { code: "a", name: "green",        hex: "#55ff55", mm: "green" },
  { code: "b", name: "aqua",         hex: "#55ffff", mm: "aqua" },
  { code: "c", name: "red",          hex: "#ff5555", mm: "red" },
  { code: "d", name: "light_purple", hex: "#ff55ff", mm: "light_purple" },
  { code: "e", name: "yellow",       hex: "#ffff55", mm: "yellow" },
  { code: "f", name: "white",        hex: "#ffffff", mm: "white" },
];

const MC_FORMATS = [
  { label: "<b>B</b>",  mm: "bold",          legacy: "&l" },
  { label: "<i>I</i>",  mm: "italic",        legacy: "&o" },
  { label: "<u>U</u>",  mm: "underlined",    legacy: "&n" },
  { label: "<s>S</s>",  mm: "strikethrough", legacy: "&m" },
];

const LEGACY_TO_MINI_COLORS = Object.freeze(Object.fromEntries(
  MC_COLORS.map((color) => [color.code, color.mm])
));

const LEGACY_TO_MINI_FORMATS = Object.freeze({
  l: "bold",
  o: "italic",
  n: "underlined",
  m: "strikethrough",
  k: "obfuscated",
  r: "reset"
});

function isPlayerHeadMaterial(material) {
  return String(material || "").toUpperCase() === "PLAYER_HEAD";
}

function playerHeadImageAttr(material) {
  return isPlayerHeadMaterial(material) ? ' data-player-head="true"' : "";
}

function convertPlayerHeadTexture(img) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height || width < 16 || height < 16) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 16, 16);
  ctx.drawImage(img, 8, 8, Math.min(8, width - 8), Math.min(8, height - 8), 0, 0, 16, 16);
  return canvas.toDataURL("image/png");
}

function upgradePlayerHeadTexture(img) {
  if (!isPlayerHeadMaterial(img?.alt)) return false;
  if (img.dataset.playerHeadTexture === "done") return false;
  const texture = convertPlayerHeadTexture(img);
  if (!texture) return false;
  img.dataset.playerHeadTexture = "done";
  img.src = texture;
  return true;
}

const PICKER_MATERIALS = [
  "NAME_TAG","PLAYER_HEAD","PAPER","BOOK","WRITABLE_BOOK","WRITTEN_BOOK","ENCHANTED_BOOK","MAP","FILLED_MAP",
  "COMPASS","RECOVERY_COMPASS","CLOCK","SPYGLASS","BRUSH","SHEARS","LEAD","SADDLE","BUNDLE",
  "NETHER_STAR","HEART_OF_THE_SEA","NAUTILUS_SHELL","TOTEM_OF_UNDYING","ELYTRA","FIREWORK_ROCKET",
  "EXPERIENCE_BOTTLE","ENDER_PEARL","ENDER_EYE","BLAZE_ROD","BLAZE_POWDER","GHAST_TEAR","MAGMA_CREAM",
  "SLIME_BALL","SNOWBALL","EGG","FEATHER","STRING","BONE","GUNPOWDER","ROTTEN_FLESH","SPIDER_EYE",
  "DIAMOND","EMERALD","LAPIS_LAZULI","AMETHYST_SHARD","QUARTZ","PRISMARINE_SHARD","PRISMARINE_CRYSTALS",
  "COAL","CHARCOAL","RAW_COPPER","COPPER_INGOT","RAW_IRON","IRON_INGOT","RAW_GOLD","GOLD_INGOT",
  "NETHERITE_SCRAP","NETHERITE_INGOT","REDSTONE","GLOWSTONE_DUST","ECHO_SHARD","DISC_FRAGMENT_5",
  "DIAMOND_SWORD","IRON_SWORD","GOLDEN_SWORD","STONE_SWORD","WOODEN_SWORD","NETHERITE_SWORD",
  "DIAMOND_AXE","IRON_AXE","GOLDEN_AXE","STONE_AXE","WOODEN_AXE","NETHERITE_AXE",
  "DIAMOND_PICKAXE","IRON_PICKAXE","GOLDEN_PICKAXE","STONE_PICKAXE","WOODEN_PICKAXE","NETHERITE_PICKAXE",
  "DIAMOND_SHOVEL","IRON_SHOVEL","GOLDEN_SHOVEL","STONE_SHOVEL","WOODEN_SHOVEL","NETHERITE_SHOVEL",
  "DIAMOND_HOE","IRON_HOE","GOLDEN_HOE","STONE_HOE","WOODEN_HOE","NETHERITE_HOE",
  "BOW","CROSSBOW","TRIDENT","SHIELD","ARROW","SPECTRAL_ARROW","TIPPED_ARROW","MACE",
  "DIAMOND_HELMET","DIAMOND_CHESTPLATE","DIAMOND_LEGGINGS","DIAMOND_BOOTS",
  "IRON_HELMET","IRON_CHESTPLATE","IRON_LEGGINGS","IRON_BOOTS",
  "GOLDEN_HELMET","GOLDEN_CHESTPLATE","GOLDEN_LEGGINGS","GOLDEN_BOOTS",
  "LEATHER_HELMET","LEATHER_CHESTPLATE","LEATHER_LEGGINGS","LEATHER_BOOTS",
  "NETHERITE_HELMET","NETHERITE_CHESTPLATE","NETHERITE_LEGGINGS","NETHERITE_BOOTS",
  "TURTLE_HELMET","CHAINMAIL_HELMET","CHAINMAIL_CHESTPLATE","CHAINMAIL_LEGGINGS","CHAINMAIL_BOOTS",
  "APPLE","GOLDEN_APPLE","ENCHANTED_GOLDEN_APPLE","BREAD","COOKIE","CAKE","CARROT","GOLDEN_CARROT",
  "POTATO","BAKED_POTATO","BEETROOT","MELON_SLICE","PUMPKIN_PIE","SWEET_BERRIES","GLOW_BERRIES",
  "COOKED_BEEF","COOKED_CHICKEN","COOKED_COD","COOKED_MUTTON","COOKED_PORKCHOP","COOKED_RABBIT","COOKED_SALMON",
  "POTION","SPLASH_POTION","LINGERING_POTION","MILK_BUCKET","HONEY_BOTTLE",
  "CHEST","TRAPPED_CHEST","ENDER_CHEST","BARREL","SHULKER_BOX","WHITE_SHULKER_BOX","ORANGE_SHULKER_BOX",
  "MAGENTA_SHULKER_BOX","LIGHT_BLUE_SHULKER_BOX","YELLOW_SHULKER_BOX","LIME_SHULKER_BOX","PINK_SHULKER_BOX",
  "GRAY_SHULKER_BOX","LIGHT_GRAY_SHULKER_BOX","CYAN_SHULKER_BOX","PURPLE_SHULKER_BOX","BLUE_SHULKER_BOX",
  "BROWN_SHULKER_BOX","GREEN_SHULKER_BOX","RED_SHULKER_BOX","BLACK_SHULKER_BOX","HOPPER","ANVIL","CHIPPED_ANVIL",
  "DAMAGED_ANVIL","CRAFTING_TABLE","FURNACE","BLAST_FURNACE","SMOKER","BREWING_STAND","CAULDRON","COMPOSTER",
  "SMITHING_TABLE","CARTOGRAPHY_TABLE","FLETCHING_TABLE","GRINDSTONE","LECTERN","LOOM","STONECUTTER","ENCHANTING_TABLE",
  "BEACON","CONDUIT","JUKEBOX","NOTE_BLOCK","BELL","RESPAWN_ANCHOR","LODESTONE",
  "BARRIER","STRUCTURE_VOID","LIGHT","COMMAND_BLOCK","CHAIN_COMMAND_BLOCK","REPEATING_COMMAND_BLOCK","JIGSAW","STRUCTURE_BLOCK",
  "TORCH","SOUL_TORCH","REDSTONE_TORCH","LANTERN","SOUL_LANTERN","CANDLE","WHITE_CANDLE","ORANGE_CANDLE",
  "MAGENTA_CANDLE","LIGHT_BLUE_CANDLE","YELLOW_CANDLE","LIME_CANDLE","PINK_CANDLE","GRAY_CANDLE","LIGHT_GRAY_CANDLE",
  "CYAN_CANDLE","PURPLE_CANDLE","BLUE_CANDLE","BROWN_CANDLE","GREEN_CANDLE","RED_CANDLE","BLACK_CANDLE",
  "STONE","GRANITE","POLISHED_GRANITE","DIORITE","POLISHED_DIORITE","ANDESITE","POLISHED_ANDESITE","DEEPSLATE",
  "COBBLED_DEEPSLATE","POLISHED_DEEPSLATE","CALCITE","TUFF","DRIPSTONE_BLOCK","COBBLESTONE","MOSSY_COBBLESTONE",
  "STONE_BRICKS","MOSSY_STONE_BRICKS","CRACKED_STONE_BRICKS","CHISELED_STONE_BRICKS","BRICKS","MUD_BRICKS",
  "SANDSTONE","SMOOTH_SANDSTONE","RED_SANDSTONE","SMOOTH_RED_SANDSTONE","PRISMARINE","PRISMARINE_BRICKS",
  "DARK_PRISMARINE","NETHERRACK","NETHER_BRICKS","RED_NETHER_BRICKS","BASALT","POLISHED_BASALT","BLACKSTONE",
  "POLISHED_BLACKSTONE","POLISHED_BLACKSTONE_BRICKS","END_STONE","END_STONE_BRICKS","PURPUR_BLOCK","PURPUR_PILLAR",
  "GRASS_BLOCK","DIRT","COARSE_DIRT","ROOTED_DIRT","PODZOL","MYCELIUM","MOSS_BLOCK","MUD","CLAY","SAND","RED_SAND",
  "GRAVEL","SNOW_BLOCK","ICE","PACKED_ICE","BLUE_ICE","OBSIDIAN","CRYING_OBSIDIAN","BEDROCK",
  "OAK_LOG","SPRUCE_LOG","BIRCH_LOG","JUNGLE_LOG","ACACIA_LOG","DARK_OAK_LOG","MANGROVE_LOG","CHERRY_LOG",
  "CRIMSON_STEM","WARPED_STEM","BAMBOO_BLOCK","OAK_PLANKS","SPRUCE_PLANKS","BIRCH_PLANKS","JUNGLE_PLANKS",
  "ACACIA_PLANKS","DARK_OAK_PLANKS","MANGROVE_PLANKS","CHERRY_PLANKS","BAMBOO_PLANKS","CRIMSON_PLANKS","WARPED_PLANKS",
  "OAK_SAPLING","SPRUCE_SAPLING","BIRCH_SAPLING","JUNGLE_SAPLING","ACACIA_SAPLING","DARK_OAK_SAPLING","MANGROVE_PROPAGULE","CHERRY_SAPLING",
  "OAK_LEAVES","SPRUCE_LEAVES","BIRCH_LEAVES","JUNGLE_LEAVES","ACACIA_LEAVES","DARK_OAK_LEAVES","MANGROVE_LEAVES","CHERRY_LEAVES","AZALEA_LEAVES","FLOWERING_AZALEA_LEAVES",
  "COAL_ORE","DEEPSLATE_COAL_ORE","COPPER_ORE","DEEPSLATE_COPPER_ORE","IRON_ORE","DEEPSLATE_IRON_ORE",
  "GOLD_ORE","DEEPSLATE_GOLD_ORE","REDSTONE_ORE","DEEPSLATE_REDSTONE_ORE","EMERALD_ORE","DEEPSLATE_EMERALD_ORE",
  "LAPIS_ORE","DEEPSLATE_LAPIS_ORE","DIAMOND_ORE","DEEPSLATE_DIAMOND_ORE","NETHER_GOLD_ORE","NETHER_QUARTZ_ORE","ANCIENT_DEBRIS",
  "COAL_BLOCK","COPPER_BLOCK","IRON_BLOCK","GOLD_BLOCK","REDSTONE_BLOCK","EMERALD_BLOCK","LAPIS_BLOCK","DIAMOND_BLOCK",
  "NETHERITE_BLOCK","AMETHYST_BLOCK","BUDDING_AMETHYST","QUARTZ_BLOCK","HAY_BLOCK","BONE_BLOCK","SLIME_BLOCK","HONEY_BLOCK",
  "WHITE_WOOL","ORANGE_WOOL","MAGENTA_WOOL","LIGHT_BLUE_WOOL","YELLOW_WOOL","LIME_WOOL","PINK_WOOL","GRAY_WOOL",
  "LIGHT_GRAY_WOOL","CYAN_WOOL","PURPLE_WOOL","BLUE_WOOL","BROWN_WOOL","GREEN_WOOL","RED_WOOL","BLACK_WOOL",
  "WHITE_CARPET","ORANGE_CARPET","MAGENTA_CARPET","LIGHT_BLUE_CARPET","YELLOW_CARPET","LIME_CARPET","PINK_CARPET",
  "GRAY_CARPET","LIGHT_GRAY_CARPET","CYAN_CARPET","PURPLE_CARPET","BLUE_CARPET","BROWN_CARPET","GREEN_CARPET","RED_CARPET","BLACK_CARPET",
  "WHITE_CONCRETE","ORANGE_CONCRETE","MAGENTA_CONCRETE","LIGHT_BLUE_CONCRETE","YELLOW_CONCRETE","LIME_CONCRETE",
  "PINK_CONCRETE","GRAY_CONCRETE","LIGHT_GRAY_CONCRETE","CYAN_CONCRETE","PURPLE_CONCRETE","BLUE_CONCRETE","BROWN_CONCRETE","GREEN_CONCRETE","RED_CONCRETE","BLACK_CONCRETE",
  "WHITE_TERRACOTTA","ORANGE_TERRACOTTA","MAGENTA_TERRACOTTA","LIGHT_BLUE_TERRACOTTA","YELLOW_TERRACOTTA","LIME_TERRACOTTA",
  "PINK_TERRACOTTA","GRAY_TERRACOTTA","LIGHT_GRAY_TERRACOTTA","CYAN_TERRACOTTA","PURPLE_TERRACOTTA","BLUE_TERRACOTTA","BROWN_TERRACOTTA","GREEN_TERRACOTTA","RED_TERRACOTTA","BLACK_TERRACOTTA",
  "GLASS","GLASS_PANE","TINTED_GLASS","WHITE_STAINED_GLASS","ORANGE_STAINED_GLASS","MAGENTA_STAINED_GLASS","LIGHT_BLUE_STAINED_GLASS",
  "YELLOW_STAINED_GLASS","LIME_STAINED_GLASS","PINK_STAINED_GLASS","GRAY_STAINED_GLASS","LIGHT_GRAY_STAINED_GLASS","CYAN_STAINED_GLASS",
  "PURPLE_STAINED_GLASS","BLUE_STAINED_GLASS","BROWN_STAINED_GLASS","GREEN_STAINED_GLASS","RED_STAINED_GLASS","BLACK_STAINED_GLASS",
  "WHITE_STAINED_GLASS_PANE","ORANGE_STAINED_GLASS_PANE","MAGENTA_STAINED_GLASS_PANE","LIGHT_BLUE_STAINED_GLASS_PANE",
  "YELLOW_STAINED_GLASS_PANE","LIME_STAINED_GLASS_PANE","PINK_STAINED_GLASS_PANE","GRAY_STAINED_GLASS_PANE","LIGHT_GRAY_STAINED_GLASS_PANE",
  "CYAN_STAINED_GLASS_PANE","PURPLE_STAINED_GLASS_PANE","BLUE_STAINED_GLASS_PANE","BROWN_STAINED_GLASS_PANE","GREEN_STAINED_GLASS_PANE","RED_STAINED_GLASS_PANE","BLACK_STAINED_GLASS_PANE",
  "WHITE_DYE","ORANGE_DYE","MAGENTA_DYE","LIGHT_BLUE_DYE","YELLOW_DYE","LIME_DYE","PINK_DYE","GRAY_DYE","LIGHT_GRAY_DYE",
  "CYAN_DYE","PURPLE_DYE","BLUE_DYE","BROWN_DYE","GREEN_DYE","RED_DYE","BLACK_DYE",
  "DANDELION","POPPY","BLUE_ORCHID","ALLIUM","AZURE_BLUET","RED_TULIP","ORANGE_TULIP","WHITE_TULIP","PINK_TULIP",
  "OXEYE_DAISY","CORNFLOWER","LILY_OF_THE_VALLEY","WITHER_ROSE","SUNFLOWER","LILAC","ROSE_BUSH","PEONY","PITCHER_PLANT","TORCHFLOWER",
  "CACTUS","SUGAR_CANE","BAMBOO","KELP","SEAGRASS","SEA_PICKLE","LILY_PAD","VINE","GLOW_LICHEN","HANGING_ROOTS",
  "WATER_BUCKET","LAVA_BUCKET","POWDER_SNOW_BUCKET","AXOLOTL_BUCKET","COD_BUCKET","PUFFERFISH_BUCKET","SALMON_BUCKET","TADPOLE_BUCKET","TROPICAL_FISH_BUCKET",
  "MINECART","CHEST_MINECART","FURNACE_MINECART","HOPPER_MINECART","TNT_MINECART","OAK_BOAT","SPRUCE_BOAT","BIRCH_BOAT",
  "JUNGLE_BOAT","ACACIA_BOAT","DARK_OAK_BOAT","MANGROVE_BOAT","CHERRY_BOAT","BAMBOO_RAFT",
  "PLAYER_HEAD","CREEPER_HEAD","ZOMBIE_HEAD","SKELETON_SKULL","WITHER_SKELETON_SKULL","PIGLIN_HEAD","DRAGON_HEAD",
  "MUSIC_DISC_13","MUSIC_DISC_CAT","MUSIC_DISC_BLOCKS","MUSIC_DISC_CHIRP","MUSIC_DISC_FAR","MUSIC_DISC_MALL","MUSIC_DISC_MELLOHI",
  "MUSIC_DISC_STAL","MUSIC_DISC_STRAD","MUSIC_DISC_WARD","MUSIC_DISC_11","MUSIC_DISC_WAIT","MUSIC_DISC_OTHERSIDE","MUSIC_DISC_5","MUSIC_DISC_PIGSTEP","MUSIC_DISC_RELIC","MUSIC_DISC_PRECIPICE","MUSIC_DISC_CREATOR","MUSIC_DISC_CREATOR_MUSIC_BOX"
];

function legacyToMiniMessage(value) {
  return String(value ?? "")
    .replace(/&#([a-f0-9]{6})/gi, (_all, hex) => `<#${hex.toLowerCase()}>`)
    .replace(/&([0-9a-f])/gi, (_all, code) => `<${LEGACY_TO_MINI_COLORS[code.toLowerCase()]}>`)
    .replace(/&([klmnor])/gi, (_all, code) => `<${LEGACY_TO_MINI_FORMATS[code.toLowerCase()]}>`);
}

function textForMode(value) {
  return state.config.use_minimessage ? legacyToMiniMessage(value) : value;
}

function linesForMode(lines) {
  return lines.map((line) => textForMode(line));
}

function convertConfigTextToMiniMessage(value) {
  if (typeof value === "string") {
    return legacyToMiniMessage(value);
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = convertConfigTextToMiniMessage(value[i]);
    }
    return value;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = convertConfigTextToMiniMessage(value[key]);
    }
  }
  return value;
}

convertConfigTextToMiniMessage(state.config);

const MINI_EDITOR_TAGS = new Set([
  ...MC_COLORS.map((color) => color.mm),
  ...Object.values(LEGACY_TO_MINI_FORMATS),
  "color",
  "colour",
  "c",
  "gradient",
  "rainbow",
  "transition",
  "newline",
  "br",
  "reset"
]);

function miniEditorTag(raw, index) {
  if (!state.config.use_minimessage || raw[index] !== "<") return null;
  const end = raw.indexOf(">", index + 1);
  if (end === -1) return null;
  const content = raw.slice(index + 1, end).trim();
  const closing = content.startsWith("/");
  const clean = content.replace(/^\/+/, "").replace(/\s*\/$/, "");
  const name = clean.split(":", 1)[0].toLowerCase();
  if (name === "newline" || name === "br") {
    return { end: end + 1, text: "\n", opening: false };
  }
  if (/^#[a-f0-9]{6}$/i.test(name) || MINI_EDITOR_TAGS.has(name)) {
    return { end: end + 1, text: "", opening: !closing && name !== "reset" };
  }
  return null;
}

function styledPlainMap(raw) {
  raw = String(raw ?? "");
  const offsetToRaw = [0];
  let plain = "";

  for (let i = 0; i < raw.length; i += 1) {
    const rest = raw.slice(i);
    const mini = miniEditorTag(raw, i);
    if (mini) {
      if (mini.text) {
        if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = i;
        plain += mini.text;
        offsetToRaw[plain.length] = mini.end;
      } else if (mini.opening) {
        offsetToRaw[plain.length] = mini.end;
      }
      i = mini.end - 1;
      continue;
    }

    const hex = rest.match(/^&#[a-f0-9]{6}/i) || rest.match(/^#[a-f0-9]{6}/i);
    if (hex) {
      offsetToRaw[plain.length] = i + hex[0].length;
      i += hex[0].length - 1;
      continue;
    }

    if (raw[i] === "&" && /^[0-9a-fklmnor]$/i.test(raw[i + 1] || "")) {
      offsetToRaw[plain.length] = i + 2;
      i += 1;
      continue;
    }

    if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = i;
    plain += raw[i];
    offsetToRaw[plain.length] = i + 1;
  }

  if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = raw.length;
  return { plain, offsetToRaw };
}

function formatStyledEditorHtml(raw) {
  return formatTextHtml(raw, state.config).replace(/<br>/g, "\n");
}

function renderStyledTextBox(id, path, raw, options = {}) {
  const lines = Boolean(options.lines);
  const rows = Number.parseInt(options.rows, 10) || (lines ? 3 : 1);
  const value = String(raw ?? "");
  const placeholder = styledPlainMap(options.placeholder || "").plain;
  return '<div id="' + id + '" class="styled-editor has-mm-helper' + (lines ? ' multiline' : ' singleline') + '"'
    + ' contenteditable="true" spellcheck="false" role="textbox"'
    + (lines ? ' aria-multiline="true"' : '')
    + ' style="--editor-rows:' + rows + '"'
    + ' data-styled-editor="true" data-path="' + attr(path) + '"'
    + (lines ? ' data-kind="lines"' : '')
    + ' data-single-line="' + (lines ? 'false' : 'true') + '"'
    + ' data-raw="' + attr(value) + '"'
    + ' data-previous-plain="' + attr(styledPlainMap(value).plain) + '"'
    + ' data-placeholder="' + attr(placeholder) + '">' + formatStyledEditorHtml(value) + '</div>';
}

function styledEditorText(editor) {
  let text = "";
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue;
      return;
    }
    if (node.nodeName === "BR") {
      text += "\n";
      return;
    }
    node.childNodes.forEach(walk);
  };
  editor.childNodes.forEach(walk);
  return editor.dataset.singleLine === "true" ? text.replace(/\n+/g, " ") : text;
}

function commonPrefixLength(a, b) {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
}

function patchRawFromPlain(raw, previousPlain, nextPlain) {
  if (previousPlain === nextPlain) return raw;
  if (nextPlain === "") return "";
  const start = commonPrefixLength(previousPlain, nextPlain);
  let previousEnd = previousPlain.length;
  let nextEnd = nextPlain.length;
  while (previousEnd > start && nextEnd > start && previousPlain[previousEnd - 1] === nextPlain[nextEnd - 1]) {
    previousEnd -= 1;
    nextEnd -= 1;
  }
  const map = styledPlainMap(raw).offsetToRaw;
  const rawStart = map[start] ?? raw.length;
  const rawEnd = map[previousEnd] ?? raw.length;
  return raw.slice(0, rawStart) + nextPlain.slice(start, nextEnd) + raw.slice(rawEnd);
}

function getEditorCaretOffset(editor) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return styledPlainMap(editor.dataset.raw || "").plain.length;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.endContainer)) return styledPlainMap(editor.dataset.raw || "").plain.length;
  const before = range.cloneRange();
  before.selectNodeContents(editor);
  before.setEnd(range.endContainer, range.endOffset);
  return before.toString().length;
}

function getEditorSelectionOffsets(editor) {
  const fallback = getEditorCaretOffset(editor);
  const selection = window.getSelection();
  const savedStart = Number.parseInt(editor.dataset.selectionStart || "", 10);
  const savedEnd = Number.parseInt(editor.dataset.selectionEnd || "", 10);
  const saved = Number.isFinite(savedStart) && Number.isFinite(savedEnd)
    ? { start: Math.min(savedStart, savedEnd), end: Math.max(savedStart, savedEnd) }
    : null;
  if (!selection || selection.rangeCount === 0) return saved || { start: fallback, end: fallback };
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
    return saved || { start: fallback, end: fallback };
  }
  const beforeStart = range.cloneRange();
  beforeStart.selectNodeContents(editor);
  beforeStart.setEnd(range.startContainer, range.startOffset);
  const beforeEnd = range.cloneRange();
  beforeEnd.selectNodeContents(editor);
  beforeEnd.setEnd(range.endContainer, range.endOffset);
  const start = beforeStart.toString().length;
  const end = beforeEnd.toString().length;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function rememberStyledEditorSelection(editor) {
  if (!editor || editor.dataset?.styledEditor !== "true") return;
  const selection = getEditorSelectionOffsets(editor);
  editor.dataset.selectionStart = String(selection.start);
  editor.dataset.selectionEnd = String(selection.end);
}

function setEditorCaretOffset(editor, offset) {
  editor.focus();
  const range = document.createRange();
  const selection = window.getSelection();
  let remaining = Math.max(0, offset);
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (remaining <= node.nodeValue.length) {
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= node.nodeValue.length;
    node = walker.nextNode();
  }
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function setStyledEditorRaw(editor, raw, caretOffset = null) {
  const plain = styledPlainMap(raw).plain;
  editor.dataset.raw = raw;
  editor.dataset.previousPlain = plain;
  editor.innerHTML = formatStyledEditorHtml(raw);
  if (caretOffset != null) {
    const nextCaret = Math.min(caretOffset, plain.length);
    editor.dataset.selectionStart = String(nextCaret);
    editor.dataset.selectionEnd = String(nextCaret);
    setEditorCaretOffset(editor, nextCaret);
  }
}

function applyStyledEditorWrapper(editor, opening, closing, fallbackText = "Text") {
  if (!editor || editor.dataset?.styledEditor !== "true") {
    insertAtCursor(editor || lastFocusedInput, opening + fallbackText + closing);
    return;
  }
  const raw = editor.dataset.raw || "";
  const plainInfo = styledPlainMap(raw);
  const selection = getEditorSelectionOffsets(editor);
  const hasSelection = selection.end > selection.start;
  const rawStart = plainInfo.offsetToRaw[selection.start] ?? raw.length;
  const rawEnd = plainInfo.offsetToRaw[selection.end] ?? rawStart;
  const selectedRaw = raw.slice(rawStart, rawEnd);
  const insertBody = hasSelection ? selectedRaw : fallbackText;
  const nextRaw = raw.slice(0, rawStart) + opening + insertBody + closing + raw.slice(rawEnd);
  const nextCaret = hasSelection
    ? selection.end
    : selection.start + styledPlainMap(fallbackText).plain.length;
  setStyledEditorRaw(editor, nextRaw, nextCaret);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function syncStyledEditorInput(editor) {
  const raw = editor.dataset.raw || "";
  const previousPlain = editor.dataset.previousPlain ?? styledPlainMap(raw).plain;
  const caretOffset = getEditorCaretOffset(editor);
  const nextPlain = styledEditorText(editor);
  const nextRaw = patchRawFromPlain(raw, previousPlain, nextPlain);
  setStyledEditorRaw(editor, nextRaw, caretOffset);
}

// ── HTML helpers ───────────────────────────────────────
function html(v) { return escapeHtml(v ?? ""); }
function attr(v) { return escapeHtml(String(v ?? "")).replaceAll("\n", "&#10;"); }
function boolAttr(v) { return v ? " checked" : ""; }
function selectedAttr(v, cur) { return String(v) === String(cur) ? " selected" : ""; }

function inputValue(el) {
  if (el.type === "checkbox") return el.checked;
  if (el.dataset.styledEditor === "true") {
    const raw = el.dataset.raw || "";
    return el.dataset.kind === "lines" ? raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n") : raw;
  }
  if (el.dataset.kind === "lines")
    return el.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (el.dataset.kind === "number")
    return el.value === "" ? "" : Number.parseInt(el.value, 10);
  return el.value;
}

function setByPath(root, path, value) {
  const parts = path.split(".");
  let t = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!t[parts[i]] || typeof t[parts[i]] !== "object") t[parts[i]] = {};
    t = t[parts[i]];
  }
  t[parts[parts.length - 1]] = value;
}

function getByPath(root, path) {
  return path.split(".").reduce((t, p) => t?.[p], root);
}

function toast(msg, err = false) {
  const li = document.createElement("li");
  li.textContent = msg;
  if (err) li.className = "error";
  messages.appendChild(li);
  window.setTimeout(() => li.remove(), 2800);
}

function insertAtCursor(input, text) {
  if (!input) return;
  if (input.dataset?.styledEditor === "true") {
    const raw = input.dataset.raw || "";
    const offset = getEditorCaretOffset(input);
    const map = styledPlainMap(raw).offsetToRaw;
    const rawIndex = map[offset] ?? raw.length;
    const insertedPlain = styledPlainMap(text).plain.length;
    setStyledEditorRaw(input, raw.slice(0, rawIndex) + text + raw.slice(rawIndex), offset + insertedPlain);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  const s = input.selectionStart ?? input.value.length;
  const e = input.selectionEnd ?? input.value.length;
  input.value = input.value.slice(0, s) + text + input.value.slice(e);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  input.selectionStart = input.selectionEnd = s + text.length;
}

// ── State helpers ──────────────────────────────────────
function categoryIds(includeAll = true) {
  return Object.keys(state.config.categories || {})
    .filter((id) => includeAll || id !== "all")
    .sort((a, b) =>
      ((Number.parseInt(state.config.categories[a].order, 10) || 0) -
       (Number.parseInt(state.config.categories[b].order, 10) || 0)) ||
      a.localeCompare(b));
}

function tagIds() {
  return Object.keys(state.config.deluxetags || {})
    .sort((a, b) =>
      ((Number.parseInt(state.config.deluxetags[a].order, 10) || 0) -
       (Number.parseInt(state.config.deluxetags[b].order, 10) || 0)) ||
      a.localeCompare(b));
}

function menuSize() { return Number.parseInt(state.config.gui.size, 10) || 54; }

function maxOrder(entries) {
  return entries.reduce((max, item) => {
    const v = Number.parseInt(item.order, 10);
    return Number.isFinite(v) ? Math.max(max, v) : max;
  }, 0);
}

function ensureTagSlot(slot) {
  const parsed = parseSlotList(state.config.gui.tag_slots, menuSize());
  if (!parsed.slots.includes(slot))
    state.config.gui.tag_slots = [...state.config.gui.tag_slots, String(slot)];
}

function ensureSelections() {
  const cats = categoryIds();
  const tags = tagIds();
  if (!cats.includes(selectedCategory))
    selectedCategory = cats.includes("general") ? "general" : (cats[0] || "");
  if (!tags.includes(selectedTag))
    selectedTag = tags[0] || "";
  if (!tags.includes(state.preview.activeTagId))
    state.preview.activeTagId = tags[0] || "";
}

function selectSlot(slot) {
  selectedSlot = Number.parseInt(slot, 10);
  selectedPreviewItem = currentPreview?.slots?.[selectedSlot] || null;
  const ref = selectedPreviewItem?.ref;
  if (ref?.kind === "tag") selectedTag = ref.id;
  else if (ref?.kind === "category") selectedCategory = ref.id;
}

function refreshSelectedItem() {
  selectedPreviewItem = selectedSlot == null
    ? null
    : currentPreview?.slots?.[selectedSlot] || null;
}

function nextUnique(base, existing) {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(base + "_" + i)) i++;
  return base + "_" + i;
}

// ── Slot-adding actions ────────────────────────────────
function addTagAtSlot(slot) {
  ensureTagSlot(slot);
  const id = nextUnique("tag", tagIds());
  const category =
    currentPreview?.screen === "tags" && currentPreview.categoryIdentifier !== "all"
      ? currentPreview.categoryIdentifier
      : (categoryIds(false)[0] || "general");
  state.config.deluxetags[id] = {
    order: maxOrder(Object.values(state.config.deluxetags)) + 1,
    category,
    tag: textForMode("&7[&fNew Tag&7]"),
    displayname: textForMode("&6Tag&f: &6%deluxetags_identifier%"),
    description: linesForMode(["&7A new tag.", "%deluxetags_available%"]),
    item: "NAME_TAG",
    data: 0,
    permission: "deluxetags.tag." + id,
  };
  state.preview.unlockedTags[id] = true;
  selectedTag = id;
  selectSlot(slot);
  renderAll();
}

function addCategoryAtSlot(slot) {
  ensureTagSlot(slot);
  const id = nextUnique("category", categoryIds());
  const tagId = nextUnique(id + "_tag", tagIds());
  state.config.categories[id] = {
    order: maxOrder(Object.values(state.config.categories)) + 1,
    item: "NAME_TAG",
    name: textForMode("&6" + id),
    lore: linesForMode(["&7Click to view tags"]),
    gui_name: textForMode("&6" + id + " tags"),
  };
  state.config.deluxetags[tagId] = {
    order: maxOrder(Object.values(state.config.deluxetags)) + 1,
    category: id,
    tag: textForMode("&7[&fNew Tag&7]"),
    displayname: textForMode("&6Tag&f: &6%deluxetags_identifier%"),
    description: linesForMode(["&7A new tag.", "%deluxetags_available%"]),
    item: "NAME_TAG",
    data: 0,
    permission: "deluxetags.tag." + tagId,
  };
  state.preview.unlockedTags[tagId] = true;
  selectedCategory = id;
  selectedTag = tagId;
  state.preview.screen = "categories";
  selectSlot(slot);
  renderAll();
}

function setStaticItemAtSlot(key, slot) {
  if (!state.config.gui[key]) return;
  const slots = parseSlotList(state.config.gui[key].slots || [], menuSize()).slots;
  if (!slots.includes(slot)) slots.push(slot);
  state.config.gui[key].slots = slots.sort((a, b) => a - b).map(String);
  selectSlot(slot);
  renderAll();
}

function moveStaticSlot(key, fromSlot, toSlot) {
  const item = state.config.gui[key];
  if (!item || !Array.isArray(item.slots)) return;
  const slots = parseSlotList(item.slots, menuSize()).slots;
  const next = slots.map((s) => (s === fromSlot ? toSlot : s));
  if (!next.includes(toSlot)) next.push(toSlot);
  item.slots = [...new Set(next)].sort((a, b) => a - b).map(String);
}

function swapOrders(col, a, b) {
  if (!col[a] || !col[b] || a === b) return false;
  const tmp = col[a].order;
  col[a].order = col[b].order;
  col[b].order = tmp;
  return true;
}

function movePreviewItem(fromSlot, toSlot) {
  const from = currentPreview?.slots?.[fromSlot];
  const to   = currentPreview?.slots?.[toSlot];
  if (!from?.ref || fromSlot === toSlot) return;
  if (from.ref.kind === "static") moveStaticSlot(from.ref.id, fromSlot, toSlot);
  else if (from.ref.kind === "tag" && to?.ref?.kind === "tag")
    swapOrders(state.config.deluxetags, from.ref.id, to.ref.id);
  else if (from.ref.kind === "category" && to?.ref?.kind === "category")
    swapOrders(state.config.categories, from.ref.id, to.ref.id);
  else if (from.ref.kind === "tag" && !to) ensureTagSlot(toSlot);
  selectSlot(toSlot);
  renderAll();
}

// ── CRUD ───────────────────────────────────────────────
function addTag() {
  const id = nextUnique("tag", tagIds());
  state.config.deluxetags[id] = {
    order: tagIds().length + 1,
    category: categoryIds(false)[0] || "general",
    tag: textForMode("&7[&fNew Tag&7]"),
    displayname: textForMode("&6Tag&f: &6%deluxetags_identifier%"),
    description: linesForMode(["&7A new tag.", "%deluxetags_available%"]),
    item: "NAME_TAG",
    data: 0,
    permission: "deluxetags.tag." + id,
  };
  state.preview.unlockedTags[id] = true;
  selectedTag = id;
  selectedSlot = null;
  renderAll();
}

function deleteTag(id) {
  id = id || selectedTag;
  if (tagIds().length <= 1) { toast("Cannot delete the last tag.", true); return; }
  delete state.config.deluxetags[id];
  delete state.preview.unlockedTags[id];
  if (state.preview.activeTagId === id) state.preview.activeTagId = tagIds()[0] || "";
  selectedTag = tagIds()[0] || "";
  selectedSlot = null;
  renderAll();
}

function addCategory() {
  const id = nextUnique("category", categoryIds());
  state.config.categories[id] = {
    order: categoryIds().length + 1,
    item: "NAME_TAG",
    name: textForMode("&6" + id),
    lore: linesForMode(["&7Click to view tags"]),
    gui_name: textForMode("&6" + id + " tags"),
  };
  selectedCategory = id;
  renderAll();
}

function deleteCategory(id) {
  id = id || selectedCategory;
  if (id === "all") { toast("Cannot delete the reserved 'all' category.", true); return; }
  const fallback = categoryIds(false).find((c) => c !== id) || "general";
  delete state.config.categories[id];
  for (const tag of Object.values(state.config.deluxetags))
    if (tag.category === id) tag.category = fallback;
  selectedCategory = fallback;
  selectedSlot = null;
  renderAll();
}

function renameTag(oldId, newId) {
  newId = newId.trim();
  if (!newId) { toast("ID cannot be empty.", true); return; }
  if (!renameKey(state.config.deluxetags, oldId, newId)) {
    toast("That ID is already in use.", true); return;
  }
  const tag = state.config.deluxetags[newId];
  if (!tag.permission || tag.permission === "deluxetags.tag." + oldId)
    tag.permission = "deluxetags.tag." + newId;
  state.preview.unlockedTags[newId] = state.preview.unlockedTags[oldId] !== false;
  delete state.preview.unlockedTags[oldId];
  if (state.preview.activeTagId === oldId) state.preview.activeTagId = newId;
  selectedTag = newId;
  renderAll();
}

function renameCategory(oldId, newId) {
  newId = newId.trim();
  if (!newId || newId === "all") { toast("Invalid category ID.", true); return; }
  if (!renameKey(state.config.categories, oldId, newId)) {
    toast("That ID is already in use.", true); return;
  }
  for (const tag of Object.values(state.config.deluxetags))
    if (tag.category === oldId) tag.category = newId;
  selectedCategory = newId;
  if (state.preview.category === oldId) state.preview.category = newId;
  renderAll();
}

// ── Export / Import ────────────────────────────────────
function getExportYaml() { return dumpConfigYaml(state.config, yamlLib, "full"); }

async function copyYaml() {
  try {
    await navigator.clipboard.writeText(getExportYaml());
    toast("Config copied to clipboard.");
  } catch (_e) {
    toast("Copy failed \u2014 try the download button.", true);
  }
}

function downloadYaml() {
  const blob = new Blob([getExportYaml()], { type: "text/yaml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "config.yml";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
  toast("config.yml downloaded.");
}

function importYaml(text) {
  state.yamlDraft = text;
  try {
    state.config = parseConfigYaml(text, yamlLib);
    if (state.config.use_minimessage) convertConfigTextToMiniMessage(state.config);
    state.yamlError = null;
    ensureSelections();
    selectedSlot = null;
    toast("Config imported.");
    renderAll();
  } catch (err) {
    toast("Import failed: " + err.message, true);
  }
}

// ── Item tooltip ───────────────────────────────────────
function renderItemTooltip(item) {
  if (!item) return "";
  const lore = item.lore || [];
  const tagLine = item.tagText && item.tagText !== item.displayname && !lore.includes(item.tagText)
    ? '<span class="tooltip-tag">' + formatTextHtml(item.tagText, state.config) + '</span>'
    : "";
  return '<div class="item-tooltip">'
    + '<strong>' + formatTextHtml(item.displayname || item.material, state.config) + '</strong>'
    + tagLine
    + lore.map((l) => '<span>' + formatTextHtml(l, state.config) + '</span>').join("")
    + '<small>' + html(item.material) + '</small></div>';
}

// ── Slot render ────────────────────────────────────────
function renderSlot(item, index) {
  if (!item) {
    return '<div class="mc-slot empty' + (selectedSlot === index ? ' inspected' : '') + '" data-slot="' + index + '" data-empty="true">'
      + '<span>' + index + '</span>'
      + '<button type="button" class="slot-add" tabindex="-1">+</button>'
      + '</div>';
  }
  const candidates = iconCandidates(item.material, state.preview.iconTemplate);
  const ref = item.ref || {};
  const inspected = selectedSlot === index ? " inspected" : "";
  const abbrev = item.material.split("_").map((p) => p[0]).join("").slice(0, 3);
  return '<div class="mc-slot ' + (item.selected ? "selected" : "") + ' ' + (item.canSelect ? "" : "locked") + inspected
    + '" data-slot="' + index + '" data-kind="' + attr(ref.kind || item.type)
    + '" data-id="' + attr(ref.id || "") + '" draggable="true">'
    + '<span class="slot-num">' + index + '</span>'
    + '<img class="item-icon" alt="' + attr(item.material) + '" src="' + attr(candidates[0])
    + '" data-candidates="' + attr(candidates.join("|")) + '" data-index="0"' + playerHeadImageAttr(item.material) + '>'
    + '<span class="item-fallback">' + html(abbrev) + '</span>'
    + renderItemTooltip(item)
    + '</div>';
}

// ── Color helper ───────────────────────────────────────
function colorHelperCode(c) {
  return state.config.use_minimessage ? '<' + c.mm + '>' : '&' + c.code;
}

function formatHelperCode(f) {
  return state.config.use_minimessage ? '<' + f.mm + '>' : f.legacy;
}

function renderColorHelper(inputId) {
  const safeId = inputId.replace(/[^a-z0-9]/gi, "_");
  const formats = MC_FORMATS.map((f) =>
    '<button type="button" class="mm-fmt-btn" title="' + f.mm + '"'
    + ' data-action="insert-format" data-input-id="' + inputId + '" data-mm-tag="' + attr(f.mm)
    + '" data-code="' + attr(formatHelperCode(f)) + '">'
    + f.label + '</button>'
  ).join("");
  const gradientId = "gradient-panel-" + safeId;
  return '<div class="mm-helper">'
    + '<div class="mm-helper-label">MiniMessage</div>'
    + '<div class="mm-format-row">'
    + '<button type="button" class="mm-fmt-btn" data-action="open-hex-picker" data-input-id="' + inputId
    + '" data-picker-id="hex-picker-' + safeId + '">Hex</button>'
    + '<input type="color" id="hex-picker-' + safeId + '" class="mm-hex-input" value="#55ffff"'
    + ' data-hex-input-id="' + inputId + '">'
    + '<button type="button" class="mm-fmt-btn" title="gradient" data-action="open-gradient-picker"'
    + ' data-gradient-id="' + gradientId + '">Gradient</button>'
    + formats + '</div>'
    + '<div class="mm-gradient-panel" id="' + gradientId + '" hidden>'
    + '<input type="color" value="#55ffff" data-gradient-start="' + inputId + '">'
    + '<input type="color" value="#ff55ff" data-gradient-end="' + inputId + '">'
    + '<button type="button" class="mm-fmt-btn" data-action="insert-gradient"'
    + ' data-input-id="' + inputId + '" data-gradient-id="' + gradientId + '">Apply</button>'
    + '</div>'
    + '</div>';
}

// ── Item picker ────────────────────────────────────────
function renderItemPicker(path, currentMaterial) {
  const mat = (currentMaterial || "").toUpperCase();
  const safeId = path.replace(/[^a-z0-9]/gi, "_");
  const buttons = PICKER_MATERIALS.map((m) => {
    const cands = iconCandidates(m, state.preview.iconTemplate);
    const abbrev = m.split("_").map((p) => p[0]).join("").slice(0, 3);
    return '<button type="button" class="item-picker-btn' + (m === mat ? ' selected' : '') + '"'
      + ' title="' + m + '" data-action="pick-item" data-material="' + m + '" data-path="' + attr(path) + '">'
      + '<img src="' + attr(cands[0]) + '" alt="' + m
      + '" data-candidates="' + attr(cands.join("|")) + '" data-index="0" class="ip-img"' + playerHeadImageAttr(m) + '>'
      + '<span class="ip-fallback">' + abbrev + '</span>'
      + '</button>';
  }).join("");
  return '<div class="item-picker-wrap">'
    + '<div class="item-picker-custom">'
    + '<input type="text" class="item-picker-custom-input" data-path="' + attr(path) + '"'
    + ' value="' + attr(mat) + '" placeholder="Custom material, e.g. OAK_SIGN">'
    + '</div>'
    + '<input type="text" class="item-picker-search" placeholder="Filter materials\u2026"'
    + ' autocomplete="off" data-picker-search="' + attr(path) + '" id="picker-search-' + safeId + '">'
    + '<div class="item-picker-grid" id="picker-grid-' + safeId + '">' + buttons + '</div>'
    + '</div>';
}

// ── Tag editor ─────────────────────────────────────────
function renderTagEditor(tagId) {
  const tag = state.config.deluxetags[tagId];
  if (!tag) return renderHint();
  const base = "config.deluxetags." + tagId;
  const cats = categoryIds(false);
  const matCands = iconCandidates(tag.item || "NAME_TAG", state.preview.iconTemplate);
  const bannerFb = (tag.item || "NAME_TAG").split("_").map((p) => p[0]).join("").slice(0, 3);
  const safe = tagId.replace(/[^a-z0-9]/gi, "_");
  const tagInputId = "tag-text-" + safe;
  const dnInputId  = "tag-dn-" + safe;
  const descInputId = "tag-desc-" + safe;
  const descVal = Array.isArray(tag.description) ? tag.description.join("\n") : (tag.description || "");
  const catOptions = cats.map((id) =>
    '<option value="' + attr(id) + '"' + selectedAttr(id, tag.category) + '>' + html(id) + '</option>'
  ).join("") + (cats.includes(tag.category) ? "" :
    '<option value="' + attr(tag.category) + '" selected>' + html(tag.category) + '</option>');

  return '<div class="ctx-header">'
    + '<div class="ctx-header-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/><path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z"/></svg></div>'
    + '<div class="ctx-header-text"><strong>' + formatTextHtml(tag.tag || tagId, state.config)
    + '</strong><small>' + html(tagId) + '</small></div>'
    + '<button type="button" class="ctx-delete-btn" data-action="delete-selected-tag" title="Delete tag">\u2715</button>'
    + '</div>'
    + '<div class="ctx-body">'
    + '<div class="tag-banner">'
    + '<div class="tag-banner-preview">' + formatTextHtml(tag.tag || textForMode("&7[&fTag&7]"), state.config) + '</div>'
    + '<div class="tag-banner-icon">'
    + '<img src="' + attr(matCands[0]) + '" alt="' + attr(tag.item)
    + '" data-candidates="' + attr(matCands.join("|")) + '" data-index="0" class="item-icon"' + playerHeadImageAttr(tag.item) + '>'
    + '<span class="item-fallback-sm">' + html(bannerFb) + '</span>'
    + '</div></div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Tag Text</span>'
    + renderStyledTextBox(tagInputId, base + ".tag", tag.tag, {
      placeholder: textForMode("&7[&eVIP&7]")
    })
    + renderColorHelper(tagInputId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Display Name</span>'
    + renderStyledTextBox(dnInputId, base + ".displayname", tag.displayname, {
      placeholder: textForMode("&6Tag: %deluxetags_identifier%")
    })
    + renderColorHelper(dnInputId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Description</span>'
    + renderStyledTextBox(descInputId, base + ".description", descVal, {
      lines: true,
      rows: 3
    })
    + renderColorHelper(descInputId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Item</span>'
    + renderItemPicker(base + ".item", tag.item) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Permission</span>'
    + '<input type="text" data-path="' + base + '.permission" value="' + attr(tag.permission)
    + '" placeholder="deluxetags.tag.' + html(tagId) + '"></div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Category</span>'
    + '<select data-path="' + base + '.category">' + catOptions + '</select></div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Rename ID</span>'
    + '<div class="rename-row">'
    + '<input type="text" id="tag-rename-input" value="' + attr(tagId) + '" placeholder="' + attr(tagId) + '">'
    + '<button type="button" data-action="rename-tag">Apply</button></div></div>'
    + '</div>';
}

// ── Category editor ────────────────────────────────────
function renderCategoryEditor(catId) {
  const cat = state.config.categories[catId];
  if (!cat) return renderHint();
  const base = "config.categories." + catId;
  const isAll = catId === "all";
  const safe = catId.replace(/[^a-z0-9]/gi, "_");
  const nameId = "cat-name-" + safe;
  const guiId  = "cat-gui-" + safe;
  const loreId = "cat-lore-" + safe;
  const matCands = iconCandidates(cat.item || "NAME_TAG", state.preview.iconTemplate);
  const bannerFb = (cat.item || "NAME_TAG").split("_").map((p) => p[0]).join("").slice(0, 3);
  const loreVal  = Array.isArray(cat.lore) ? cat.lore.join("\n") : (cat.lore || "");

  return '<div class="ctx-header">'
    + '<div class="ctx-header-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M1.5 13.5V4.5h5.5l1.5-2H14.5v11z"/></svg></div>'
    + '<div class="ctx-header-text"><strong>' + formatTextHtml(cat.name || catId, state.config)
    + '</strong><small>' + html(catId) + '</small></div>'
    + (isAll ? "" : '<button type="button" class="ctx-delete-btn" data-action="delete-selected-category" title="Delete category">\u2715</button>')
    + '</div>'
    + '<div class="ctx-body">'
    + '<div class="tag-banner">'
    + '<div class="tag-banner-preview">' + formatTextHtml(cat.name || catId, state.config) + '</div>'
    + '<div class="tag-banner-icon">'
    + '<img src="' + attr(matCands[0]) + '" alt="' + attr(cat.item)
    + '" data-candidates="' + attr(matCands.join("|")) + '" data-index="0" class="item-icon"' + playerHeadImageAttr(cat.item) + '>'
    + '<span class="item-fallback-sm">' + html(bannerFb) + '</span>'
    + '</div></div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Category Name</span>'
    + renderStyledTextBox(nameId, base + ".name", cat.name, {
      placeholder: textForMode("&6Category Name")
    })
    + renderColorHelper(nameId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Menu Title</span>'
    + renderStyledTextBox(guiId, base + ".gui_name", cat.gui_name, {
      placeholder: textForMode("&6Category Tags")
    })
    + renderColorHelper(guiId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Lore</span>'
    + renderStyledTextBox(loreId, base + ".lore", loreVal, {
      lines: true,
      rows: 3
    })
    + renderColorHelper(loreId) + '</div>'
    + '<div class="ctx-section"><span class="ctx-section-label">Item</span>'
    + renderItemPicker(base + ".item", cat.item) + '</div>'
    + (isAll ? "" :
      '<div class="ctx-section"><span class="ctx-section-label">Rename ID</span>'
      + '<div class="rename-row">'
      + '<input type="text" id="cat-rename-input" value="' + attr(catId) + '" placeholder="' + attr(catId) + '">'
      + '<button type="button" data-action="rename-category">Apply</button></div></div>'
    )
    + '</div>';
}

// ── Static item editor ─────────────────────────────────
const STATIC_LABELS = {
  divider_item:       { label: "Divider",        icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h10"/></svg>' },
  has_tag_item:       { label: "Current Tag",     icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.5l4 4 7-7"/></svg>' },
  no_tag_item:        { label: "No Tag",          icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/><path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z"/><path d="M4 4l8 8" stroke-width="1.8"/></svg>' },
  exit_item:          { label: "Exit Button",     icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14V2h8v12"/><path d="M1.5 14h13"/><circle cx="10.5" cy="8.5" r=".7" fill="currentColor" stroke="none"/></svg>' },
  category_back_item: { label: "Category Back",   icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5L5.5 8l5 4.5"/></svg>' },
  next_page:          { label: "Next Page",       icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5L10.5 8l-5 4.5"/></svg>' },
  previous_page:      { label: "Previous Page",   icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5L5.5 8l5 4.5"/></svg>' },
  tag_visible_item:   { label: "Locked Tag",      icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><rect x="2.5" y="7" width="11" height="7.5" rx="1.5"/><path d="M5 7V5.5a3 3 0 016 0V7"/></svg>' },
};

function renderStaticEditor(key) {
  const item = state.config.gui[key];
  if (!item) return renderHint();
  const base = "config.gui." + key;
  const info = STATIC_LABELS[key] || { label: key, icon: '<svg class="ctx-icon" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.19 2.54c-.3-1.25-2.08-1.25-2.38 0a1.226 1.226 0 01-1.829.758c-1.097-.668-2.353.587-1.685 1.684a1.226 1.226 0 01-.757 1.83c-1.25.303-1.25 2.08 0 2.382a1.226 1.226 0 01.757 1.83c-.668 1.097.588 2.352 1.685 1.684a1.226 1.226 0 011.829.757c.303 1.25 2.08 1.25 2.38 0a1.227 1.227 0 011.83-.757c1.096.668 2.352-.587 1.684-1.685a1.227 1.227 0 01.758-1.829c1.25-.302 1.25-2.08 0-2.382a1.226 1.226 0 01-.758-1.83c.668-1.096-.588-2.352-1.685-1.684a1.226 1.226 0 01-1.83-.757zM8 10.4a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z"/></svg>' };
  const isVisible = key === "tag_visible_item";
  const dnId = "static-dn-" + key;
  const loreId = "static-lore-" + key;
  const loreVal = Array.isArray(item.lore) ? item.lore.join("\n") : (item.lore || "");
  const slotsVal = Array.isArray(item.slots) ? item.slots.join(", ") : (item.slots || "");

  return '<div class="ctx-header">'
    + '<div class="ctx-header-icon">' + info.icon + '</div>'
    + '<div class="ctx-header-text"><strong>' + html(info.label) + '</strong><small>' + html(key) + '</small></div>'
    + '</div>'
    + '<div class="ctx-body">'
    + '<div class="ctx-section"><span class="ctx-section-label">Item</span>'
    + renderItemPicker(base + ".material", item.material) + '</div>'
    + (isVisible ? "" :
      '<div class="ctx-section"><span class="ctx-section-label">Display Name</span>'
      + renderStyledTextBox(dnId, base + ".displayname", item.displayname || "", {
        placeholder: "Display name..."
      })
      + renderColorHelper(dnId) + '</div>'
      + '<div class="ctx-section"><span class="ctx-section-label">Lore</span>'
      + renderStyledTextBox(loreId, base + ".lore", loreVal, {
        lines: true,
        rows: 3
      })
      + renderColorHelper(loreId) + '</div>'
      + '<div class="ctx-section"><span class="ctx-section-label">Slots</span>'
      + '<input type="text" data-path="' + base + '.slots" value="' + attr(slotsVal) + '" placeholder="e.g. 45, 47-53">'
      + '<small style="color:#555;font-size:11px;display:block;margin-top:4px">Use slot numbers or ranges like 36-44.</small>'
      + '</div>'
    )
    + '</div>';
}

// ── Empty slot action picker ───────────────────────────
function renderEmptySlotActions() {
  return '<div class="ctx-header">'
    + '<div class="ctx-header-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><rect x="1.5" y="1.5" width="4" height="4" rx=".5"/><rect x="6.5" y="1.5" width="4" height="4" rx=".5"/><rect x="11.5" y="1.5" width="3" height="4" rx=".5"/><rect x="1.5" y="7" width="4" height="4" rx=".5"/><rect x="6.5" y="7" width="4" height="4" rx=".5"/><rect x="11.5" y="7" width="3" height="4" rx=".5"/></svg></div>'
    + '<div class="ctx-header-text"><strong>Slot ' + selectedSlot + '</strong>'
    + '<small>Empty \u2014 choose what to add</small></div>'
    + '</div>'
    + '<div class="ctx-slot-label">What goes here?</div>'
    + '<div class="slot-action-grid">'
    + '<button type="button" class="slot-action-btn primary-action" data-action="add-slot-tag">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none"/><path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z"/></svg></span><span class="action-label">Add a Tag</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-slot-category">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M1.5 13.5V4.5h5.5l1.5-2H14.5v11z"/></svg></span><span class="action-label">Category</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="divider_item">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h10"/></svg></span><span class="action-label">Divider</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="exit_item">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14V2h8v12"/><path d="M1.5 14h13"/><circle cx="10.5" cy="8.5" r=".7" fill="currentColor" stroke="none"/></svg></span><span class="action-label">Exit</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="category_back_item">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5L5.5 8l5 4.5"/></svg></span><span class="action-label">Back</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="next_page">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5L10.5 8l-5 4.5"/></svg></span><span class="action-label">Next Page</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="previous_page">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5L5.5 8l5 4.5"/></svg></span><span class="action-label">Prev Page</span></button>'
    + '<button type="button" class="slot-action-btn" data-action="add-static-slot" data-static-key="has_tag_item">'
    + '<span class="action-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.5l4 4 7-7"/></svg></span><span class="action-label">Current Tag</span></button>'
    + '</div>';
}

// ── Hint state ─────────────────────────────────────────
function renderHint() {
  return '<div class="ctx-hint">'
    + '<div class="ctx-hint-icon"><svg class="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><rect x="1.5" y="1.5" width="4" height="4" rx=".5"/><rect x="6.5" y="1.5" width="4" height="4" rx=".5"/><rect x="11.5" y="1.5" width="3" height="4" rx=".5"/><rect x="1.5" y="7" width="4" height="4" rx=".5"/><rect x="6.5" y="7" width="4" height="4" rx=".5"/><rect x="11.5" y="7" width="3" height="4" rx=".5"/></svg></div>'
    + '<h2>Click a slot to edit</h2>'
    + '<p>Click any slot in the inventory to edit it, or click an empty slot to add a tag, category, or button.</p>'
    + '<div class="ctx-hint-actions">'
    + '<button type="button" class="primary" data-action="add-tag-direct">+ Add Tag</button>'
    + '<button type="button" class="secondary" data-action="add-category-direct">+ Add Category</button>'
    + '</div></div>';
}

// ── Context panel dispatch ─────────────────────────────
function renderContextPanel() {
  refreshSelectedItem();
  if (selectedSlot == null) { contextPanel.innerHTML = renderHint(); return; }
  if (!selectedPreviewItem) { contextPanel.innerHTML = renderEmptySlotActions(); return; }
  const ref = selectedPreviewItem.ref || {};
  if (ref.kind === "tag") {
    selectedTag = ref.id;
    contextPanel.innerHTML = renderTagEditor(ref.id);
  } else if (ref.kind === "category") {
    selectedCategory = ref.id;
    contextPanel.innerHTML = renderCategoryEditor(ref.id);
  } else if (ref.kind === "static") {
    contextPanel.innerHTML = renderStaticEditor(ref.id);
  } else {
    contextPanel.innerHTML = renderHint();
  }
}

// ── Inventory area ─────────────────────────────────────
function renderInventoryArea() {
  const preview = buildPreview(state.config, state.preview);
  currentPreview = preview;
  const rows = Math.ceil(preview.slots.length / 9);
  inventoryContent.innerHTML =
    '<div class="inventory-shell">'
    + '<div class="inventory-title"><strong>' + formatTextHtml(preview.title, state.config)
    + '</strong><span>' + html(preview.screen) + ' \u00b7 page ' + preview.page + '/' + preview.pages + '</span></div>'
    + '<div class="inventory-grid" style="--rows:' + rows + '">'
    + preview.slots.map((item, i) => renderSlot(item, i)).join("")
    + '</div></div>'
    + '<div class="page-nav">'
    + '<button type="button" data-action="preview-prev"' + (preview.page <= 1 ? " disabled" : "") + '>\u25c4</button>'
    + '<span>Page ' + preview.page + ' of ' + preview.pages + '</span>'
    + '<button type="button" data-action="preview-next"' + (preview.page >= preview.pages ? " disabled" : "") + '>\u25ba</button>'
    + '</div>';
}

// ── Settings modal ─────────────────────────────────────
function buildSettingsHtml() {
  const tags = tagIds();
  return '<div class="modal-card wide">'
    + '<div class="modal-header"><h2>Settings</h2>'
    + '<button type="button" class="modal-close-btn" data-action="close-settings">\u2715</button></div>'
    + '<div class="modal-body">'
    + '<div class="settings-group"><div class="settings-group-label">Text Formatting</div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-mm">Use MiniMessage'
    + '<small>Use &lt;red&gt;, &lt;bold&gt; tags instead of &amp;c, &amp;l codes.</small>'
    + '</label><input type="checkbox" id="s-mm" data-path="config.use_minimessage"' + boolAttr(state.config.use_minimessage) + '></div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-hex">Legacy hex colors'
    + '<small>Use &amp;#RRGGBB instead of #RRGGBB for hex colors.</small>'
    + '</label><input type="checkbox" id="s-hex" data-path="config.legacy_hex"' + boolAttr(state.config.legacy_hex) + '></div></div>'
    + '<div class="settings-group"><div class="settings-group-label">Plugin Behaviour</div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-ft">Force tags'
    + '<small>Require players to always have a tag selected.</small>'
    + '</label><input type="checkbox" id="s-ft" data-path="config.force_tags"' + boolAttr(state.config.force_tags) + '></div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-ltj">Load tag on join'
    + '<small>Restore a player\'s last tag when they join.</small>'
    + '</label><input type="checkbox" id="s-ltj" data-path="config.load_tag_on_join"' + boolAttr(state.config.load_tag_on_join) + '></div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-cu">Check for updates'
    + '<small>Notify admins when a new version is released.</small>'
    + '</label><input type="checkbox" id="s-cu" data-path="config.check_updates"' + boolAttr(state.config.check_updates) + '></div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-pc">PAPI chat support'
    + '<small>Parse PlaceholderAPI tags in chat messages.</small>'
    + '</label><input type="checkbox" id="s-pc" data-path="config.papi_chat"' + boolAttr(state.config.papi_chat) + '></div></div>'
    + '<div class="settings-group"><div class="settings-group-label">Chat Format</div>'
    + '<div class="settings-toggle-row"><label class="settings-toggle-label" for="s-fce">Enable chat format'
    + '</label><input type="checkbox" id="s-fce" data-path="config.format_chat.enabled"' + boolAttr(state.config.format_chat.enabled) + '></div>'
    + '<div class="field" style="margin-top:8px"><span>Format string</span>'
    + '<input type="text" data-path="config.format_chat.format" value="' + attr(state.config.format_chat.format)
    + '" placeholder="%deluxetags_tag% %1$s: %2$s">'
    + '<small>%1$s = player name, %2$s = message.</small></div>'
    + '<div class="chat-preview" style="font-family:PixelCraft;font-size:18px">'
    + formatTextHtml(state.config.format_chat.format.replace("%1$s", state.preview.playerName || "Steve").replace("%2$s", "Hello there!"), state.config)
    + '</div></div>'
    + '<div class="settings-group"><div class="settings-group-label">Inventory</div>'
    + '<div class="field"><span>Menu size</span><select data-path="config.gui.size">'
    + [9, 18, 27, 36, 45, 54].map((s) => '<option value="' + s + '"' + selectedAttr(s, state.config.gui.size) + '>' + s + ' slots</option>').join("")
    + '</select></div>'
    + '<div class="field"><span>Menu title</span>'
    + '<input type="text" data-path="config.gui.name" value="' + attr(state.config.gui.name) + '" placeholder="Tags Menu"></div></div>'
    + '<div class="settings-group"><div class="settings-group-label">Preview</div>'
    + '<div class="form-grid two">'
    + '<div class="field"><span>Player name</span>'
    + '<input type="text" data-path="preview.playerName" value="' + attr(state.preview.playerName || "") + '" placeholder="Steve"></div>'
    + '<div class="field"><span>Active tag</span><select data-path="preview.activeTagId"><option value="">None</option>'
    + tags.map((id) => '<option value="' + attr(id) + '"' + selectedAttr(id, state.preview.activeTagId) + '>' + html(id) + '</option>').join("")
    + '</select></div>'
    + '<div class="field"><span>Screen</span><select data-path="preview.screen">'
    + '<option value="auto"' + selectedAttr("auto", state.preview.screen) + '>Auto</option>'
    + '<option value="categories"' + selectedAttr("categories", state.preview.screen) + '>Categories</option>'
    + '<option value="tags"' + selectedAttr("tags", state.preview.screen) + '>Tags</option>'
    + '</select></div>'
    + '<div class="field"><span>Permissions</span><select data-path="preview.permissionMode">'
    + '<option value="all"' + selectedAttr("all", state.preview.permissionMode) + '>All unlocked</option>'
    + '<option value="none"' + selectedAttr("none", state.preview.permissionMode) + '>All locked</option>'
    + '</select></div>'
    + '</div></div>'
    + '</div>'
    + '<div class="modal-footer"><button type="button" class="secondary" data-action="close-settings">Close</button></div>'
    + '</div>';
}

function openSettingsModal() {
  if (document.getElementById("settings-modal")) return;
  const el = document.createElement("div");
  el.id = "settings-modal";
  el.className = "modal-backdrop";
  el.innerHTML = buildSettingsHtml();
  document.body.appendChild(el);
}

function closeSettingsModal() { document.getElementById("settings-modal")?.remove(); }

// ── Import modal ───────────────────────────────────────
function openImportModal() {
  if (document.getElementById("import-modal")) return;
  const el = document.createElement("div");
  el.id = "import-modal";
  el.className = "modal-backdrop";
  el.innerHTML = '<div class="modal-card">'
    + '<div class="modal-header"><h2>Import config.yml</h2>'
    + '<button type="button" class="modal-close-btn" data-action="close-import">\u2715</button></div>'
    + '<div class="modal-body">'
    + '<p style="color:#888;font-size:12px;margin:0 0 10px">Paste your existing config.yml here. Older DeluxeTags formats are supported.</p>'
    + '<textarea id="yaml-import-area" rows="14" spellcheck="false" placeholder="Paste config.yml here...">'
    + html(state.yamlDraft || "") + '</textarea></div>'
    + '<div class="modal-footer">'
    + '<button type="button" class="secondary" data-action="close-import">Cancel</button>'
    + '<button type="button" class="primary" data-action="do-import">Import</button>'
    + '</div></div>';
  document.body.appendChild(el);
}

function closeImportModal() { document.getElementById("import-modal")?.remove(); }

// ── Render pipeline ────────────────────────────────────
function renderAll() {
  ensureSelections();
  renderInventoryArea();
  renderContextPanel();
}

function renderLive() {
  state.yamlError = null;
  ensureSelections();
  renderInventoryArea();
  refreshSelectedItem();
}

// ── Action handler ─────────────────────────────────────
function handleAction(action, target) {
  switch (action) {
    case "preview-prev":
      state.preview.page = Math.max(1, (Number.parseInt(state.preview.page, 10) || 1) - 1);
      renderAll(); break;
    case "preview-next": {
      const p = buildPreview(state.config, state.preview);
      state.preview.page = Math.min(p.pages, p.page + 1);
      renderAll(); break;
    }
    case "add-slot-tag":
      if (selectedSlot != null) addTagAtSlot(selectedSlot); break;
    case "add-slot-category":
      if (selectedSlot != null) addCategoryAtSlot(selectedSlot); break;
    case "add-static-slot":
      if (selectedSlot != null) setStaticItemAtSlot(target.dataset.staticKey, selectedSlot); break;
    case "add-tag-direct": addTag(); break;
    case "add-category-direct": addCategory(); break;
    case "delete-selected-tag": deleteTag(selectedTag); break;
    case "delete-selected-category": deleteCategory(selectedCategory); break;
    case "rename-tag": {
      const inp = document.getElementById("tag-rename-input");
      if (inp) renameTag(selectedTag, inp.value); break;
    }
    case "rename-category": {
      const inp = document.getElementById("cat-rename-input");
      if (inp) renameCategory(selectedCategory, inp.value); break;
    }
    case "pick-item":
      setByPath(state, target.dataset.path, target.dataset.material);
      renderAll(); break;
    case "open-hex-picker": {
      const picker = document.getElementById(target.dataset.pickerId || "");
      if (picker) picker.click();
      break;
    }
    case "open-gradient-picker": {
      const panel = document.getElementById(target.dataset.gradientId || "");
      if (panel) {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) panel.querySelector("input")?.focus();
      }
      break;
    }
    case "insert-gradient": {
      const panel = document.getElementById(target.dataset.gradientId || "");
      const start = (panel?.querySelector("[data-gradient-start]")?.value || "#55ffff").toLowerCase();
      const end = (panel?.querySelector("[data-gradient-end]")?.value || "#ff55ff").toLowerCase();
      applyStyledEditorWrapper(
        document.getElementById(target.dataset.inputId) || lastFocusedInput,
        `<gradient:${start}:${end}>`,
        "</gradient>"
      );
      if (panel) panel.hidden = true;
      break;
    }
    case "insert-color":
    case "insert-format": {
      const code = target.dataset.code;
      let inp = lastFocusedInput;
      if (target.dataset.inputId) inp = document.getElementById(target.dataset.inputId) || inp;
      if (state.config.use_minimessage && target.dataset.mmTag) {
        applyStyledEditorWrapper(inp, `<${target.dataset.mmTag}>`, `</${target.dataset.mmTag}>`);
      } else {
        insertAtCursor(inp, code);
      }
      break;
    }
    case "open-settings": openSettingsModal(); break;
    case "close-settings": closeSettingsModal(); break;
    case "open-import": openImportModal(); break;
    case "close-import": closeImportModal(); break;
    case "do-import": {
      const ta = document.getElementById("yaml-import-area");
      if (ta) { importYaml(ta.value); closeImportModal(); } break;
    }
    case "nav-download": downloadYaml(); break;
  }
}

// ── Event listeners ────────────────────────────────────
document.addEventListener("focusin", (e) => {
  const t = e.target;
  if (t.dataset?.styledEditor === "true" || (t.tagName === "INPUT" && t.type === "text") || t.tagName === "TEXTAREA") {
    lastFocusedInput = t;
    if (t.dataset?.styledEditor === "true") rememberStyledEditorSelection(t);
  }
});

document.addEventListener("selectionchange", () => {
  if (lastFocusedInput?.dataset?.styledEditor === "true") {
    rememberStyledEditorSelection(lastFocusedInput);
  }
});

document.addEventListener("mousedown", (e) => {
  const action = e.target.closest?.("[data-action]");
  if (action && action.closest(".mm-helper")) {
    if (lastFocusedInput?.dataset?.styledEditor === "true") {
      rememberStyledEditorSelection(lastFocusedInput);
    }
    e.preventDefault();
  }
});

document.addEventListener("keydown", (e) => {
  const editor = e.target.closest?.('[data-styled-editor="true"]');
  if (!editor || e.key !== "Enter") return;
  e.preventDefault();
  if (editor.dataset.singleLine === "true") return;
  document.execCommand("insertText", false, "\n");
});

document.addEventListener("paste", (e) => {
  const editor = e.target.closest?.('[data-styled-editor="true"]');
  if (!editor) return;
  e.preventDefault();
  let text = e.clipboardData?.getData("text/plain") || "";
  if (editor.dataset.singleLine === "true") text = text.replace(/\r?\n/g, " ");
  document.execCommand("insertText", false, text);
});

app.addEventListener("input", (e) => {
  const t = e.target;
  if (!t.dataset.path) return;
  if (t.dataset.styledEditor === "true") syncStyledEditorInput(t);
  setByPath(state, t.dataset.path, inputValue(t));
  renderLive();
});

app.addEventListener("change", (e) => {
  const t = e.target;
  if (!t.dataset.path) return;
  if (t.dataset.styledEditor === "true") syncStyledEditorInput(t);
  setByPath(state, t.dataset.path, inputValue(t));
  if (t.dataset.path === "config.use_minimessage" && t.checked) {
    convertConfigTextToMiniMessage(state.config);
  }
  renderAll();
});

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.pickerSearch) {
    const q = t.value.trim().toLowerCase();
    const grid = document.getElementById("picker-grid-" + t.dataset.pickerSearch.replace(/[^a-z0-9]/gi, "_"));
    if (grid) grid.querySelectorAll(".item-picker-btn").forEach((btn) => {
      btn.classList.toggle("hidden", q.length > 0 && !(btn.dataset.material || "").toLowerCase().includes(q));
    });
    return;
  }
  if (!t.dataset.path || t.closest("#builder-app")) return;
  setByPath(state, t.dataset.path, inputValue(t));
  const prev = document.querySelector("#settings-modal .chat-preview");
  if (prev) prev.innerHTML = formatTextHtml(
    state.config.format_chat.format
      .replace("%1$s", state.preview.playerName || "Steve")
      .replace("%2$s", "Hello there!"),
    state.config
  );
  renderInventoryArea();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.hexInputId) {
    applyStyledEditorWrapper(
      document.getElementById(t.dataset.hexInputId) || lastFocusedInput,
      "<color:" + t.value.toLowerCase() + ">",
      "</color>"
    );
    return;
  }
  if (!t.dataset.path || t.closest("#builder-app")) return;
  setByPath(state, t.dataset.path, inputValue(t));
  if (t.dataset.path === "config.use_minimessage" && t.checked) {
    convertConfigTextToMiniMessage(state.config);
  }
  const needsRebuild = t.dataset.path === "config.use_minimessage" || t.dataset.path === "config.legacy_hex";
  if (needsRebuild) {
    const wasOpen = !!document.getElementById("settings-modal");
    if (wasOpen) { closeSettingsModal(); openSettingsModal(); }
  }
  renderAll();
});

document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) { handleAction(actionEl.dataset.action, actionEl); return; }
  if (e.target.id === "settings-modal") closeSettingsModal();
  if (e.target.id === "import-modal")   closeImportModal();
});

inventoryContent.addEventListener("click", (e) => {
  const slot = e.target.closest(".mc-slot");
  if (slot && !e.target.closest("[data-action]")) {
    if (slot.dataset.empty === "true") {
      addTagAtSlot(Number.parseInt(slot.dataset.slot, 10));
      return;
    }
    selectSlot(slot.dataset.slot);
    renderAll();
  }
});

inventoryContent.addEventListener("dragstart", (e) => {
  const slot = e.target.closest('.mc-slot[draggable="true"]');
  if (!slot) return;
  draggedSlot = Number.parseInt(slot.dataset.slot, 10);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(draggedSlot));
});

inventoryContent.addEventListener("dragover", (e) => {
  if (e.target.closest(".mc-slot") && draggedSlot != null) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
});

inventoryContent.addEventListener("drop", (e) => {
  const slot = e.target.closest(".mc-slot");
  if (!slot || draggedSlot == null) return;
  e.preventDefault();
  movePreviewItem(draggedSlot, Number.parseInt(slot.dataset.slot, 10));
  draggedSlot = null;
});

inventoryContent.addEventListener("dragend", () => { draggedSlot = null; });

document.addEventListener("error", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (!img.classList.contains("item-icon") && !img.classList.contains("ip-img")) return;
  const cands = (img.dataset.candidates || "").split("|").filter(Boolean);
  const next = Number.parseInt(img.dataset.index || "0", 10) + 1;
  if (cands[next]) { img.classList.remove("failed"); img.dataset.index = String(next); img.src = cands[next]; }
  else img.classList.add("failed");
}, true);

document.addEventListener("load", (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (!img.classList.contains("item-icon") && !img.classList.contains("ip-img")) return;
  if (upgradePlayerHeadTexture(img)) return;
  img.classList.remove("failed");
}, true);

document.getElementById("nav-import-btn").addEventListener("click", openImportModal);
document.getElementById("nav-download-btn").addEventListener("click", downloadYaml);
document.getElementById("nav-settings-btn").addEventListener("click", openSettingsModal);

window.DeluxeTagsBuilder = {
  get state() { return clone(state); },
  load(config) {
    state.config = normalizeImportedConfig(config);
    if (state.config.use_minimessage) convertConfigTextToMiniMessage(state.config);
    renderAll();
  },
  getYaml() { return getExportYaml(); },
  getByPath(path) { return getByPath(state, path); },
};

renderAll();
})();
