import { patchRawFromPlain, replaceStyledRange, styledPlainMap, styledRawRange } from './index';

// Mirrors StyledEditor.applyWrapper: wraps the visible selection [start,end) with opening/closing
// tags via the tag-aware helpers, so the assertions guard the colour/gradient apply path.
function wrapSelection(
  raw: string,
  start: number,
  end: number,
  opening: string,
  closing: string,
  useMini: boolean,
  fallback = 'Text',
): string {
  const { rawStart, rawEnd } = styledRawRange(raw, start, end, useMini);
  const body = end > start ? raw.slice(rawStart, rawEnd) : fallback;
  return replaceStyledRange(raw, start, end, opening + body + closing, useMini);
}

describe('styledPlainMap', () => {
  it('maps plain offsets across MiniMessage tags', () => {
    const raw = '<red>Hi<bold>X</bold>';
    const { plain, offsetToRaw } = styledPlainMap(raw, true);
    expect(plain).toBe('HiX');
    // first plain char ("H") begins right after the opening <red> tag
    expect(offsetToRaw[0]).toBe('<red>'.length);
    // the offset for "X" lands after the <bold> opening tag
    expect(offsetToRaw[2]).toBe('<red>Hi<bold>'.length);
    // end of "X" content (before the trailing closing tag)
    expect(offsetToRaw[plain.length]).toBe('<red>Hi<bold>X'.length);
  });

  it('strips legacy color codes when not in MiniMessage mode', () => {
    const { plain } = styledPlainMap('&aHi&lX', false);
    expect(plain).toBe('HiX');
  });
});

describe('replaceStyledRange (Bug A: tag aware editing)', () => {
  // The canonical repro from the audit: deleting the leading visible character must not drop
  // the tag that follows it.
  it('keeps a following tag when the preceding character is deleted', () => {
    expect(replaceStyledRange('A<bold>B', 0, 1, '', true)).toBe('<bold>B');
  });

  it('deletes the character immediately before a tag without touching the tag', () => {
    // raw is "AB<bold>C", plain "ABC". Deleting "B" (plain [1,2)) keeps <bold>.
    expect(replaceStyledRange('AB<bold>C', 1, 2, '', true)).toBe('A<bold>C');
  });

  it('replaces a styled selection and preserves the surrounding tags', () => {
    expect(replaceStyledRange('<red>AB</red>', 0, 1, 'X', true)).toBe('<red>XB</red>');
  });

  it('clears every visible character when a tag spanning selection is deleted', () => {
    expect(styledPlainMap(replaceStyledRange('<red>A</red><bold>B', 0, 2, '', true), true).plain).toBe('');
  });

  it('inserts at a caret on a tag boundary so the new text adopts the active style', () => {
    // caret at plain offset 1 (between A and the bold B) inserts ahead of B, inside <bold>
    expect(replaceStyledRange('A<bold>B', 1, 1, 'X', true)).toBe('A<bold>XB');
  });

  it('pastes over a selection, keeping outer tags', () => {
    expect(replaceStyledRange('<green>hello</green>', 1, 4, 'EY', true)).toBe('<green>hEYo</green>');
  });

  it('leaves legacy color codes intact when editing in legacy mode', () => {
    // raw "&aHello", plain "Hello". Delete "H" (plain [0,1)) keeps the &a code.
    expect(replaceStyledRange('&aHello', 0, 1, '', false)).toBe('&aello');
  });
});

describe('applyWrapper colour/gradient path (Item 6)', () => {
  it('wraps a selection without splicing into an adjacent tag', () => {
    // raw "<bold>AB</bold>", plain "AB". Colour-wrap just "A" (plain [0,1)).
    const out = wrapSelection('<bold>AB</bold>', 0, 1, '<color:#ff0000>', '</color>', true);
    expect(out).toBe('<bold><color:#ff0000>A</color>B</bold>');
    expect(styledPlainMap(out, true).plain).toBe('AB');
  });

  it('preserves inner tags contained in the wrapped selection', () => {
    const raw = 'a<bold>b</bold>c';
    // wrap the whole visible "abc" in a gradient
    const out = wrapSelection(raw, 0, 3, '<gradient:#55ffff:#ff55ff>', '</gradient>', true);
    expect(out).toBe('<gradient:#55ffff:#ff55ff>a<bold>b</bold>c</gradient>');
    expect(styledPlainMap(out, true).plain).toBe('abc');
  });

  it('inserts the fallback text at the caret when there is no selection (never wraps the whole field)', () => {
    const out = wrapSelection('Hello', 5, 5, '<color:#00ff00>', '</color>', true);
    expect(out).toBe('Hello<color:#00ff00>Text</color>');
    // the existing text is untouched
    expect(out.startsWith('Hello')).toBe(true);
  });
});

describe('patchRawFromPlain', () => {
  it('returns the same raw when the plain text is unchanged', () => {
    const raw = '<red>Hello<bold>!</bold>';
    const { plain } = styledPlainMap(raw, true);
    expect(patchRawFromPlain(raw, plain, plain, true)).toBe(raw);
  });

  it('applies a plain-text edit back into the styled raw', () => {
    const raw = '&aHello';
    const { plain } = styledPlainMap(raw, false); // "Hello"
    const patched = patchRawFromPlain(raw, plain, 'Help', false);
    expect(styledPlainMap(patched, false).plain).toBe('Help');
  });

  it('preserves tags when a character is deleted via the diff path', () => {
    // previous plain "AB" -> next plain "B" (deleted the leading A) must keep <bold>
    const patched = patchRawFromPlain('A<bold>B', 'AB', 'B', true);
    expect(patched).toBe('<bold>B');
  });

  it('does not corrupt tags when typing a character that matches adjacent text', () => {
    // raw "<red>aa</red>", plain "aa" -> "aaa". The tag must survive.
    const patched = patchRawFromPlain('<red>aa</red>', 'aa', 'aaa', true);
    expect(styledPlainMap(patched, true).plain).toBe('aaa');
    expect(patched).toContain('<red>');
    expect(patched).toContain('</red>');
  });
});
