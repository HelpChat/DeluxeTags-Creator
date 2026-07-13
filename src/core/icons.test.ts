import { iconCandidates, materialToTextureId } from './index';

describe('materialToTextureId', () => {
  it('normalizes minecraft-prefixed and hyphenated names', () => {
    expect(materialToTextureId('minecraft:player-head')).toBe('player_head');
  });
});

describe('iconCandidates', () => {
  it('resolves player head to the steve wide skin first', () => {
    expect(iconCandidates('minecraft:player-head')[0].includes('/entity/player/wide/steve.png')).toBe(true);
    expect(iconCandidates('PLAYER_HEAD').some((url) => url.includes('/entity/player/wide/steve.png'))).toBe(
      true,
    );
  });

  it('maps stained glass panes to the underlying block texture', () => {
    expect(iconCandidates('BLACK_STAINED_GLASS_PANE')[0].includes('/block/black_stained_glass.png')).toBe(
      true,
    );
  });

  it('returns a de-duplicated list of full URLs', () => {
    const urls = iconCandidates('STONE');
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith('https://') && url.endsWith('.png'))).toBe(true);
  });

  describe('variant blocks resolve via _top / _side / _front candidates', () => {
    it('grass block adds top and side variants', () => {
      const urls = iconCandidates('GRASS_BLOCK');
      expect(urls.some((url) => url.includes('/block/grass_block_top.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/grass_block_side.png'))).toBe(true);
    });

    it('furnace adds front / side / top variants', () => {
      const urls = iconCandidates('FURNACE');
      expect(urls.some((url) => url.includes('/block/furnace_front.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/furnace_side.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/furnace_top.png'))).toBe(true);
    });

    it('blast furnace and smoker resolve via their front variant', () => {
      expect(iconCandidates('BLAST_FURNACE').some((url) => url.includes('/block/blast_furnace_front.png'))).toBe(
        true,
      );
      expect(iconCandidates('SMOKER').some((url) => url.includes('/block/smoker_front.png'))).toBe(true);
    });

    it('crafting table adds top / front / side variants', () => {
      const urls = iconCandidates('CRAFTING_TABLE');
      expect(urls.some((url) => url.includes('/block/crafting_table_top.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/crafting_table_front.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/crafting_table_side.png'))).toBe(true);
    });

    it('lectern uses the sides (plural) variant filename', () => {
      const urls = iconCandidates('LECTERN');
      expect(urls.some((url) => url.includes('/block/lectern_front.png'))).toBe(true);
      expect(urls.some((url) => url.includes('/block/lectern_sides.png'))).toBe(true);
    });

    it('tnt resolves via its side face (there is no flat block/tnt.png)', () => {
      const urls = iconCandidates('TNT');
      expect(urls.some((url) => url.includes('/block/tnt_side.png'))).toBe(true);
    });

    it('pumpkin and melon resolve via side / top faces', () => {
      expect(iconCandidates('PUMPKIN').some((url) => url.includes('/block/pumpkin_side.png'))).toBe(true);
      expect(iconCandidates('MELON').some((url) => url.includes('/block/melon_side.png'))).toBe(true);
    });

    it('other variant blocks resolve to at least one variant texture', () => {
      for (const material of ['LOOM', 'BARREL', 'COMPOSTER', 'JUKEBOX', 'CAULDRON']) {
        const id = material.toLowerCase();
        const urls = iconCandidates(material);
        expect(urls.some((url) => /\/block\/.+_(top|side|sides|front|bottom)\.png$/.test(url))).toBe(true);
        expect(urls.some((url) => url.includes(`/block/${id}_`))).toBe(true);
      }
    });
  });

  describe('entity-rendered materials resolve to curated paths', () => {
    it('chests resolve to the curated chest entity textures', () => {
      expect(iconCandidates('CHEST').some((url) => url.includes('/entity/chest/normal.png'))).toBe(true);
      expect(iconCandidates('TRAPPED_CHEST').some((url) => url.includes('/entity/chest/trapped.png'))).toBe(
        true,
      );
      expect(iconCandidates('ENDER_CHEST').some((url) => url.includes('/entity/chest/ender.png'))).toBe(true);
    });

    it('shulker boxes resolve to curated shulker entity textures', () => {
      expect(iconCandidates('SHULKER_BOX').some((url) => url.includes('/entity/shulker/shulker.png'))).toBe(
        true,
      );
      expect(
        iconCandidates('BLACK_SHULKER_BOX').some((url) => url.includes('/entity/shulker/shulker_black.png')),
      ).toBe(true);
      expect(
        iconCandidates('LIME_SHULKER_BOX').some((url) => url.includes('/entity/shulker/shulker_lime.png')),
      ).toBe(true);
    });

    it('mob heads and skulls resolve to curated entity textures', () => {
      expect(iconCandidates('CREEPER_HEAD').some((url) => url.includes('/entity/creeper/creeper.png'))).toBe(
        true,
      );
      expect(iconCandidates('ZOMBIE_HEAD').some((url) => url.includes('/entity/zombie/zombie.png'))).toBe(true);
      expect(
        iconCandidates('SKELETON_SKULL').some((url) => url.includes('/entity/skeleton/skeleton.png')),
      ).toBe(true);
      expect(
        iconCandidates('WITHER_SKELETON_SKULL').some((url) =>
          url.includes('/entity/skeleton/wither_skeleton.png'),
        ),
      ).toBe(true);
      expect(iconCandidates('PIGLIN_HEAD').some((url) => url.includes('/entity/piglin/piglin.png'))).toBe(true);
      expect(
        iconCandidates('DRAGON_HEAD').some((url) => url.includes('/entity/enderdragon/dragon.png')),
      ).toBe(true);
    });

    it('routes wall-head aliases through the curated head textures', () => {
      expect(
        iconCandidates('CREEPER_WALL_HEAD').some((url) => url.includes('/entity/creeper/creeper.png')),
      ).toBe(true);
    });
  });

  it('threads a custom template through both variant and entity candidates', () => {
    const template = 'https://example.test/{folder}/{id}.png';
    expect(iconCandidates('GRASS_BLOCK', template)).toContain('https://example.test/block/grass_block_top.png');
    expect(iconCandidates('CHEST', template)).toContain('https://example.test/entity/chest/normal.png');
  });
});
