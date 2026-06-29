import { DEFAULT_PREVIEW, buildPreview, normalizeImportedConfig } from './index';

const legacy = normalizeImportedConfig({
  deluxetags: {
    vip: { order: 1, category: 'general', tag: '&6VIP' },
  },
  categories: {
    general: {
      order: 1,
      item: 'NAME_TAG',
      name: '&6General',
      lore: ['&7General tags'],
      gui_name: '&6General tags',
    },
  },
});

describe('buildPreview', () => {
  it('builds a tag preview with the active tag slot', () => {
    const preview = buildPreview(legacy, {
      ...DEFAULT_PREVIEW,
      activeTagId: 'vip',
    });
    expect(preview.slots.length).toBeGreaterThanOrEqual(9);
    expect(preview.title.length).toBeLessThanOrEqual(32);
    const previewTag = preview.slots.find((slot) => slot?.ref?.kind === 'tag');
    expect(previewTag?.ref?.id).toBe('vip');
    expect(previewTag?.tagText).toBe('&6VIP');
  });

  it('parses placeholders in parsed mode and leaves them literal in raw mode', () => {
    const config = normalizeImportedConfig({
      deluxetags: { vip: { order: 1, category: 'general', tag: '&6VIP', displayname: '%deluxetags_amount% tags' } },
    });
    const findTag = (p: ReturnType<typeof buildPreview>) => p.slots.find((s) => s?.ref?.kind === 'tag');
    const parsed = findTag(buildPreview(config, { ...DEFAULT_PREVIEW, parsePlaceholders: true }));
    const raw = findTag(buildPreview(config, { ...DEFAULT_PREVIEW, parsePlaceholders: false }));
    expect(parsed?.displayname).not.toContain('%deluxetags_amount%');
    expect(raw?.displayname).toContain('%deluxetags_amount%');
  });
});
