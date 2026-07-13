import yaml from 'js-yaml';
import {
  buildExportObject,
  normalizeImportedConfig,
  parseConfigYaml,
} from './index';

describe('config migration and normalization', () => {
  it('migrates a legacy config (tag_select_item, tag_availability, custom section)', () => {
    const legacy = normalizeImportedConfig({
      deluxetags: {
        vip: {
          order: 1,
          category: 'all',
          tag: '&6VIP',
          description: '&7Legacy description',
        },
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
      gui: {
        tag_select_item: {
          material: 'DIAMOND',
          data: 3,
          displayname: '&6Legacy &f%deluxetags_identifier%',
          lore: ['%deluxetags_tag%', '%deluxetags_description%', '&7Click'],
        },
      },
      tag_availability_placeholder: {
        has_permission: '&aAllowed',
        no_permission: '&cNope',
      },
      custom_section: {
        enabled: true,
      },
    });

    expect(legacy.gui.tag_availability_placeholder.has_permission).toBe('&aAllowed');
    expect(legacy.gui.tag_availability_placeholder.no_permission).toBe('&cNope');
    expect(legacy.deluxetags.vip.category).toBe('general');
    expect(legacy.deluxetags.vip.displayname).toBe('&6Legacy &f%deluxetags_identifier%');
    expect(legacy.deluxetags.vip.description).toEqual([
      '%deluxetags_tag%',
      '&7Legacy description',
      '&7Click',
    ]);
    expect(legacy.deluxetags.vip.item).toBe('DIAMOND');
    expect(legacy.deluxetags.vip.data).toBe(3);
  });

  it('exports keys in canonical order with unknown top-level passthrough last', () => {
    const legacy = normalizeImportedConfig({
      deluxetags: { vip: { order: 1, category: 'all', tag: '&6VIP' } },
      custom_section: { enabled: true },
    });
    const exported = buildExportObject(legacy, 'full');
    expect(Object.keys(exported)).toEqual([
      'use_minimessage',
      'force_tags',
      'check_updates',
      'legacy_hex',
      'papi_chat',
      'format_chat',
      'load_tag_on_join',
      'gui',
      'categories',
      'deluxetags',
      'custom_section',
    ]);
  });

  it('parses YAML and round-trips through dump', () => {
    const config = parseConfigYaml('use_minimessage: true\nforce_tags: true\n');
    expect(config.use_minimessage).toBe(true);
    expect(config.force_tags).toBe(true);
    const dumped = yaml.dump(buildExportObject(config, 'full'));
    expect(yaml.load(dumped)).toMatchObject({ use_minimessage: true, force_tags: true });
  });
});

describe('unsupported advanced fields are dropped', () => {
  // DeluxeTags only supports material + data/ID for tag/category/GUI items. The builder no
  // longer reads, keeps, or serializes item_model / model_data / model_data_component.
  it('strips advanced fields from a static GUI item on import and export', () => {
    const config = normalizeImportedConfig({
      gui: {
        has_tag_item: {
          material: 'PLAYER_HEAD',
          item_model: 'mycraft:fancy_head',
          model_data: 42,
          model_data_component: { colors: ['#ff0000'], flags: ['true'], floats: [], strings: ['hello'] },
          slots: ['49'],
        },
      },
    });

    const item = config.gui.has_tag_item as Record<string, unknown>;
    expect(item.material).toBe('PLAYER_HEAD');
    expect(item.item_model).toBeUndefined();
    expect(item.model_data).toBeUndefined();
    expect(item.model_data_component).toBeUndefined();

    const exported = buildExportObject(config, 'full') as Record<string, any>;
    const exportedItem = exported.gui.has_tag_item;
    expect(exportedItem.item_model).toBeUndefined();
    expect(exportedItem.model_data).toBeUndefined();
    expect(exportedItem.model_data_component).toBeUndefined();
  });

  it('strips advanced fields from tags and categories', () => {
    const config = normalizeImportedConfig({
      deluxetags: { vip: { order: 1, tag: '&6VIP', item_model: 'mycraft:fancy', model_data: 7 } },
      categories: {
        general: { order: 1, item: 'NAME_TAG', name: '&6G', gui_name: '&6G', model_data: 12 },
      },
    });
    const tag = config.deluxetags.vip as unknown as Record<string, unknown>;
    expect(tag.item_model).toBeUndefined();
    expect(tag.model_data).toBeUndefined();
    expect((config.categories.general as unknown as Record<string, unknown>).model_data).toBeUndefined();

    const exported = buildExportObject(config, 'full') as Record<string, any>;
    expect(exported.deluxetags.vip.item_model).toBeUndefined();
    expect(exported.deluxetags.vip.model_data).toBeUndefined();
    expect(exported.categories.general.model_data).toBeUndefined();
  });
});

describe('tag_visible_item round-trip', () => {
  it('survives normalize and serialize (material + data only, no text/slots)', () => {
    const config = normalizeImportedConfig({
      gui: {
        tag_visible_item: {
          material: 'minecraft:barrier',
          data: 5,
          displayname: 'should be dropped',
          slots: ['10'],
        },
      },
    });
    expect(config.gui.tag_visible_item).toEqual({ material: 'BARRIER', data: 5 });

    const exported = buildExportObject(config, 'full') as Record<string, any>;
    expect(exported.gui.tag_visible_item).toEqual({ material: 'BARRIER', data: 5 });
    expect(exported.gui.tag_visible_item.displayname).toBeUndefined();
    expect(exported.gui.tag_visible_item.slots).toBeUndefined();
  });
});

describe('unknown top-level passthrough', () => {
  it('preserves unknown sections and keeps them after the known keys', () => {
    const config = normalizeImportedConfig({
      zzz_extra: { foo: 'bar', nested: { count: 2 } },
      another_block: [1, 2, 3],
    });
    expect(config.__unknownTopLevel.zzz_extra).toEqual({ foo: 'bar', nested: { count: 2 } });

    const exported = buildExportObject(config, 'full') as Record<string, unknown>;
    const keys = Object.keys(exported);
    expect(keys.slice(-2)).toEqual(['zzz_extra', 'another_block']);
    expect(exported.zzz_extra).toEqual({ foo: 'bar', nested: { count: 2 } });
    expect(exported.another_block).toEqual([1, 2, 3]);
    // known keys precede the passthrough
    expect(keys.indexOf('deluxetags')).toBeLessThan(keys.indexOf('zzz_extra'));
  });
});
