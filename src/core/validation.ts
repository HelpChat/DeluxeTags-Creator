import { KNOWN_MINI_TAGS, KNOWN_PLACEHOLDERS, STATIC_ITEM_KEYS } from './constants';
import { isIntegerLike, normalizeMaterial, parseSlotList, toLines } from './util';
import type { Config, Issue, ValidationResult } from './types';

type AnyRecord = Record<string, any>;

function addIssue(list: Issue[], severity: 'error' | 'warning', message: string, path = ''): void {
  list.push({ severity, message, path });
}

function collectTextFields(config: AnyRecord): string[] {
  const fields: unknown[] = [
    config.format_chat?.format,
    config.gui?.name,
    config.gui?.tag_availability_placeholder?.has_permission,
    config.gui?.tag_availability_placeholder?.no_permission,
  ];
  for (const key of STATIC_ITEM_KEYS) {
    const item = config.gui?.[key] || {};
    fields.push(item.displayname, ...toLines(item.lore));
  }
  for (const category of Object.values<AnyRecord>(config.categories || {})) {
    fields.push(category.name, category.gui_name, ...toLines(category.lore));
  }
  for (const tag of Object.values<AnyRecord>(config.deluxetags || {})) {
    fields.push(tag.tag, tag.displayname, ...toLines(tag.description));
  }
  return fields.filter((value) => value != null && String(value) !== '') as string[];
}

export function findUnsupportedMiniTags(text: unknown): string[] {
  const unsupported = new Set<string>();
  const source = String(text ?? '');
  const regex = /(^|[^\\])<([^<>\r\n]+)>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    let content = match[2].trim();
    if (!content || content.startsWith('/')) {
      content = content.slice(1).trim();
    }
    if (!content || content.startsWith('!')) {
      content = content.slice(1).trim();
    }
    const name = content.split(':', 1)[0].toLowerCase();
    if (!/^#[a-f0-9]{6}$/i.test(name) && !KNOWN_MINI_TAGS.has(name)) {
      unsupported.add(name);
    }
  }
  return [...unsupported];
}

export function findUnresolvedPlaceholders(text: unknown): string[] {
  const unresolved = new Set<string>();
  const source = String(text ?? '');
  const regex = /[%{]([a-zA-Z0-9_.:-]+)[%}]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const token = match[1];
    if (!KNOWN_PLACEHOLDERS.has(token) && !token.startsWith('page')) {
      unresolved.add(match[0]);
    }
  }
  return [...unresolved];
}

export function validateConfig(config: Config, yamlError: string | null = null): ValidationResult {
  const cfg = config as unknown as AnyRecord;
  const issues: Issue[] = [];
  if (yamlError) {
    addIssue(issues, 'error', yamlError, 'yaml');
  }

  const menuSize = Number.parseInt(cfg.gui?.size, 10);
  if (!Number.isInteger(menuSize) || menuSize < 9 || menuSize > 54 || menuSize % 9 !== 0) {
    addIssue(issues, 'error', 'GUI size must be 9, 18, 27, 36, 45, or 54.', 'gui.size');
  }
  const safeMenuSize = Number.isInteger(menuSize) && menuSize > 0 ? menuSize : 54;
  const tagSlots = parseSlotList(cfg.gui?.tag_slots || [], safeMenuSize);
  for (const issue of tagSlots.issues) {
    addIssue(issues, 'error', issue, 'gui.tag_slots');
  }
  if (tagSlots.slots.length === 0) {
    addIssue(issues, 'error', 'At least one tag slot is required.', 'gui.tag_slots');
  }

  const materialChecks: Array<[string, unknown]> = [];
  materialChecks.push(['gui.tag_visible_item.material', cfg.gui?.tag_visible_item?.material]);
  for (const key of STATIC_ITEM_KEYS) {
    const item = cfg.gui?.[key] || {};
    materialChecks.push([`gui.${key}.material`, item.material]);
    const parsed = parseSlotList(item.slots || [], safeMenuSize);
    for (const issue of parsed.issues) {
      addIssue(issues, 'error', issue, `gui.${key}.slots`);
    }
  }

  const seenStaticSlots = new Map<number, string>();
  for (const key of STATIC_ITEM_KEYS) {
    const parsed = parseSlotList(cfg.gui?.[key]?.slots || [], safeMenuSize);
    for (const slot of parsed.slots) {
      if (seenStaticSlots.has(slot)) {
        addIssue(
          issues,
          'warning',
          `Static GUI items ${seenStaticSlots.get(slot)} and ${key} both use slot ${slot}.`,
          `gui.${key}.slots`,
        );
      }
      seenStaticSlots.set(slot, key);
      if (tagSlots.slots.includes(slot)) {
        addIssue(
          issues,
          'warning',
          `${key} uses tag slot ${slot}; it will cover a tag/category item.`,
          `gui.${key}.slots`,
        );
      }
    }
  }

  for (const [identifier, category] of Object.entries<AnyRecord>(cfg.categories || {})) {
    if (String(identifier).trim() === '') {
      addIssue(issues, 'error', 'Category id cannot be empty.', 'categories');
    }
    if (!isIntegerLike(category.order)) {
      addIssue(
        issues,
        'error',
        `Category ${identifier} order must be an integer.`,
        `categories.${identifier}.order`,
      );
    }
    materialChecks.push([`categories.${identifier}.item`, category.item]);
  }

  const tagOrders = new Map<number, string>();
  for (const [identifier, tag] of Object.entries<AnyRecord>(cfg.deluxetags || {})) {
    if (String(identifier).trim() === '') {
      addIssue(issues, 'error', 'Tag id cannot be empty.', 'deluxetags');
    }
    if (String(tag.tag || '').trim() === '') {
      addIssue(issues, 'error', `Tag ${identifier} needs a display tag.`, `deluxetags.${identifier}.tag`);
    }
    if (!isIntegerLike(tag.order)) {
      addIssue(issues, 'error', `Tag ${identifier} order must be an integer.`, `deluxetags.${identifier}.order`);
    } else {
      const order = Number.parseInt(tag.order, 10);
      if (tagOrders.has(order)) {
        addIssue(
          issues,
          'error',
          `Tags ${tagOrders.get(order)} and ${identifier} both use order ${order}.`,
          `deluxetags.${identifier}.order`,
        );
      } else {
        tagOrders.set(order, identifier);
      }
    }
    if (String(tag.category || '').toLowerCase() === 'all') {
      addIssue(
        issues,
        'warning',
        `Tag ${identifier} uses reserved category "all"; the plugin will move it to general.`,
        `deluxetags.${identifier}.category`,
      );
    } else if (!cfg.categories?.[tag.category]) {
      addIssue(
        issues,
        'warning',
        `Tag ${identifier} points at missing category "${tag.category}".`,
        `deluxetags.${identifier}.category`,
      );
    }
    materialChecks.push([`deluxetags.${identifier}.item`, tag.item]);
  }

  for (const [path, material] of materialChecks) {
    if (material == null || String(material).trim() === '') {
      addIssue(issues, 'error', 'Material cannot be empty.', path);
      continue;
    }
    const normalized = normalizeMaterial(material, '');
    if (normalized && !/^[A-Z0-9_]+$/.test(normalized)) {
      addIssue(issues, 'warning', `Material name ${normalized} may not resolve cleanly.`, path);
    }
  }

  for (const [identifier] of Object.entries(cfg.categories || {})) {
    if (identifier.toLowerCase() === 'all') {
      continue;
    }
    const hasTag = Object.values<AnyRecord>(cfg.deluxetags || {}).some(
      (tag) => String(tag.category).toLowerCase() === identifier.toLowerCase(),
    );
    if (!hasTag) {
      addIssue(issues, 'warning', `Category ${identifier} has no tags.`, `categories.${identifier}`);
    }
  }

  const externalPlaceholders = new Set<string>();
  const unsupportedMini = new Set<string>();
  for (const text of collectTextFields(cfg)) {
    for (const token of findUnresolvedPlaceholders(text)) {
      externalPlaceholders.add(token);
    }
    for (const tag of findUnsupportedMiniTags(text)) {
      unsupportedMini.add(tag);
    }
  }
  if (externalPlaceholders.size > 0) {
    addIssue(
      issues,
      'warning',
      `Preview leaves external placeholders unresolved: ${[...externalPlaceholders].slice(0, 8).join(', ')}.`,
      'placeholders',
    );
  }
  if (unsupportedMini.size > 0) {
    addIssue(
      issues,
      'warning',
      `MiniMessage preview may not render unsupported tags: ${[...unsupportedMini].join(', ')}.`,
      'minimessage',
    );
  }

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    ok: !issues.some((issue) => issue.severity === 'error'),
  };
}
