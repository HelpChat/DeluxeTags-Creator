import {
  convertConfigTextToMiniMessage,
  formatTextSegments,
  legacyToMiniMessage,
  miniToLegacy,
  normalizeImportedConfig,
} from './index';

const legacy = normalizeImportedConfig({
  deluxetags: { vip: { order: 1, tag: '&6VIP' } },
});

const miniConfig = normalizeImportedConfig({
  use_minimessage: true,
  deluxetags: { vip: { order: 1, tag: '<red><bold>VIP</bold>' } },
});

describe('formatTextSegments - legacy', () => {
  it('parses legacy color and format codes', () => {
    const segments = formatTextSegments('&aHi &lVIP', legacy);
    expect(segments[0].style.color).toBe('#55ff55');
    expect(segments[1].style.bold).toBe(true);
  });
});

describe('formatTextSegments - MiniMessage', () => {
  it('parses color and bold tags', () => {
    const segments = formatTextSegments('<red><bold>VIP</bold>', miniConfig);
    expect(segments[0].style.color).toBe('#ff5555');
    expect(segments[0].style.bold).toBe(true);
  });

  it('handles nested tags and closing scope', () => {
    const segments = formatTextSegments('<red>A <bold>B</bold> C</red>', miniConfig);
    expect(segments[2].text).toBe(' C');
    expect(segments[2].style.color).toBe('#ff5555');
    expect(segments[2].style.bold).toBe(false);
  });

  it('handles color: tag form and resets', () => {
    const colorTagSegments = formatTextSegments('<color:red>A</color> B', miniConfig);
    expect(colorTagSegments[0].style.color).toBe('#ff5555');
    expect(colorTagSegments[1].style.color).toBeNull();
    expect(formatTextSegments('<c:red>A</color> B', miniConfig)[1].style.color).toBeNull();
  });

  it('handles legacy_hex MiniMessage hex tags', () => {
    const legacyHexMini = normalizeImportedConfig({
      use_minimessage: true,
      legacy_hex: true,
    });
    expect(formatTextSegments('<#ff0000>X', legacyHexMini)[0].style.color).toBe('#ff0000');
  });
});

describe('miniToLegacy', () => {
  it('converts a gradient into per-character hex tokens', () => {
    const out = miniToLegacy('<gradient:#ff0000:#0000ff>AB</gradient>', miniConfig);
    expect(out).toContain('#ff0000');
    expect(out).toContain('#0000ff');
  });
});

describe('legacyToMiniMessage (reverse path)', () => {
  it('maps legacy color/format/hex codes to MiniMessage tags', () => {
    expect(legacyToMiniMessage('&aHi')).toBe('<green>Hi');
    expect(legacyToMiniMessage('&lBold')).toBe('<bold>Bold');
    expect(legacyToMiniMessage('&#ff0000Red')).toBe('<#ff0000>Red');
    expect(legacyToMiniMessage('&rReset')).toBe('<reset>Reset');
  });

  it('convertConfigTextToMiniMessage walks strings, arrays and objects', () => {
    const input = {
      tag: '&6VIP',
      lore: ['&aLine', '&cTwo'],
      nested: { name: '&lBold' },
    };
    const out = convertConfigTextToMiniMessage(input) as any;
    expect(out.tag).toBe('<gold>VIP');
    expect(out.lore).toEqual(['<green>Line', '<red>Two']);
    expect(out.nested.name).toBe('<bold>Bold');
  });
});

describe('placeholder replacement', () => {
  it('replaces player, identifier, amounts and pagination', async () => {
    const { replacePlaceholders } = await import('./index');
    const context = {
      playerName: 'Alex',
      displayName: 'AlexTheGreat',
      tag: { identifier: 'vip', tag: '&6VIP', description: ['&7Line one'] },
      currentTag: null,
      amount: 4,
      categoryAmount: 2,
      canSelect: true,
      page: 2,
      hasNextPage: true,
    };
    expect(
      replacePlaceholders(
        '%player% %displayname% %deluxetags_identifier% %deluxetags_amount% %current_page% %next_page%',
        context,
        legacy,
      ),
    ).toBe('Alex AlexTheGreat vip 4 2 3');
  });
});
