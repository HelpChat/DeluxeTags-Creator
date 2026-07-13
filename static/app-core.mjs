export const TOP_LEVEL_ORDER = Object.freeze([
  "use_minimessage",
  "force_tags",
  "check_updates",
  "legacy_hex",
  "papi_chat",
  "format_chat",
  "load_tag_on_join",
  "gui",
  "categories",
  "deluxetags"
]);

export const STATIC_ITEM_KEYS = Object.freeze([
  "divider_item",
  "has_tag_item",
  "no_tag_item",
  "exit_item",
  "category_back_item",
  "next_page",
  "previous_page"
]);

export const DEFAULT_ICON_TEMPLATE =
  "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.4/assets/minecraft/textures/{folder}/{id}.png";

const MINI_COLORS = Object.freeze({
  black: "&0",
  dark_blue: "&1",
  dark_green: "&2",
  dark_aqua: "&3",
  dark_red: "&4",
  dark_purple: "&5",
  gold: "&6",
  gray: "&7",
  grey: "&7",
  dark_gray: "&8",
  dark_grey: "&8",
  blue: "&9",
  green: "&a",
  aqua: "&b",
  red: "&c",
  light_purple: "&d",
  yellow: "&e",
  white: "&f"
});

const LEGACY_COLORS = Object.freeze({
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  a: "#55ff55",
  b: "#55ffff",
  c: "#ff5555",
  d: "#ff55ff",
  e: "#ffff55",
  f: "#ffffff"
});

const LEGACY_FORMATS = Object.freeze({
  l: "bold",
  o: "italic",
  n: "underline",
  m: "strikethrough",
  k: "obfuscated"
});

const KNOWN_MINI_TAGS = new Set([
  ...Object.keys(MINI_COLORS),
  "color",
  "colour",
  "c",
  "shadow",
  "bold",
  "b",
  "italic",
  "em",
  "i",
  "underlined",
  "u",
  "strikethrough",
  "st",
  "obfuscated",
  "obf",
  "reset",
  "newline",
  "br",
  "gradient",
  "rainbow",
  "transition",
  "font",
  "click",
  "hover",
  "keybind",
  "key",
  "lang",
  "tr",
  "translate",
  "lang_or",
  "tr_or",
  "translate_or",
  "insert",
  "selector",
  "sel",
  "score",
  "nbt",
  "data",
  "pride",
  "sprite",
  "head"
]);

const KNOWN_PLACEHOLDERS = new Set([
  "player",
  "displayname",
  "deluxetags_tag",
  "deluxetags_identifier",
  "deluxetags_description",
  "deluxetags_amount",
  "deluxetags_category_amount",
  "deluxetags_available",
  "previous_page",
  "current_page",
  "next_page"
]);

export const COMMON_MATERIALS = new Set([
  "AIR",
  "ARROW",
  "BARRIER",
  "BLACK_STAINED_GLASS_PANE",
  "BOOK",
  "CHEST",
  "CLOCK",
  "COMPASS",
  "DIAMOND",
  "DIAMOND_BLOCK",
  "DIAMOND_SWORD",
  "EMERALD",
  "EMERALD_BLOCK",
  "ENDER_PEARL",
  "FEATHER",
  "GOLD_INGOT",
  "GOLD_BLOCK",
  "GOLDEN_APPLE",
  "GRASS_BLOCK",
  "GRAY_STAINED_GLASS_PANE",
  "GREEN_STAINED_GLASS_PANE",
  "IRON_DOOR",
  "IRON_INGOT",
  "LIME_STAINED_GLASS_PANE",
  "NAME_TAG",
  "NETHER_STAR",
  "PAPER",
  "PLAYER_HEAD",
  "RED_STAINED_GLASS_PANE",
  "REDSTONE",
  "REDSTONE_TORCH",
  "STONE",
  "WHITE_STAINED_GLASS_PANE",
  "WRITABLE_BOOK",
  "WRITTEN_BOOK",
  "YELLOW_STAINED_GLASS_PANE"
]);

const MATERIAL_ALIASES = Object.freeze({
  CREEPER_WALL_HEAD: "CREEPER_HEAD",
  PIGLIN_WALL_HEAD: "PIGLIN_HEAD",
  PLAYER_SKULL: "PLAYER_HEAD",
  PLAYER_WALL_HEAD: "PLAYER_HEAD",
  SKULL: "PLAYER_HEAD",
  SKULL_ITEM: "PLAYER_HEAD",
  SKELETON_WALL_SKULL: "SKELETON_SKULL",
  WITHER_SKELETON_WALL_SKULL: "WITHER_SKELETON_SKULL",
  ZOMBIE_WALL_HEAD: "ZOMBIE_HEAD"
});

export const DEFAULT_CONFIG = Object.freeze({
  use_minimessage: false,
  force_tags: false,
  check_updates: true,
  legacy_hex: false,
  papi_chat: true,
  format_chat: {
    enabled: false,
    format: "{deluxetags_tag} <%1$s> %2$s"
  },
  load_tag_on_join: true,
  gui: {
    tag_availability_placeholder: {
      has_permission: "&aTag unlocked! Click to select",
      no_permission: "&cTag locked "
    },
    name: "&6Available tags&f: &6%deluxetags_amount%",
    size: 54,
    tag_slots: ["0-35"],
    tag_visible_item: {
      material: "BARRIER",
      data: 0
    },
    divider_item: {
      material: "BLACK_STAINED_GLASS_PANE",
      data: 0,
      displayname: "",
      lore: [],
      slots: ["36-44"]
    },
    has_tag_item: {
      material: "PLAYER_HEAD",
      data: 0,
      displayname: "&eCurrent tag&f: &6%deluxetags_identifier%",
      lore: ["%deluxetags_tag%", "Click to remove your current tag"],
      slots: ["49"]
    },
    no_tag_item: {
      material: "PLAYER_HEAD",
      data: 0,
      displayname: "&cYou don't have a tag set!",
      lore: ["&7Click a tag above to select one!"],
      slots: ["49"]
    },
    exit_item: {
      material: "IRON_DOOR",
      data: 0,
      displayname: "&cClick to exit",
      lore: ["&7Exit the tags menu"],
      slots: ["48", "50"]
    },
    category_back_item: {
      material: "ARROW",
      data: 0,
      displayname: "&6Back to categories",
      lore: ["&7Return to category selection"],
      slots: ["47"]
    },
    next_page: {
      material: "PAPER",
      data: 0,
      displayname: "&6Next page: %next_page%",
      lore: ["&7Move to the next page"],
      slots: ["53"]
    },
    previous_page: {
      material: "PAPER",
      data: 0,
      displayname: "&6Previous page: %previous_page%",
      lore: ["&7Move to the previous page"],
      slots: ["45"]
    }
  },
  categories: {
    all: {
      order: 0,
      item: "BOOK",
      name: "&6All Tags",
      lore: ["&7Click to view all available tags"],
      gui_name: "&6All Tags"
    },
    general: {
      order: 1,
      item: "NAME_TAG",
      name: "&6General",
      lore: ["&7Click to view general tags"],
      gui_name: "&6General tags"
    }
  },
  deluxetags: {
    example: {
      order: 1,
      category: "general",
      tag: "&8[&bDeluxeTags&8]",
      displayname: "&6Tag&f: &6%deluxetags_identifier%",
      description: ["&cAwarded for using DeluxeTags!", "%deluxetags_available%"],
      item: "NAME_TAG",
      data: 0,
      permission: "deluxetags.tag.example"
    }
  }
});

export const DEFAULT_PREVIEW = Object.freeze({
  page: 1,
  screen: "auto",
  category: "all",
  playerName: "Steve",
  displayName: "Steve",
  activeTagId: "example",
  permissionMode: "all",
  unlockedTags: {},
  showLockedTags: true,
  iconTemplate: DEFAULT_ICON_TEMPLATE
});

export function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergePlain(base, override) {
  const output = clone(base);
  if (!isPlainObject(override)) {
    return output;
  }
  for (const key of Object.keys(override)) {
    if (isPlainObject(output[key]) && isPlainObject(override[key])) {
      output[key] = mergePlain(output[key], override[key]);
    } else {
      output[key] = clone(override[key]);
    }
  }
  return output;
}

function toLines(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((line) => String(line));
  }
  if (value == null) {
    return clone(fallback);
  }
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function toSlotEntries(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value == null) {
    return clone(fallback);
  }
  return [String(value)];
}

function normalizeMaterial(value, fallback) {
  const raw = value == null ? fallback : value;
  const normalized = String(raw == null ? "" : raw)
    .trim()
    .replace(/^minecraft:/i, "")
    .replace(/[\s-]+/g, "_")
    .replace(/__+/g, "_")
    .toUpperCase();
  return MATERIAL_ALIASES[normalized] || normalized;
}

function normalizeData(value, fallback = 0) {
  if (value == null || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : value;
}

function normalizeModelDataComponent(value = {}) {
  return {
    colors: toLines(value.colors),
    flags: toLines(value.flags),
    floats: toLines(value.floats),
    strings: toLines(value.strings)
  };
}

function normalizeGuiItem(value = {}, defaults = {}, options = {}) {
  const item = {
    material: normalizeMaterial(value.material, defaults.material),
    data: normalizeData(value.data, defaults.data || 0)
  };

  if (options.text !== false) {
    item.displayname = value.displayname == null ? defaults.displayname || "" : String(value.displayname);
    item.lore = toLines(value.lore, defaults.lore || []);
  }

  if (options.slots !== false) {
    item.slots = value.slots != null
      ? toSlotEntries(value.slots, defaults.slots || [])
      : toSlotEntries(value.slot, defaults.slots || []);
  }

  if (value.item_model != null && String(value.item_model).trim() !== "") {
    item.item_model = String(value.item_model).trim();
  }
  if (value.model_data != null && String(value.model_data).trim() !== "") {
    item.model_data = normalizeData(value.model_data, value.model_data);
  }
  if (isPlainObject(value.model_data_component)) {
    item.model_data_component = normalizeModelDataComponent(value.model_data_component);
  }

  return item;
}

function normalizeCategory(identifier, value = {}) {
  const defaults = DEFAULT_CONFIG.categories[identifier] || {
    order: 1,
    item: "NAME_TAG",
    name: `&6${identifier}`,
    lore: [],
    gui_name: `&6${identifier}`
  };

  return {
    order: value.order == null ? defaults.order : value.order,
    item: normalizeMaterial(value.item, defaults.item),
    name: value.name == null ? defaults.name : String(value.name),
    lore: toLines(value.lore, defaults.lore),
    gui_name: value.gui_name == null ? defaults.gui_name : String(value.gui_name)
  };
}

function normalizeTag(identifier, value = {}) {
  return {
    order: value.order == null ? 1 : value.order,
    category: value.category == null || String(value.category).trim() === "" ? "general" : String(value.category),
    tag: value.tag == null ? "" : String(value.tag),
    displayname: value.displayname == null ? "&6Tag&f: &6%deluxetags_identifier%" : String(value.displayname),
    description: toLines(value.description, ["&fDescription for tag " + identifier, "%deluxetags_available%"]),
    item: normalizeMaterial(value.item, "NAME_TAG"),
    data: normalizeData(value.data, 0),
    permission: value.permission == null || String(value.permission).trim() === ""
      ? "deluxetags.tag." + identifier
      : String(value.permission)
  };
}

export function migrateLegacyConfig(rawInput) {
  const raw = clone(rawInput || {});
  raw.gui = isPlainObject(raw.gui) ? raw.gui : {};

  if (isPlainObject(raw.tag_availability_placeholder)) {
    raw.gui.tag_availability_placeholder = isPlainObject(raw.gui.tag_availability_placeholder)
      ? raw.gui.tag_availability_placeholder
      : {};
    for (const key of Object.keys(raw.tag_availability_placeholder)) {
      if (raw.gui.tag_availability_placeholder[key] == null) {
        raw.gui.tag_availability_placeholder[key] = raw.tag_availability_placeholder[key];
      }
    }
    delete raw.tag_availability_placeholder;
  } else if (raw.tag_availability_placeholder != null) {
    delete raw.tag_availability_placeholder;
  }

  const legacyTagItem = raw.gui.tag_select_item;
  if (isPlainObject(legacyTagItem) && isPlainObject(raw.deluxetags)) {
    for (const identifier of Object.keys(raw.deluxetags)) {
      const tag = isPlainObject(raw.deluxetags[identifier]) ? raw.deluxetags[identifier] : {};
      const description = toLines(tag.description, ["&f"]);
      if (tag.category == null || String(tag.category).trim() === "" || String(tag.category).toLowerCase() === "all") {
        tag.category = "general";
      }
      if (tag.displayname == null && legacyTagItem.displayname != null) {
        tag.displayname = legacyTagItem.displayname;
      }
      if (tag.item == null && legacyTagItem.material != null) {
        tag.item = legacyTagItem.material;
      }
      if (tag.data == null && legacyTagItem.data != null) {
        tag.data = legacyTagItem.data;
      }
      if (Array.isArray(legacyTagItem.lore)) {
        const joinedDescription = description.join("\n");
        const expanded = [];
        for (const line of legacyTagItem.lore.map(String)) {
          if (line === "%deluxetags_description%" || line === "{deluxetags_description}") {
            expanded.push(...description);
          } else if (line.includes("%deluxetags_description%") || line.includes("{deluxetags_description}")) {
            expanded.push(
              ...line
                .replaceAll("%deluxetags_description%", joinedDescription)
                .replaceAll("{deluxetags_description}", joinedDescription)
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .split("\n")
            );
          } else {
            expanded.push(line);
          }
        }
        tag.description = expanded;
      } else if (!Array.isArray(tag.description)) {
        tag.description = description;
      }
      raw.deluxetags[identifier] = tag;
    }
  }

  if (isPlainObject(raw.gui.tag_visible_item)) {
    const visible = raw.gui.tag_visible_item;
    raw.gui.tag_visible_item = {
      material: visible.material || DEFAULT_CONFIG.gui.tag_visible_item.material,
      data: visible.data == null ? DEFAULT_CONFIG.gui.tag_visible_item.data : visible.data
    };
  }

  delete raw.gui.tag_select_item;
  return raw;
}

export function normalizeImportedConfig(input = {}) {
  const migrated = migrateLegacyConfig(input);
  const unknownTopLevel = {};
  for (const key of Object.keys(migrated)) {
    if (!TOP_LEVEL_ORDER.includes(key)) {
      unknownTopLevel[key] = clone(migrated[key]);
    }
  }

  const merged = mergePlain(DEFAULT_CONFIG, migrated);
  const config = {
    use_minimessage: Boolean(merged.use_minimessage),
    force_tags: Boolean(merged.force_tags),
    check_updates: merged.check_updates !== false,
    legacy_hex: Boolean(merged.legacy_hex),
    papi_chat: merged.papi_chat !== false,
    format_chat: {
      enabled: Boolean(merged.format_chat && merged.format_chat.enabled),
      format: merged.format_chat && merged.format_chat.format != null
        ? String(merged.format_chat.format)
        : DEFAULT_CONFIG.format_chat.format
    },
    load_tag_on_join: merged.load_tag_on_join !== false,
    gui: {},
    categories: {},
    deluxetags: {},
    __unknownTopLevel: unknownTopLevel
  };

  const gui = isPlainObject(merged.gui) ? merged.gui : {};
  config.gui.tag_availability_placeholder = {
    has_permission: String(gui.tag_availability_placeholder?.has_permission ?? DEFAULT_CONFIG.gui.tag_availability_placeholder.has_permission),
    no_permission: String(gui.tag_availability_placeholder?.no_permission ?? DEFAULT_CONFIG.gui.tag_availability_placeholder.no_permission)
  };
  config.gui.name = String(gui.name ?? DEFAULT_CONFIG.gui.name);
  config.gui.size = normalizeData(gui.size, DEFAULT_CONFIG.gui.size);
  config.gui.tag_slots = toSlotEntries(gui.tag_slots, DEFAULT_CONFIG.gui.tag_slots);
  config.gui.tag_visible_item = normalizeGuiItem(gui.tag_visible_item, DEFAULT_CONFIG.gui.tag_visible_item, {
    text: false,
    slots: false
  });
  for (const key of STATIC_ITEM_KEYS) {
    config.gui[key] = normalizeGuiItem(gui[key], DEFAULT_CONFIG.gui[key]);
  }

  const categories = isPlainObject(merged.categories) ? merged.categories : DEFAULT_CONFIG.categories;
  for (const identifier of Object.keys(categories)) {
    config.categories[identifier] = normalizeCategory(identifier, categories[identifier]);
  }

  const tags = isPlainObject(migrated.deluxetags) ? migrated.deluxetags : DEFAULT_CONFIG.deluxetags;
  for (const identifier of Object.keys(tags)) {
    config.deluxetags[identifier] = normalizeTag(identifier, tags[identifier]);
  }

  return config;
}

export function createDefaultState() {
  return {
    config: normalizeImportedConfig(DEFAULT_CONFIG),
    preview: clone(DEFAULT_PREVIEW),
    yamlError: null
  };
}

function serializeAdvancedFields(input, target) {
  if (input.item_model) {
    target.item_model = input.item_model;
  }
  if (input.model_data !== undefined && input.model_data !== null && String(input.model_data).trim() !== "") {
    target.model_data = asExportNumber(input.model_data);
  }
  const component = input.model_data_component;
  if (isPlainObject(component)) {
    const exported = {};
    for (const key of ["colors", "flags", "floats", "strings"]) {
      const lines = toLines(component[key]).filter((line) => line.trim() !== "");
      if (lines.length > 0) {
        exported[key] = lines;
      }
    }
    if (Object.keys(exported).length > 0) {
      target.model_data_component = exported;
    }
  }
}

function asExportNumber(value) {
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && String(parsed) === String(value).trim() ? parsed : value;
}

function serializeGuiItem(item, options = {}) {
  const output = {
    material: normalizeMaterial(item.material, ""),
    data: asExportNumber(item.data || 0)
  };
  if (options.text !== false) {
    output.displayname = item.displayname == null ? "" : String(item.displayname);
    output.lore = toLines(item.lore);
  }
  if (options.slots !== false) {
    const slots = toSlotEntries(item.slots);
    if (slots.length === 1 && options.preferSlot !== false && /^\d+$/.test(slots[0])) {
      output.slot = Number.parseInt(slots[0], 10);
    } else {
      output.slots = slots;
    }
  }
  serializeAdvancedFields(item, output);
  return output;
}

function serializeCategories(config) {
  const output = {};
  const entries = Object.entries(config.categories || {}).sort((a, b) => {
    const ao = Number.parseInt(a[1].order, 10);
    const bo = Number.parseInt(b[1].order, 10);
    return (Number.isFinite(ao) ? ao : 0) - (Number.isFinite(bo) ? bo : 0) || a[0].localeCompare(b[0]);
  });
  for (const [identifier, category] of entries) {
    output[identifier] = {
      order: asExportNumber(category.order),
      item: normalizeMaterial(category.item, "NAME_TAG"),
      name: String(category.name ?? ""),
      lore: toLines(category.lore),
      gui_name: String(category.gui_name ?? "")
    };
  }
  return output;
}

function serializeTags(config) {
  const output = {};
  const entries = Object.entries(config.deluxetags || {}).sort((a, b) => {
    const ao = Number.parseInt(a[1].order, 10);
    const bo = Number.parseInt(b[1].order, 10);
    return (Number.isFinite(ao) ? ao : 0) - (Number.isFinite(bo) ? bo : 0) || a[0].localeCompare(b[0]);
  });
  for (const [identifier, tag] of entries) {
    output[identifier] = {
      order: asExportNumber(tag.order),
      category: String(tag.category || "general"),
      tag: String(tag.tag ?? ""),
      displayname: String(tag.displayname ?? "&6Tag&f: &6%deluxetags_identifier%"),
      description: toLines(tag.description),
      item: normalizeMaterial(tag.item, "NAME_TAG"),
      data: asExportNumber(tag.data || 0),
      permission: tag.permission && String(tag.permission).trim() !== ""
        ? String(tag.permission)
        : "deluxetags.tag." + identifier
    };
  }
  return output;
}

function serializeGui(config) {
  const gui = config.gui || {};
  const output = {
    tag_availability_placeholder: {
      has_permission: String(gui.tag_availability_placeholder?.has_permission ?? ""),
      no_permission: String(gui.tag_availability_placeholder?.no_permission ?? "")
    },
    name: String(gui.name ?? ""),
    size: asExportNumber(gui.size),
    tag_slots: toSlotEntries(gui.tag_slots),
    tag_visible_item: serializeGuiItem(gui.tag_visible_item || {}, {
      text: false,
      slots: false
    })
  };
  for (const key of STATIC_ITEM_KEYS) {
    output[key] = serializeGuiItem(gui[key] || {}, {
      preferSlot: !["divider_item", "exit_item"].includes(key)
    });
  }
  return output;
}

export function buildExportObject(config, mode = "full") {
  if (mode === "tags") {
    return { deluxetags: serializeTags(config) };
  }
  if (mode === "categories") {
    return { categories: serializeCategories(config) };
  }
  if (mode === "builder") {
    return {
      gui: serializeGui(config),
      categories: serializeCategories(config),
      deluxetags: serializeTags(config)
    };
  }

  const known = {
    use_minimessage: Boolean(config.use_minimessage),
    force_tags: Boolean(config.force_tags),
    check_updates: config.check_updates !== false,
    legacy_hex: Boolean(config.legacy_hex),
    papi_chat: config.papi_chat !== false,
    format_chat: {
      enabled: Boolean(config.format_chat?.enabled),
      format: String(config.format_chat?.format ?? DEFAULT_CONFIG.format_chat.format)
    },
    load_tag_on_join: config.load_tag_on_join !== false,
    gui: serializeGui(config),
    categories: serializeCategories(config),
    deluxetags: serializeTags(config)
  };

  const ordered = {};
  for (const key of TOP_LEVEL_ORDER) {
    ordered[key] = known[key];
  }
  for (const [key, value] of Object.entries(config.__unknownTopLevel || {})) {
    if (!TOP_LEVEL_ORDER.includes(key)) {
      ordered[key] = clone(value);
    }
  }
  return ordered;
}

export function dumpConfigYaml(config, yamlLib, mode = "full") {
  if (!yamlLib || typeof yamlLib.dump !== "function") {
    throw new Error("YAML library is unavailable.");
  }
  return yamlLib.dump(buildExportObject(config, mode), {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'"
  });
}

export function parseConfigYaml(text, yamlLib) {
  if (!yamlLib || typeof yamlLib.load !== "function") {
    throw new Error("YAML library is unavailable.");
  }
  const parsed = yamlLib.load(text || "") || {};
  if (!isPlainObject(parsed)) {
    throw new Error("Top-level YAML must be a mapping.");
  }
  return normalizeImportedConfig(parsed);
}

export function parseSlotList(value, menuSize = 54) {
  const entries = toSlotEntries(value);
  const slots = [];
  const issues = [];
  for (const entry of entries) {
    const token = String(entry).trim();
    if (token === "") {
      continue;
    }
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = token.match(/^\d+$/);
    if (range) {
      const start = Number.parseInt(range[1], 10);
      const end = Number.parseInt(range[2], 10);
      if (end < start) {
        issues.push(`Slot range "${token}" ends before it starts.`);
        continue;
      }
      for (let slot = start; slot <= end; slot += 1) {
        slots.push(slot);
      }
      continue;
    }
    if (single) {
      slots.push(Number.parseInt(token, 10));
      continue;
    }
    issues.push(`Slot token "${token}" is malformed.`);
  }
  for (const slot of slots) {
    if (slot < 0 || slot >= menuSize) {
      issues.push(`Slot ${slot} is outside menu size ${menuSize}.`);
    }
  }
  return {
    slots: [...new Set(slots)],
    issues
  };
}

function isIntegerLike(value) {
  return /^-?\d+$/.test(String(value ?? "").trim());
}

function addIssue(list, severity, message, path = "") {
  list.push({ severity, message, path });
}

function collectTextFields(config) {
  const fields = [
    config.format_chat?.format,
    config.gui?.name,
    config.gui?.tag_availability_placeholder?.has_permission,
    config.gui?.tag_availability_placeholder?.no_permission
  ];
  for (const key of STATIC_ITEM_KEYS) {
    const item = config.gui?.[key] || {};
    fields.push(item.displayname, ...toLines(item.lore));
  }
  for (const category of Object.values(config.categories || {})) {
    fields.push(category.name, category.gui_name, ...toLines(category.lore));
  }
  for (const tag of Object.values(config.deluxetags || {})) {
    fields.push(tag.tag, tag.displayname, ...toLines(tag.description));
  }
  return fields.filter((value) => value != null && String(value) !== "");
}

export function findUnsupportedMiniTags(text) {
  const unsupported = new Set();
  const source = String(text ?? "");
  const regex = /(^|[^\\])<([^<>\r\n]+)>/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    let content = match[2].trim();
    if (!content || content.startsWith("/")) {
      content = content.slice(1).trim();
    }
    if (!content || content.startsWith("!")) {
      content = content.slice(1).trim();
    }
    const name = content.split(":", 1)[0].toLowerCase();
    if (!/^#[a-f0-9]{6}$/i.test(name) && !KNOWN_MINI_TAGS.has(name)) {
      unsupported.add(name);
    }
  }
  return [...unsupported];
}

export function findUnresolvedPlaceholders(text) {
  const unresolved = new Set();
  const source = String(text ?? "");
  const regex = /[%{]([a-zA-Z0-9_.:-]+)[%}]/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const token = match[1];
    if (!KNOWN_PLACEHOLDERS.has(token) && !token.startsWith("page")) {
      unresolved.add(match[0]);
    }
  }
  return [...unresolved];
}

export function validateConfig(config, yamlError = null) {
  const issues = [];
  if (yamlError) {
    addIssue(issues, "error", yamlError, "yaml");
  }

  const menuSize = Number.parseInt(config.gui?.size, 10);
  if (!Number.isInteger(menuSize) || menuSize < 9 || menuSize > 54 || menuSize % 9 !== 0) {
    addIssue(issues, "error", "GUI size must be 9, 18, 27, 36, 45, or 54.", "gui.size");
  }
  const safeMenuSize = Number.isInteger(menuSize) && menuSize > 0 ? menuSize : 54;
  const tagSlots = parseSlotList(config.gui?.tag_slots || [], safeMenuSize);
  for (const issue of tagSlots.issues) {
    addIssue(issues, "error", issue, "gui.tag_slots");
  }
  if (tagSlots.slots.length === 0) {
    addIssue(issues, "error", "At least one tag slot is required.", "gui.tag_slots");
  }

  const materialChecks = [];
  materialChecks.push(["gui.tag_visible_item.material", config.gui?.tag_visible_item?.material]);
  for (const key of STATIC_ITEM_KEYS) {
    const item = config.gui?.[key] || {};
    materialChecks.push([`gui.${key}.material`, item.material]);
    const parsed = parseSlotList(item.slots || [], safeMenuSize);
    for (const issue of parsed.issues) {
      addIssue(issues, "error", issue, `gui.${key}.slots`);
    }
  }

  const seenStaticSlots = new Map();
  for (const key of STATIC_ITEM_KEYS) {
    const parsed = parseSlotList(config.gui?.[key]?.slots || [], safeMenuSize);
    for (const slot of parsed.slots) {
      if (seenStaticSlots.has(slot)) {
        addIssue(issues, "warning", `Static GUI items ${seenStaticSlots.get(slot)} and ${key} both use slot ${slot}.`, `gui.${key}.slots`);
      }
      seenStaticSlots.set(slot, key);
      if (tagSlots.slots.includes(slot)) {
        addIssue(issues, "warning", `${key} uses tag slot ${slot}; it will cover a tag/category item.`, `gui.${key}.slots`);
      }
    }
  }

  for (const [identifier, category] of Object.entries(config.categories || {})) {
    if (String(identifier).trim() === "") {
      addIssue(issues, "error", "Category id cannot be empty.", "categories");
    }
    if (!isIntegerLike(category.order)) {
      addIssue(issues, "error", `Category ${identifier} order must be an integer.`, `categories.${identifier}.order`);
    }
    materialChecks.push([`categories.${identifier}.item`, category.item]);
  }

  const tagOrders = new Map();
  for (const [identifier, tag] of Object.entries(config.deluxetags || {})) {
    if (String(identifier).trim() === "") {
      addIssue(issues, "error", "Tag id cannot be empty.", "deluxetags");
    }
    if (String(tag.tag || "").trim() === "") {
      addIssue(issues, "error", `Tag ${identifier} needs a display tag.`, `deluxetags.${identifier}.tag`);
    }
    if (!isIntegerLike(tag.order)) {
      addIssue(issues, "error", `Tag ${identifier} order must be an integer.`, `deluxetags.${identifier}.order`);
    } else {
      const order = Number.parseInt(tag.order, 10);
      if (tagOrders.has(order)) {
        addIssue(issues, "error", `Tags ${tagOrders.get(order)} and ${identifier} both use order ${order}.`, `deluxetags.${identifier}.order`);
      } else {
        tagOrders.set(order, identifier);
      }
    }
    if (String(tag.category || "").toLowerCase() === "all") {
      addIssue(issues, "warning", `Tag ${identifier} uses reserved category "all"; the plugin will move it to general.`, `deluxetags.${identifier}.category`);
    } else if (!config.categories?.[tag.category]) {
      addIssue(issues, "warning", `Tag ${identifier} points at missing category "${tag.category}".`, `deluxetags.${identifier}.category`);
    }
    materialChecks.push([`deluxetags.${identifier}.item`, tag.item]);
  }

  for (const [path, material] of materialChecks) {
    if (material == null || String(material).trim() === "") {
      addIssue(issues, "error", "Material cannot be empty.", path);
      continue;
    }
    const normalized = normalizeMaterial(material, "");
    if (normalized && !/^[A-Z0-9_]+$/.test(normalized)) {
      addIssue(issues, "warning", `Material name ${normalized} may not resolve cleanly.`, path);
    }
  }

  for (const [identifier] of Object.entries(config.categories || {})) {
    if (identifier.toLowerCase() === "all") {
      continue;
    }
    const hasTag = Object.values(config.deluxetags || {}).some((tag) => String(tag.category).toLowerCase() === identifier.toLowerCase());
    if (!hasTag) {
      addIssue(issues, "warning", `Category ${identifier} has no tags.`, `categories.${identifier}`);
    }
  }

  const externalPlaceholders = new Set();
  const unsupportedMini = new Set();
  for (const text of collectTextFields(config)) {
    for (const token of findUnresolvedPlaceholders(text)) {
      externalPlaceholders.add(token);
    }
    for (const tag of findUnsupportedMiniTags(text)) {
      unsupportedMini.add(tag);
    }
  }
  if (externalPlaceholders.size > 0) {
    addIssue(issues, "warning", `Preview leaves external placeholders unresolved: ${[...externalPlaceholders].slice(0, 8).join(", ")}.`, "placeholders");
  }
  if (unsupportedMini.size > 0) {
    addIssue(issues, "warning", `MiniMessage preview may not render unsupported tags: ${[...unsupportedMini].join(", ")}.`, "minimessage");
  }

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    ok: !issues.some((issue) => issue.severity === "error")
  };
}

function sortedCategories(config) {
  return Object.entries(config.categories || {})
    .map(([identifier, category]) => ({ identifier, ...category, allCategory: identifier.toLowerCase() === "all" }))
    .sort((a, b) => Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) || a.identifier.localeCompare(b.identifier));
}

function sortedTags(config) {
  return Object.entries(config.deluxetags || {})
    .map(([identifier, tag]) => ({ identifier, ...tag }))
    .sort((a, b) => Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) || a.identifier.localeCompare(b.identifier));
}

export function tagCanSelect(tag, preview = {}) {
  if (preview.permissionMode === "none") {
    return false;
  }
  if (preview.permissionMode === "custom") {
    return preview.unlockedTags?.[tag.identifier] !== false;
  }
  return true;
}

function visibleTags(config, preview, categoryIdentifier = "all") {
  return sortedTags(config).filter((tag) => {
    const inCategory = categoryIdentifier.toLowerCase() === "all"
      || String(tag.category).toLowerCase() === categoryIdentifier.toLowerCase();
    if (!inCategory) {
      return false;
    }
    return preview.showLockedTags || tagCanSelect(tag, preview);
  });
}

function availableTags(config, preview, categoryIdentifier = "all") {
  return visibleTags(config, { ...preview, showLockedTags: false }, categoryIdentifier);
}

export function selectableCategories(config, preview) {
  const visibleReal = sortedCategories(config)
    .filter((category) => !category.allCategory)
    .filter((category) => visibleTags(config, preview, category.identifier).length > 0);
  if (visibleReal.length >= 2) {
    const allCategory = sortedCategories(config).find((category) => category.allCategory);
    if (allCategory) {
      return [...visibleReal, allCategory].sort((a, b) => Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) || a.identifier.localeCompare(b.identifier));
    }
  }
  return visibleReal;
}

function pageItems(items, page, pageSize) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function replacePlaceholders(text, context = {}, config = DEFAULT_CONFIG) {
  const tag = context.tag || context.currentTag || {
    identifier: "",
    tag: "",
    description: []
  };
  const page = Math.max(1, Number.parseInt(context.page, 10) || 1);
  const hasNextPage = Boolean(context.hasNextPage);
  const description = toLines(tag.description).join("\n");
  const category = context.categoryIdentifier || tag.category || "all";
  const amount = context.amount != null ? String(context.amount) : "0";
  const categoryAmount = context.categoryAmount != null ? String(context.categoryAmount) : amount;
  const canSelect = context.canSelect !== false;
  const availability = canSelect
    ? config.gui?.tag_availability_placeholder?.has_permission || ""
    : config.gui?.tag_availability_placeholder?.no_permission || "";

  return String(text ?? "")
    .replaceAll("%player%", context.playerName || "Steve")
    .replaceAll("{player}", context.playerName || "Steve")
    .replaceAll("%displayname%", context.displayName || context.playerName || "Steve")
    .replaceAll("{displayname}", context.displayName || context.playerName || "Steve")
    .replaceAll("%deluxetags_tag%", tag.tag || "")
    .replaceAll("{deluxetags_tag}", tag.tag || "")
    .replaceAll("%deluxetags_identifier%", tag.identifier || "")
    .replaceAll("{deluxetags_identifier}", tag.identifier || "")
    .replaceAll("%deluxetags_description%", description)
    .replaceAll("{deluxetags_description}", description)
    .replaceAll("%deluxetags_amount%", amount)
    .replaceAll("{deluxetags_amount}", amount)
    .replaceAll("%deluxetags_category_amount%", categoryAmount)
    .replaceAll("{deluxetags_category_amount}", categoryAmount)
    .replaceAll("%deluxetags_available%", availability)
    .replaceAll("{deluxetags_available}", availability)
    .replaceAll("%previous_page%", page === 1 ? "" : String(page - 1))
    .replaceAll("{previous_page}", page === 1 ? "" : String(page - 1))
    .replaceAll("%current_page%", String(page))
    .replaceAll("{current_page}", String(page))
    .replaceAll("%next_page%", hasNextPage ? String(page + 1) : "")
    .replaceAll("{next_page}", hasNextPage ? String(page + 1) : "")
    .replaceAll("%category%", category)
    .replaceAll("{category}", category);
}

function interpolateColor(start, end, ratio) {
  const from = parseHex(start);
  const to = parseHex(end);
  if (!from || !to) {
    return start;
  }
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * ratio));
  return "#" + mixed.map((value) => value.toString(16).padStart(2, "0")).join("");
}

function parseHex(value) {
  const match = String(value || "").match(/^#?([a-f0-9]{6})$/i);
  if (!match) {
    return null;
  }
  const hex = match[1];
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
}

function hexToken(value, config) {
  const clean = String(value).replace(/^#/, "");
  return config.legacy_hex ? `&#${clean}` : `#${clean}`;
}

const MINI_FORMAT_CODES = Object.freeze({
  bold: "&l",
  b: "&l",
  italic: "&o",
  em: "&o",
  i: "&o",
  underlined: "&n",
  u: "&n",
  strikethrough: "&m",
  st: "&m",
  obfuscated: "&k",
  obf: "&k"
});

const MINI_FORMAT_CANONICAL = Object.freeze({
  bold: "bold",
  b: "bold",
  italic: "italic",
  em: "italic",
  i: "italic",
  underlined: "underlined",
  u: "underlined",
  strikethrough: "strikethrough",
  st: "strikethrough",
  obfuscated: "obfuscated",
  obf: "obfuscated"
});

function applyGradientMiniMessage(input, config) {
  return String(input).replace(/<gradient:(#[a-f0-9]{6}):(#[a-f0-9]{6})>([\s\S]*?)<\/gradient>/gi, (_all, start, end, body) => {
    const chars = [...body];
    if (chars.length === 0) {
      return "";
    }
    return chars
      .map((char, index) => `${hexToken(interpolateColor(start, end, chars.length === 1 ? 0 : index / (chars.length - 1)), config)}${char}`)
      .join("");
  });
}

function normalizeMiniColorName(name) {
  if (name === "grey") {
    return "gray";
  }
  if (name === "dark_grey") {
    return "dark_gray";
  }
  return name;
}

function miniTagInfo(content, config) {
  const clean = String(content || "").trim().replace(/\s*\/$/, "");
  const [rawName, ...rawArgs] = clean.split(":");
  const name = rawName.toLowerCase();
  const args = rawArgs.join(":");
  if (name === "reset") {
    return { type: "reset", name };
  }
  if (MINI_COLORS[name]) {
    return { type: "color", name: normalizeMiniColorName(name), code: MINI_COLORS[name] };
  }
  if (MINI_FORMAT_CODES[name]) {
    return { type: "format", name: MINI_FORMAT_CANONICAL[name], code: MINI_FORMAT_CODES[name] };
  }
  if (["color", "colour", "c"].includes(name) && args) {
    const color = args.trim().toLowerCase();
    if (/^#[a-f0-9]{6}$/i.test(color)) {
      return { type: "color", name: "color", code: hexToken(color, config) };
    }
    if (MINI_COLORS[color]) {
      return { type: "color", name: "color", code: MINI_COLORS[color] };
    }
  }
  if (/^#[a-f0-9]{6}$/i.test(name)) {
    return { type: "color", name, code: hexToken(name, config) };
  }
  return null;
}

function activeMiniCodes(stack) {
  const lastColor = [...stack].reverse().find((entry) => entry.type === "color");
  const formats = [];
  const seen = new Set();
  for (const entry of stack) {
    if (entry.type === "format" && !seen.has(entry.name)) {
      seen.add(entry.name);
      formats.push(entry.code);
    }
  }
  return (lastColor ? lastColor.code : "") + formats.join("");
}

function activeMiniFormatCodes(stack) {
  const formats = [];
  const seen = new Set();
  for (const entry of stack) {
    if (entry.type === "format" && !seen.has(entry.name)) {
      seen.add(entry.name);
      formats.push(entry.code);
    }
  }
  return formats.join("");
}

function removeLastMiniTag(stack, name) {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i].name === name) {
      stack.splice(i, 1);
      return true;
    }
  }
  return false;
}

function miniToLegacy(input, config) {
  let output = applyGradientMiniMessage(input, config);
  output = output.replace(/<newline\s*\/?>|<br\s*\/?>/gi, "\n");
  const stack = [];
  output = output.replace(/<(!?\/?)([^<>\r\n]+)>/g, (match, prefix, content) => {
    const closing = prefix.includes("/");
    let name = String(content).trim().replace(/\s*\/$/, "").split(":", 1)[0].toLowerCase();
    if (name.startsWith("/")) {
      name = name.slice(1);
    }
    name = normalizeMiniColorName(name);
    const info = miniTagInfo(content, config);
    if (!info && closing && ["color", "colour", "c"].includes(name)) {
      removeLastMiniTag(stack, "color");
      const active = activeMiniCodes(stack);
      return active ? `&r${active}` : "&r";
    }
    if (!info) {
      return match;
    }
    if (info.type === "reset") {
      stack.length = 0;
      return "&r";
    }
    if (closing) {
      removeLastMiniTag(stack, info.name || name);
      const active = activeMiniCodes(stack);
      return active ? `&r${active}` : "&r";
    }
    stack.push(info);
    if (info.type === "color") {
      return info.code + activeMiniFormatCodes(stack);
    }
    return info.code;
  });
  return output;
}

export function formatTextSegments(text, config = DEFAULT_CONFIG) {
  const prepared = config.use_minimessage ? miniToLegacy(String(text ?? ""), config) : String(text ?? "");
  const segments = [];
  let style = {
    color: null,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    obfuscated: false
  };
  let buffer = "";

  const flush = () => {
    if (buffer !== "") {
      segments.push({ text: buffer, style: { ...style } });
      buffer = "";
    }
  };

  for (let i = 0; i < prepared.length; i += 1) {
    const rest = prepared.slice(i);
    const hexPattern = config.legacy_hex ? /^&#([a-f0-9]{6})/i : /^#([a-f0-9]{6})/i;
    const hex = rest.match(hexPattern);
    if (hex) {
      flush();
      style.color = "#" + hex[1].toLowerCase();
      i += hex[0].length - 1;
      continue;
    }

    if (prepared[i] === "&" && i + 1 < prepared.length) {
      const code = prepared[i + 1].toLowerCase();
      if (LEGACY_COLORS[code]) {
        flush();
        style = {
          color: LEGACY_COLORS[code],
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          obfuscated: false
        };
        i += 1;
        continue;
      }
      if (LEGACY_FORMATS[code]) {
        flush();
        style[LEGACY_FORMATS[code]] = true;
        i += 1;
        continue;
      }
      if (code === "r") {
        flush();
        style = {
          color: null,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          obfuscated: false
        };
        i += 1;
        continue;
      }
    }

    buffer += prepared[i];
  }
  flush();
  return segments;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatTextHtml(text, config = DEFAULT_CONFIG) {
  return formatTextSegments(text, config)
    .map((segment) => {
      const declarations = [];
      if (segment.style.color) {
        declarations.push(`color:${segment.style.color}`);
      }
      if (segment.style.bold) {
        declarations.push("font-weight:700");
      }
      if (segment.style.italic) {
        declarations.push("font-style:italic");
      }
      const decorations = [];
      if (segment.style.underline) {
        decorations.push("underline");
      }
      if (segment.style.strikethrough) {
        decorations.push("line-through");
      }
      if (decorations.length > 0) {
        declarations.push(`text-decoration:${decorations.join(" ")}`);
      }
      if (segment.style.obfuscated) {
        declarations.push("filter:blur(1px)");
      }
      return `<span style="${declarations.join(";")}">${escapeHtml(segment.text).replace(/\n/g, "<br>")}</span>`;
    })
    .join("");
}

function currentTag(config, preview) {
  return sortedTags(config).find((tag) => tag.identifier === preview.activeTagId) || null;
}

function buildContext(config, preview, extra = {}) {
  const current = currentTag(config, preview);
  const amount = availableTags(config, preview, "all").length;
  const categoryIdentifier = extra.categoryIdentifier || preview.category || "all";
  const categoryAmount = availableTags(config, preview, categoryIdentifier).length;
  return {
    playerName: preview.playerName || "Steve",
    displayName: preview.displayName || preview.playerName || "Steve",
    currentTag: current,
    amount,
    categoryAmount,
    ...extra
  };
}

function makePreviewItem(raw, config, preview, context, type, materialOverride = null) {
  const material = materialOverride || raw.material || raw.item || "NAME_TAG";
  const displayname = replacePlaceholders(raw.displayname ?? raw.name ?? "", context, config);
  const lore = toLines(raw.lore ?? raw.description).flatMap((line) => {
    const resolved = replacePlaceholders(line, context, config);
    return resolved.split("\n");
  });
  const previewTag = context.tag || (type === "has_tag_item" ? context.currentTag : null);
  return {
    type,
    material: normalizeMaterial(material, "NAME_TAG"),
    data: normalizeData(raw.data, 0),
    displayname,
    lore,
    tagText: previewTag ? replacePlaceholders(previewTag.tag || "", { ...context, tag: previewTag }, config) : "",
    selected: Boolean(context.selected),
    canSelect: context.canSelect !== false,
    ref: context.ref || null
  };
}

function addStaticItem(slots, config, preview, key, page, hasNextPage, categoryIdentifier) {
  const item = config.gui[key];
  const menuSize = Number.parseInt(config.gui.size, 10) || 54;
  const parsed = parseSlotList(item.slots || [], menuSize);
  const context = buildContext(config, preview, {
    page,
    hasNextPage,
    categoryIdentifier,
    ref: {
      kind: "static",
      id: key
    }
  });
  const previewItem = makePreviewItem(item, config, preview, context, key);
  for (const slot of parsed.slots) {
    if (slot >= 0 && slot < slots.length) {
      slots[slot] = previewItem;
    }
  }
}

function clampPage(page, pages) {
  const safePages = Math.max(1, pages || 1);
  return Math.min(Math.max(1, Number.parseInt(page, 10) || 1), safePages);
}

function truncateTitle(title) {
  const value = String(title ?? "");
  return value.length > 32 ? value.slice(0, 31) : value;
}

export function buildPreview(config, previewInput = DEFAULT_PREVIEW) {
  const preview = { ...clone(DEFAULT_PREVIEW), ...clone(previewInput) };
  const menuSize = Number.parseInt(config.gui?.size, 10) || 54;
  const slots = Array.from({ length: Math.max(9, Math.min(54, menuSize)) }, () => null);
  const tagSlots = parseSlotList(config.gui?.tag_slots || [], slots.length).slots;
  const categories = selectableCategories(config, preview);
  const shouldShowCategoryMenu = preview.screen === "categories" || (preview.screen === "auto" && categories.length >= 2);
  const pageSize = Math.max(1, tagSlots.length);

  if (shouldShowCategoryMenu) {
    const pages = Math.ceil(categories.length / pageSize) || 1;
    const page = clampPage(preview.page, pages);
    const hasNextPage = page < pages;
    const context = buildContext(config, preview, {
      page,
      hasNextPage,
      categoryIdentifier: "all"
    });
    const title = truncateTitle(replacePlaceholders(config.gui.name, context, config));
    for (const [index, category] of pageItems(categories, page, pageSize).entries()) {
      const slot = tagSlots[index];
      if (slot == null || slot >= slots.length) {
        continue;
      }
      const itemContext = buildContext(config, preview, {
        page,
        hasNextPage,
        categoryIdentifier: category.identifier
      });
      slots[slot] = makePreviewItem(
        {
          material: category.item,
          displayname: category.name,
          lore: category.lore,
          data: 0
        },
        config,
        preview,
        {
          ...itemContext,
          ref: {
            kind: "category",
            id: category.identifier
          }
        },
        "category"
      );
    }
    addStaticItem(slots, config, preview, "divider_item", page, hasNextPage, "all");
    addStaticItem(slots, config, preview, currentTag(config, preview) ? "has_tag_item" : "no_tag_item", page, hasNextPage, "all");
    addStaticItem(slots, config, preview, "exit_item", page, hasNextPage, "all");
    if (page > 1) {
      addStaticItem(slots, config, preview, "previous_page", page, hasNextPage, "all");
    }
    if (hasNextPage) {
      addStaticItem(slots, config, preview, "next_page", page, hasNextPage, "all");
    }
    return {
      screen: "categories",
      title,
      page,
      pages,
      slots,
      categoryIdentifier: "all"
    };
  }

  const categoryIdentifier = preview.category && preview.category !== "auto"
    ? preview.category
    : (categories[0]?.identifier || "all");
  const tags = visibleTags(config, preview, categoryIdentifier);
  const pages = Math.ceil(tags.length / pageSize) || 1;
  const page = clampPage(preview.page, pages);
  const hasNextPage = page < pages;
  const category = sortedCategories(config).find((item) => item.identifier === categoryIdentifier);
  const titleSource = category ? category.gui_name : config.gui.name;
  const title = truncateTitle(replacePlaceholders(titleSource, buildContext(config, preview, {
    page,
    hasNextPage,
    categoryIdentifier
  }), config));

  for (const [index, tag] of pageItems(tags, page, pageSize).entries()) {
    const slot = tagSlots[index];
    if (slot == null || slot >= slots.length) {
      continue;
    }
    const canSelect = tagCanSelect(tag, preview);
    const material = canSelect ? tag.item : config.gui.tag_visible_item.material;
    const context = buildContext(config, preview, {
      page,
      hasNextPage,
      categoryIdentifier,
      tag,
      canSelect,
      selected: tag.identifier === preview.activeTagId,
      ref: {
        kind: "tag",
        id: tag.identifier
      }
    });
    slots[slot] = makePreviewItem(
      {
        material,
        data: canSelect ? tag.data : config.gui.tag_visible_item.data,
        displayname: tag.displayname,
        lore: tag.description
      },
      config,
      preview,
      context,
      canSelect ? "tag" : "locked_tag",
      material
    );
  }
  addStaticItem(slots, config, preview, "divider_item", page, hasNextPage, categoryIdentifier);
  addStaticItem(slots, config, preview, currentTag(config, preview) ? "has_tag_item" : "no_tag_item", page, hasNextPage, categoryIdentifier);
  addStaticItem(slots, config, preview, "exit_item", page, hasNextPage, categoryIdentifier);
  if (categories.length >= 2) {
    addStaticItem(slots, config, preview, "category_back_item", page, hasNextPage, categoryIdentifier);
  }
  if (page > 1) {
    addStaticItem(slots, config, preview, "previous_page", page, hasNextPage, categoryIdentifier);
  }
  if (hasNextPage) {
    addStaticItem(slots, config, preview, "next_page", page, hasNextPage, categoryIdentifier);
  }
  return {
    screen: "tags",
    title,
    page,
    pages,
    slots,
    categoryIdentifier
  };
}

export function materialToTextureId(material) {
  return normalizeMaterial(material, "")
    .toLowerCase()
    .replace(/^minecraft:/, "")
    .replace(/_wall$/, "")
    .replace(/_item$/, "");
}

export function iconCandidates(material, template = DEFAULT_ICON_TEMPLATE) {
  const id = materialToTextureId(material);
  const candidates = [];
  if (id === "player_head") {
    candidates.push(["entity/player/wide", "steve"]);
  }
  if (id.endsWith("_stained_glass_pane")) {
    candidates.push(["block", id.replace(/_pane$/, "")]);
  } else if (id === "glass_pane") {
    candidates.push(["block", "glass"]);
  }
  if (id.endsWith("_pane")) {
    candidates.push(["block", `${id}_top`]);
  }
  candidates.push(["item", id], ["block", id]);
  return [...new Set(candidates.map(([folder, textureId]) => String(template)
    .replaceAll("{material}", normalizeMaterial(material, ""))
    .replaceAll("{id}", textureId)
    .replaceAll("{folder}", folder)))];
}

export function renameKey(object, oldKey, newKey) {
  const trimmed = String(newKey || "").trim();
  if (!trimmed || oldKey === trimmed || !object || object[trimmed]) {
    return false;
  }
  const entries = Object.entries(object);
  const next = {};
  for (const [key, value] of entries) {
    next[key === oldKey ? trimmed : key] = value;
  }
  for (const key of Object.keys(object)) {
    delete object[key];
  }
  Object.assign(object, next);
  return true;
}
