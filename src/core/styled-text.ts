import { MINI_EDITOR_TAGS } from './minimessage';

// Plain <-> raw mapping for the MiniMessage and legacy styled editor.
//
// Originally ported verbatim from static/app.js, where the functions read mutable
// module state. They are pure here: the use_minimessage flag is threaded as a parameter.
//
// Bug A fix (Phase 2): editing visible text near a tag boundary used to corrupt or drop
// tags because the typing path (patchRawFromPlain) mapped a prefix and suffix diff through
// an ambiguous offset map and could splice through a tag's raw bytes. The fix introduces a
// tag aware range replace (replaceStyledRange) that removes only the selected visible
// characters and leaves the surrounding tags intact, and routes patchRawFromPlain through
// it. The React editor passes exact selection ranges from beforeinput to replaceStyledRange.

export interface MiniEditorTag {
  end: number;
  text: string;
  opening: boolean;
}

export interface StyledPlainMap {
  plain: string;
  offsetToRaw: number[];
}

interface StyledSegment {
  rawStart: number;
  rawEnd: number;
  plain: string;
}

export function miniEditorTag(raw: string, index: number, useMiniMessage: boolean): MiniEditorTag | null {
  if (!useMiniMessage || raw[index] !== '<') return null;
  const end = raw.indexOf('>', index + 1);
  if (end === -1) return null;
  const content = raw.slice(index + 1, end).trim();
  const closing = content.startsWith('/');
  const clean = content.replace(/^\/+/, '').replace(/\s*\/$/, '');
  const name = clean.split(':', 1)[0].toLowerCase();
  if (name === 'newline' || name === 'br') {
    return { end: end + 1, text: '\n', opening: false };
  }
  if (/^#[a-f0-9]{6}$/i.test(name) || MINI_EDITOR_TAGS.has(name)) {
    return { end: end + 1, text: '', opening: !closing && name !== 'reset' };
  }
  return null;
}

// Split raw into segments: visible characters (plain length 1) and zero width markup
// (tags and color codes, plain length 0). A newline tag is a visible segment whose plain
// is a single newline but whose raw span covers the whole tag. This is the shared model
// behind both styledPlainMap and replaceStyledRange so their plain strings always agree.
function tokenizeStyled(raw: string, useMiniMessage: boolean): StyledSegment[] {
  const source = String(raw ?? '');
  const segments: StyledSegment[] = [];
  let i = 0;
  while (i < source.length) {
    const mini = miniEditorTag(source, i, useMiniMessage);
    if (mini) {
      segments.push({ rawStart: i, rawEnd: mini.end, plain: mini.text });
      i = mini.end;
      continue;
    }
    const rest = source.slice(i);
    const hex = rest.match(/^&#[a-f0-9]{6}/i) || rest.match(/^#[a-f0-9]{6}/i);
    if (hex) {
      segments.push({ rawStart: i, rawEnd: i + hex[0].length, plain: '' });
      i += hex[0].length;
      continue;
    }
    if (source[i] === '&' && /^[0-9a-fklmnor]$/i.test(source[i + 1] || '')) {
      segments.push({ rawStart: i, rawEnd: i + 2, plain: '' });
      i += 2;
      continue;
    }
    segments.push({ rawStart: i, rawEnd: i + 1, plain: source[i] });
    i += 1;
  }
  return segments;
}

// Per visible character raw ranges. charStart[k] is the raw index where plain char k begins,
// charEnd[k] is the raw index just past its bytes. Tags between characters are not part of
// any character range, so a deletion that targets characters never removes the tags around them.
function characterRanges(segments: StyledSegment[]): { starts: number[]; ends: number[] } {
  const starts: number[] = [];
  const ends: number[] = [];
  for (const segment of segments) {
    if (segment.plain.length > 0) {
      starts.push(segment.rawStart);
      ends.push(segment.rawEnd);
    }
  }
  return { starts, ends };
}

export function styledPlainMap(raw: unknown, useMiniMessage: boolean): StyledPlainMap {
  raw = String(raw ?? '');
  const source = raw as string;
  const offsetToRaw: number[] = [0];
  let plain = '';

  for (let i = 0; i < source.length; i += 1) {
    const rest = source.slice(i);
    const mini = miniEditorTag(source, i, useMiniMessage);
    if (mini) {
      if (mini.text) {
        if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = i;
        plain += mini.text;
        offsetToRaw[plain.length] = mini.end;
      } else if (mini.opening) {
        offsetToRaw[plain.length] = mini.end;
      }
      i = mini.end - 1;
      continue;
    }

    const hex = rest.match(/^&#[a-f0-9]{6}/i) || rest.match(/^#[a-f0-9]{6}/i);
    if (hex) {
      offsetToRaw[plain.length] = i + hex[0].length;
      i += hex[0].length - 1;
      continue;
    }

    if (source[i] === '&' && /^[0-9a-fklmnor]$/i.test(source[i + 1] || '')) {
      offsetToRaw[plain.length] = i + 2;
      i += 1;
      continue;
    }

    if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = i;
    plain += source[i];
    offsetToRaw[plain.length] = i + 1;
  }

  if (offsetToRaw[plain.length] == null) offsetToRaw[plain.length] = source.length;
  return { plain, offsetToRaw };
}

// Replace the visible characters in the plain range [plainStart, plainEnd) with insertText,
// preserving the styling tags that surround (and sit between) those characters.
//
// Deleting characters keeps the tags: deleting "A" from "A<bold>B" yields "<bold>B", so the
// bold styling survives. A zero width range is a pure insertion at the caret; the inserted
// text adopts the styling that is active just ahead of the caret, matching the previous
// editor behavior where a caret on a tag boundary sits after the opening tag.
export function replaceStyledRange(
  raw: string,
  plainStart: number,
  plainEnd: number,
  insertText: string,
  useMiniMessage: boolean,
): string {
  const source = String(raw ?? '');
  const segments = tokenizeStyled(source, useMiniMessage);
  const { starts, ends } = characterRanges(segments);
  const plainLength = starts.length;

  let start = Math.max(0, Math.min(plainStart, plainEnd));
  const end = Math.min(plainLength, Math.max(plainStart, plainEnd));
  if (start > plainLength) start = plainLength;

  const rawStart = start < plainLength ? starts[start] : source.length;
  const rawEnd = end > start ? ends[end - 1] : rawStart;
  return source.slice(0, rawStart) + insertText + source.slice(rawEnd);
}

export function commonPrefixLength(a: string, b: string): number {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
}

// Reconcile a new plain string back into the styled raw. Used as the fallback for input
// events that do not carry an explicit edit range. It locates the changed plain range with a
// prefix and suffix diff, then applies it through replaceStyledRange so tags are preserved.
// When an exact range is known (for example from a beforeinput event), call replaceStyledRange
// directly instead, which avoids the prefix and suffix ambiguity entirely.
export function patchRawFromPlain(
  raw: string,
  previousPlain: string,
  nextPlain: string,
  useMiniMessage: boolean,
): string {
  if (previousPlain === nextPlain) return raw;
  if (nextPlain === '') return '';
  const start = commonPrefixLength(previousPlain, nextPlain);
  let previousEnd = previousPlain.length;
  let nextEnd = nextPlain.length;
  while (
    previousEnd > start &&
    nextEnd > start &&
    previousPlain[previousEnd - 1] === nextPlain[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }
  return replaceStyledRange(raw, start, previousEnd, nextPlain.slice(start, nextEnd), useMiniMessage);
}
