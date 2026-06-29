import { DEFAULT_PREVIEW } from './constants';
import { clone, normalizeData, normalizeMaterial, parseSlotList, toLines } from './util';
import { replacePlaceholders } from './placeholders';
import type { Config, Preview, PreviewItem, PreviewResult } from './types';

type AnyRecord = Record<string, any>;

export function sortedCategories(config: AnyRecord): AnyRecord[] {
  return Object.entries(config.categories || {})
    .map(([identifier, category]): AnyRecord => ({
      identifier,
      ...(category as AnyRecord),
      allCategory: identifier.toLowerCase() === 'all',
    }))
    .sort(
      (a, b) =>
        Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) ||
        a.identifier.localeCompare(b.identifier),
    );
}

export function sortedTags(config: AnyRecord): AnyRecord[] {
  return Object.entries(config.deluxetags || {})
    .map(([identifier, tag]): AnyRecord => ({ identifier, ...(tag as AnyRecord) }))
    .sort(
      (a, b) =>
        Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) ||
        a.identifier.localeCompare(b.identifier),
    );
}

export function tagCanSelect(tag: AnyRecord, preview: AnyRecord = {}): boolean {
  if (preview.permissionMode === 'none') {
    return false;
  }
  if (preview.permissionMode === 'custom') {
    return preview.unlockedTags?.[tag.identifier] !== false;
  }
  return true;
}

export function visibleTags(config: AnyRecord, preview: AnyRecord, categoryIdentifier = 'all'): AnyRecord[] {
  return sortedTags(config).filter((tag) => {
    const inCategory =
      categoryIdentifier.toLowerCase() === 'all' ||
      String(tag.category).toLowerCase() === categoryIdentifier.toLowerCase();
    if (!inCategory) {
      return false;
    }
    return preview.showLockedTags || tagCanSelect(tag, preview);
  });
}

export function availableTags(config: AnyRecord, preview: AnyRecord, categoryIdentifier = 'all'): AnyRecord[] {
  return visibleTags(config, { ...preview, showLockedTags: false }, categoryIdentifier);
}

export function selectableCategories(config: AnyRecord, preview: AnyRecord): AnyRecord[] {
  const visibleReal = sortedCategories(config)
    .filter((category) => !category.allCategory)
    .filter((category) => visibleTags(config, preview, category.identifier).length > 0);
  if (visibleReal.length >= 2) {
    const allCategory = sortedCategories(config).find((category) => category.allCategory);
    if (allCategory) {
      return [...visibleReal, allCategory].sort(
        (a, b) =>
          Number.parseInt(a.order, 10) - Number.parseInt(b.order, 10) ||
          a.identifier.localeCompare(b.identifier),
      );
    }
  }
  return visibleReal;
}

export function pageItems<T>(items: T[], page: unknown, pageSize: number): T[] {
  const safePage = Math.max(1, Number.parseInt(page as string, 10) || 1);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function currentTag(config: AnyRecord, preview: AnyRecord): AnyRecord | null {
  return sortedTags(config).find((tag) => tag.identifier === preview.activeTagId) || null;
}

export function buildContext(config: AnyRecord, preview: AnyRecord, extra: AnyRecord = {}): AnyRecord {
  const current = currentTag(config, preview);
  const amount = availableTags(config, preview, 'all').length;
  const categoryIdentifier = extra.categoryIdentifier || preview.category || 'all';
  const categoryAmount = availableTags(config, preview, categoryIdentifier).length;
  return {
    playerName: preview.playerName || 'Steve',
    displayName: preview.displayName || preview.playerName || 'Steve',
    currentTag: current,
    amount,
    categoryAmount,
    // When false, placeholders are left as their literal %name% text (raw mode).
    parse: preview.parsePlaceholders !== false,
    ...extra,
  };
}

export function makePreviewItem(
  raw: AnyRecord,
  config: Config,
  _preview: AnyRecord,
  context: AnyRecord,
  type: string,
  materialOverride: string | null = null,
): PreviewItem {
  const material = materialOverride || raw.material || raw.item || 'NAME_TAG';
  const displayname = replacePlaceholders(raw.displayname ?? raw.name ?? '', context, config);
  const lore = toLines(raw.lore ?? raw.description).flatMap((line) => {
    const resolved = replacePlaceholders(line, context, config);
    return resolved.split('\n');
  });
  const previewTag = context.tag || (type === 'has_tag_item' ? context.currentTag : null);
  return {
    type,
    material: normalizeMaterial(material, 'NAME_TAG'),
    data: normalizeData(raw.data, 0),
    displayname,
    lore,
    tagText: previewTag
      ? replacePlaceholders(previewTag.tag || '', { ...context, tag: previewTag }, config)
      : '',
    selected: Boolean(context.selected),
    canSelect: context.canSelect !== false,
    ref: context.ref || null,
  };
}

export function addStaticItem(
  slots: Array<PreviewItem | null>,
  config: Config,
  preview: AnyRecord,
  key: string,
  page: number,
  hasNextPage: boolean,
  categoryIdentifier: string,
): void {
  const item = (config.gui as AnyRecord)[key];
  const menuSize = Number.parseInt(config.gui.size as string, 10) || 54;
  const parsed = parseSlotList(item.slots || [], menuSize);
  const context = buildContext(config, preview, {
    page,
    hasNextPage,
    categoryIdentifier,
    ref: {
      kind: 'static',
      id: key,
    },
  });
  const previewItem = makePreviewItem(item, config, preview, context, key);
  for (const slot of parsed.slots) {
    if (slot >= 0 && slot < slots.length) {
      slots[slot] = previewItem;
    }
  }
}

export function clampPage(page: unknown, pages: number): number {
  const safePages = Math.max(1, pages || 1);
  return Math.min(Math.max(1, Number.parseInt(page as string, 10) || 1), safePages);
}

export function truncateTitle(title: unknown): string {
  const value = String(title ?? '');
  return value.length > 32 ? value.slice(0, 31) : value;
}

export function buildPreview(config: Config, previewInput: Preview = DEFAULT_PREVIEW): PreviewResult {
  const preview = { ...clone(DEFAULT_PREVIEW), ...clone(previewInput) } as AnyRecord;
  const menuSize = Number.parseInt(config.gui?.size as string, 10) || 54;
  const slots: Array<PreviewItem | null> = Array.from(
    { length: Math.max(9, Math.min(54, menuSize)) },
    () => null,
  );
  const tagSlots = parseSlotList(config.gui?.tag_slots || [], slots.length).slots;
  const categories = selectableCategories(config, preview);
  const shouldShowCategoryMenu =
    preview.screen === 'categories' || (preview.screen === 'auto' && categories.length >= 2);
  const pageSize = Math.max(1, tagSlots.length);

  if (shouldShowCategoryMenu) {
    const pages = Math.ceil(categories.length / pageSize) || 1;
    const page = clampPage(preview.page, pages);
    const hasNextPage = page < pages;
    const context = buildContext(config, preview, {
      page,
      hasNextPage,
      categoryIdentifier: 'all',
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
        categoryIdentifier: category.identifier,
      });
      slots[slot] = makePreviewItem(
        {
          material: category.item,
          displayname: category.name,
          lore: category.lore,
          data: 0,
        },
        config,
        preview,
        {
          ...itemContext,
          ref: {
            kind: 'category',
            id: category.identifier,
          },
        },
        'category',
      );
    }
    addStaticItem(slots, config, preview, 'divider_item', page, hasNextPage, 'all');
    addStaticItem(
      slots,
      config,
      preview,
      currentTag(config, preview) ? 'has_tag_item' : 'no_tag_item',
      page,
      hasNextPage,
      'all',
    );
    addStaticItem(slots, config, preview, 'exit_item', page, hasNextPage, 'all');
    if (page > 1) {
      addStaticItem(slots, config, preview, 'previous_page', page, hasNextPage, 'all');
    }
    if (hasNextPage) {
      addStaticItem(slots, config, preview, 'next_page', page, hasNextPage, 'all');
    }
    return {
      screen: 'categories',
      title,
      page,
      pages,
      slots,
      categoryIdentifier: 'all',
    };
  }

  const categoryIdentifier =
    preview.category && preview.category !== 'auto'
      ? preview.category
      : categories[0]?.identifier || 'all';
  const tags = visibleTags(config, preview, categoryIdentifier);
  const pages = Math.ceil(tags.length / pageSize) || 1;
  const page = clampPage(preview.page, pages);
  const hasNextPage = page < pages;
  const category = sortedCategories(config).find((item) => item.identifier === categoryIdentifier);
  const titleSource = category ? category.gui_name : config.gui.name;
  const title = truncateTitle(
    replacePlaceholders(
      titleSource,
      buildContext(config, preview, {
        page,
        hasNextPage,
        categoryIdentifier,
      }),
      config,
    ),
  );

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
        kind: 'tag',
        id: tag.identifier,
      },
    });
    slots[slot] = makePreviewItem(
      {
        material,
        data: canSelect ? tag.data : config.gui.tag_visible_item.data,
        displayname: tag.displayname,
        lore: tag.description,
      },
      config,
      preview,
      context,
      canSelect ? 'tag' : 'locked_tag',
      material,
    );
  }
  addStaticItem(slots, config, preview, 'divider_item', page, hasNextPage, categoryIdentifier);
  addStaticItem(
    slots,
    config,
    preview,
    currentTag(config, preview) ? 'has_tag_item' : 'no_tag_item',
    page,
    hasNextPage,
    categoryIdentifier,
  );
  addStaticItem(slots, config, preview, 'exit_item', page, hasNextPage, categoryIdentifier);
  if (categories.length >= 2) {
    addStaticItem(slots, config, preview, 'category_back_item', page, hasNextPage, categoryIdentifier);
  }
  if (page > 1) {
    addStaticItem(slots, config, preview, 'previous_page', page, hasNextPage, categoryIdentifier);
  }
  if (hasNextPage) {
    addStaticItem(slots, config, preview, 'next_page', page, hasNextPage, categoryIdentifier);
  }
  return {
    screen: 'tags',
    title,
    page,
    pages,
    slots,
    categoryIdentifier,
  };
}
