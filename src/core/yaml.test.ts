import yaml from 'js-yaml';
import { dumpConfigYaml, normalizeImportedConfig, parseConfigYaml } from './index';

const legacy = normalizeImportedConfig({
  deluxetags: {
    vip: { order: 1, category: 'general', tag: '&6VIP' },
  },
});

describe('dumpConfigYaml', () => {
  it('dumps the tags export and preserves the default permission', () => {
    const dumpedTags = dumpConfigYaml(legacy, 'tags');
    const parsedTags = yaml.load(dumpedTags) as Record<string, any>;
    expect(Object.keys(parsedTags)).toEqual(['deluxetags']);
    expect(parsedTags.deluxetags.vip.permission).toBe('deluxetags.tag.vip');
  });

  it('uses single-quote quoting style', () => {
    const dumped = dumpConfigYaml(legacy, 'full');
    // js-yaml with quotingType "'" prefers single quotes for quoted scalars
    expect(dumped).not.toContain('"deluxetags.tag.vip"');
  });
});

describe('parseConfigYaml', () => {
  it('throws when top-level is not a mapping', () => {
    expect(() => parseConfigYaml('- 1\n- 2\n')).toThrow('Top-level YAML must be a mapping.');
  });

  it('round-trips a dumped config', () => {
    const dumped = dumpConfigYaml(legacy, 'full');
    const reparsed = parseConfigYaml(dumped);
    expect(reparsed.deluxetags.vip.tag).toBe('&6VIP');
  });
});
