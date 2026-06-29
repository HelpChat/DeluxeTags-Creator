import { normalizeImportedConfig, parseSlotList, validateConfig } from './index';

describe('parseSlotList', () => {
  it('expands ranges and singles, deduplicating', () => {
    const result = parseSlotList(['0-2', '8'], 9);
    expect(result.slots).toEqual([0, 1, 2, 8]);
    expect(result.issues).toEqual([]);
  });

  it('reports malformed, reversed and out-of-range tokens', () => {
    expect(parseSlotList(['5-3', 'nope', '99'], 9).issues.length).toBeGreaterThanOrEqual(3);
  });
});

describe('validateConfig', () => {
  it('flags duplicate tag orders as errors', () => {
    const duplicate = normalizeImportedConfig({
      deluxetags: {
        one: { order: 1, tag: '&aOne' },
        two: { order: 1, tag: '&bTwo' },
      },
    });
    const result = validateConfig(duplicate);
    expect(result.errors.some((issue) => issue.message.includes('both use order 1'))).toBe(true);
  });

  it('does not warn for valid aliased materials', () => {
    const aliasConfig = normalizeImportedConfig({
      categories: {
        general: {
          order: 1,
          item: 'minecraft:player-head',
          name: '&6General',
          lore: ['&7General tags'],
          gui_name: '&6General tags',
        },
      },
      deluxetags: {
        heady: {
          order: 1,
          category: 'general',
          tag: '&eHead',
          item: 'player-head',
        },
      },
    });
    const result = validateConfig(aliasConfig);
    expect(aliasConfig.categories.general.item).toBe('PLAYER_HEAD');
    expect(aliasConfig.deluxetags.heady.item).toBe('PLAYER_HEAD');
    expect(result.warnings.some((issue) => issue.path === 'categories.general.item')).toBe(false);
    expect(result.warnings.some((issue) => issue.path === 'deluxetags.heady.item')).toBe(false);
  });
});
