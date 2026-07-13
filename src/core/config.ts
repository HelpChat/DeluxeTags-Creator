import { DEFAULT_CONFIG, DEFAULT_PREVIEW, STATIC_ITEM_KEYS, TOP_LEVEL_ORDER } from './constants';
import {
  asExportNumber,
  clone,
  isPlainObject,
  mergePlain,
  normalizeData,
  normalizeMaterial,
  toLines,
  toSlotEntries,
} from './util';
import type { Category, Config, GuiItem, Tag } from './types';

type AnyRecord = Record<string, any>;

interface GuiItemOptions {
  text?: boolean;
  slots?: boolean;
}

export function normalizeGuiItem(
  value: AnyRecord = {},
  defaults: AnyRecord = {},
  options: GuiItemOptions = {},
): GuiItem {
  const item: GuiItem = {
    material: normalizeMaterial(value.material, defaults.material),
    data: normalizeData(value.data, defaults.data || 0),
  };

  if (options.text !== false) {
    item.displayname = value.displayname == null ? defaults.displayname || '' : String(value.displayname);
    item.lore = toLines(value.lore, defaults.lore || []);
  }

  if (options.slots !== false) {
    item.slots =
      value.slots != null
        ? toSlotEntries(value.slots, defaults.slots || [])
        : toSlotEntries(value.slot, defaults.slots || []);
  }

  return item;
}

export function normalizeCategory(identifier: string, value: AnyRecord = {}): Category {
  const defaults: AnyRecord = (DEFAULT_CONFIG.categories as AnyRecord)[identifier] || {
    order: 1,
    item: 'NAME_TAG',
    name: `&6${identifier}`,
    lore: [],
    gui_name: `&6${identifier}`,
  };

  const category: Category = {
    order: value.order == null ? defaults.order : value.order,
    item: normalizeMaterial(value.item, defaults.item),
    name: value.name == null ? defaults.name : String(value.name),
    lore: toLines(value.lore, defaults.lore),
    gui_name: value.gui_name == null ? defaults.gui_name : String(value.gui_name),
  };
  return category;
}

export function normalizeTag(identifier: string, value: AnyRecord = {}): Tag {
  const tag: Tag = {
    order: value.order == null ? 1 : value.order,
    category:
      value.category == null || String(value.category).trim() === '' ? 'general' : String(value.category),
    tag: value.tag == null ? '' : String(value.tag),
    displayname: value.displayname == null ? '&6Tag&f: &6%deluxetags_identifier%' : String(value.displayname),
    description: toLines(value.description, ['&fDescription for tag ' + identifier, '%deluxetags_available%']),
    item: normalizeMaterial(value.item, 'NAME_TAG'),
    data: normalizeData(value.data, 0),
    permission:
      value.permission == null || String(value.permission).trim() === ''
        ? 'deluxetags.tag.' + identifier
        : String(value.permission),
  };
  return tag;
}

export function migrateLegacyConfig(rawInput: unknown): AnyRecord {
  const raw = clone(rawInput || {}) as AnyRecord;
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
      const description = toLines(tag.description, ['&f']);
      if (
        tag.category == null ||
        String(tag.category).trim() === '' ||
        String(tag.category).toLowerCase() === 'all'
      ) {
        tag.category = 'general';
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
        const joinedDescription = description.join('\n');
        const expanded: string[] = [];
        for (const line of legacyTagItem.lore.map(String)) {
          if (line === '%deluxetags_description%' || line === '{deluxetags_description}') {
            expanded.push(...description);
          } else if (
            line.includes('%deluxetags_description%') ||
            line.includes('{deluxetags_description}')
          ) {
            expanded.push(
              ...line
                .replaceAll('%deluxetags_description%', joinedDescription)
                .replaceAll('{deluxetags_description}', joinedDescription)
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .split('\n'),
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
      data: visible.data == null ? DEFAULT_CONFIG.gui.tag_visible_item.data : visible.data,
    };
  }

  delete raw.gui.tag_select_item;
  return raw;
}

export function normalizeImportedConfig(input: unknown = {}): Config {
  const migrated = migrateLegacyConfig(input);
  const unknownTopLevel: AnyRecord = {};
  for (const key of Object.keys(migrated)) {
    if (!TOP_LEVEL_ORDER.includes(key)) {
      unknownTopLevel[key] = clone(migrated[key]);
    }
  }

  const merged = mergePlain(DEFAULT_CONFIG, migrated) as AnyRecord;
  const config: Config = {
    use_minimessage: Boolean(merged.use_minimessage),
    force_tags: Boolean(merged.force_tags),
    check_updates: merged.check_updates !== false,
    legacy_hex: Boolean(merged.legacy_hex),
    papi_chat: merged.papi_chat !== false,
    format_chat: {
      enabled: Boolean(merged.format_chat && merged.format_chat.enabled),
      format:
        merged.format_chat && merged.format_chat.format != null
          ? String(merged.format_chat.format)
          : DEFAULT_CONFIG.format_chat.format,
    },
    load_tag_on_join: merged.load_tag_on_join !== false,
    gui: {} as Config['gui'],
    categories: {},
    deluxetags: {},
    __unknownTopLevel: unknownTopLevel,
  };

  const gui: AnyRecord = isPlainObject(merged.gui) ? merged.gui : {};
  config.gui.tag_availability_placeholder = {
    has_permission: String(
      gui.tag_availability_placeholder?.has_permission ??
        DEFAULT_CONFIG.gui.tag_availability_placeholder.has_permission,
    ),
    no_permission: String(
      gui.tag_availability_placeholder?.no_permission ??
        DEFAULT_CONFIG.gui.tag_availability_placeholder.no_permission,
    ),
  };
  config.gui.name = String(gui.name ?? DEFAULT_CONFIG.gui.name);
  config.gui.size = normalizeData(gui.size, DEFAULT_CONFIG.gui.size);
  config.gui.tag_slots = toSlotEntries(gui.tag_slots, DEFAULT_CONFIG.gui.tag_slots);
  config.gui.tag_visible_item = normalizeGuiItem(gui.tag_visible_item, DEFAULT_CONFIG.gui.tag_visible_item, {
    text: false,
    slots: false,
  });
  for (const key of STATIC_ITEM_KEYS) {
    config.gui[key] = normalizeGuiItem(gui[key], (DEFAULT_CONFIG.gui as AnyRecord)[key]);
  }

  const categories: AnyRecord = isPlainObject(merged.categories)
    ? merged.categories
    : DEFAULT_CONFIG.categories;
  for (const identifier of Object.keys(categories)) {
    config.categories[identifier] = normalizeCategory(identifier, categories[identifier]);
  }

  const tags: AnyRecord = isPlainObject(migrated.deluxetags)
    ? migrated.deluxetags
    : DEFAULT_CONFIG.deluxetags;
  for (const identifier of Object.keys(tags)) {
    config.deluxetags[identifier] = normalizeTag(identifier, tags[identifier]);
  }

  return config;
}

export function createDefaultState(): {
  config: Config;
  preview: ReturnType<typeof clone>;
  yamlError: null;
} {
  return {
    config: normalizeImportedConfig(DEFAULT_CONFIG),
    preview: clone(DEFAULT_PREVIEW),
    yamlError: null,
  };
}

export function serializeGuiItem(item: AnyRecord, options: GuiItemOptions & { preferSlot?: boolean } = {}): AnyRecord {
  const output: AnyRecord = {
    material: normalizeMaterial(item.material, ''),
    data: asExportNumber(item.data || 0),
  };
  if (options.text !== false) {
    output.displayname = item.displayname == null ? '' : String(item.displayname);
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
  return output;
}

export function serializeCategories(config: AnyRecord): AnyRecord {
  const output: AnyRecord = {};
  const entries = Object.entries(config.categories || {}).sort((a, b) => {
    const ao = Number.parseInt((a[1] as AnyRecord).order, 10);
    const bo = Number.parseInt((b[1] as AnyRecord).order, 10);
    return (Number.isFinite(ao) ? ao : 0) - (Number.isFinite(bo) ? bo : 0) || a[0].localeCompare(b[0]);
  });
  for (const [identifier, category] of entries as Array<[string, AnyRecord]>) {
    const serialized: AnyRecord = {
      order: asExportNumber(category.order),
      item: normalizeMaterial(category.item, 'NAME_TAG'),
      name: String(category.name ?? ''),
      lore: toLines(category.lore),
      gui_name: String(category.gui_name ?? ''),
    };
    output[identifier] = serialized;
  }
  return output;
}

export function serializeTags(config: AnyRecord): AnyRecord {
  const output: AnyRecord = {};
  const entries = Object.entries(config.deluxetags || {}).sort((a, b) => {
    const ao = Number.parseInt((a[1] as AnyRecord).order, 10);
    const bo = Number.parseInt((b[1] as AnyRecord).order, 10);
    return (Number.isFinite(ao) ? ao : 0) - (Number.isFinite(bo) ? bo : 0) || a[0].localeCompare(b[0]);
  });
  for (const [identifier, tag] of entries as Array<[string, AnyRecord]>) {
    const serialized: AnyRecord = {
      order: asExportNumber(tag.order),
      category: String(tag.category || 'general'),
      tag: String(tag.tag ?? ''),
      displayname: String(tag.displayname ?? '&6Tag&f: &6%deluxetags_identifier%'),
      description: toLines(tag.description),
      item: normalizeMaterial(tag.item, 'NAME_TAG'),
      data: asExportNumber(tag.data || 0),
      permission:
        tag.permission && String(tag.permission).trim() !== ''
          ? String(tag.permission)
          : 'deluxetags.tag.' + identifier,
    };
    output[identifier] = serialized;
  }
  return output;
}

export function serializeGui(config: AnyRecord): AnyRecord {
  const gui = config.gui || {};
  const output: AnyRecord = {
    tag_availability_placeholder: {
      has_permission: String(gui.tag_availability_placeholder?.has_permission ?? ''),
      no_permission: String(gui.tag_availability_placeholder?.no_permission ?? ''),
    },
    name: String(gui.name ?? ''),
    size: asExportNumber(gui.size),
    tag_slots: toSlotEntries(gui.tag_slots),
    tag_visible_item: serializeGuiItem(gui.tag_visible_item || {}, {
      text: false,
      slots: false,
    }),
  };
  for (const key of STATIC_ITEM_KEYS) {
    output[key] = serializeGuiItem(gui[key] || {}, {
      preferSlot: !['divider_item', 'exit_item'].includes(key),
    });
  }
  return output;
}

export function buildExportObject(config: AnyRecord, mode = 'full'): AnyRecord {
  if (mode === 'tags') {
    return { deluxetags: serializeTags(config) };
  }
  if (mode === 'categories') {
    return { categories: serializeCategories(config) };
  }
  if (mode === 'builder') {
    return {
      gui: serializeGui(config),
      categories: serializeCategories(config),
      deluxetags: serializeTags(config),
    };
  }

  const known: AnyRecord = {
    use_minimessage: Boolean(config.use_minimessage),
    force_tags: Boolean(config.force_tags),
    check_updates: config.check_updates !== false,
    legacy_hex: Boolean(config.legacy_hex),
    papi_chat: config.papi_chat !== false,
    format_chat: {
      enabled: Boolean(config.format_chat?.enabled),
      format: String(config.format_chat?.format ?? DEFAULT_CONFIG.format_chat.format),
    },
    load_tag_on_join: config.load_tag_on_join !== false,
    gui: serializeGui(config),
    categories: serializeCategories(config),
    deluxetags: serializeTags(config),
  };

  const ordered: AnyRecord = {};
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
