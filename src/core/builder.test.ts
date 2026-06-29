import yaml from 'js-yaml';
import { DeluxeTagsBuilder } from './index';

describe('DeluxeTagsBuilder test API', () => {
  it('exposes a cloned state snapshot', () => {
    const builder = new DeluxeTagsBuilder({ deluxetags: { vip: { order: 1, tag: '&6VIP' } } });
    const a = builder.state;
    const b = builder.state;
    expect(a).not.toBe(b);
    expect(a.config.deluxetags.vip.tag).toBe('&6VIP');
  });

  it('load() converts text to MiniMessage when use_minimessage is enabled', () => {
    const builder = new DeluxeTagsBuilder();
    builder.load({ use_minimessage: true, deluxetags: { vip: { order: 1, tag: '&6VIP' } } });
    expect(builder.state.config.deluxetags.vip.tag).toBe('<gold>VIP');
  });

  it('getYaml() returns a parseable full config', () => {
    const builder = new DeluxeTagsBuilder({ deluxetags: { vip: { order: 1, tag: '&6VIP' } } });
    const parsed = yaml.load(builder.getYaml()) as Record<string, any>;
    expect(parsed.deluxetags.vip.tag).toBe('&6VIP');
  });

  it('getByPath() reads nested state values', () => {
    const builder = new DeluxeTagsBuilder({ deluxetags: { vip: { order: 1, tag: '&6VIP' } } });
    expect(builder.getByPath('config.deluxetags.vip.tag')).toBe('&6VIP');
  });
});
