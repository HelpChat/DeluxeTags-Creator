import {
  DEFAULT_CONFIG,
  LEGACY_COLORS,
  LEGACY_FORMATS,
  MINI_COLORS,
  MINI_FORMAT_CANONICAL,
  MINI_FORMAT_CODES,
} from './constants';
import { escapeHtml } from './util';
import type { Config, FormatSegment, StyleState } from './types';

// Maps used by the reverse (legacy -> MiniMessage) path. Ported from static/app.js.
const LEGACY_TO_MINI_COLORS: Readonly<Record<string, string>> = Object.freeze({
  '0': 'black',
  '1': 'dark_blue',
  '2': 'dark_green',
  '3': 'dark_aqua',
  '4': 'dark_red',
  '5': 'dark_purple',
  '6': 'gold',
  '7': 'gray',
  '8': 'dark_gray',
  '9': 'blue',
  a: 'green',
  b: 'aqua',
  c: 'red',
  d: 'light_purple',
  e: 'yellow',
  f: 'white',
});

const LEGACY_TO_MINI_FORMATS: Readonly<Record<string, string>> = Object.freeze({
  l: 'bold',
  o: 'italic',
  n: 'underlined',
  m: 'strikethrough',
  k: 'obfuscated',
  r: 'reset',
});

interface MiniTagInfo {
  type: 'reset' | 'color' | 'format';
  name: string;
  code?: string;
}

export function parseHex(value: unknown): number[] | null {
  const match = String(value || '').match(/^#?([a-f0-9]{6})$/i);
  if (!match) {
    return null;
  }
  const hex = match[1];
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
}

export function interpolateColor(start: string, end: string, ratio: number): string {
  const from = parseHex(start);
  const to = parseHex(end);
  if (!from || !to) {
    return start;
  }
  const mixed = from.map((value, index) => Math.round(value + (to[index] - value) * ratio));
  return '#' + mixed.map((value) => value.toString(16).padStart(2, '0')).join('');
}

export function hexToken(value: string, config: Config): string {
  const clean = String(value).replace(/^#/, '');
  return config.legacy_hex ? `&#${clean}` : `#${clean}`;
}

// Resolves a gradient stop (hex or named color) to a #rrggbb string, or null if unknown.
function resolveStopHex(stop: string): string | null {
  const value = String(stop).trim().toLowerCase();
  if (/^#?[a-f0-9]{6}$/.test(value)) return '#' + value.replace(/^#/, '');
  const code = MINI_COLORS[value];
  if (code) {
    const hex = LEGACY_COLORS[code.replace('&', '')];
    if (hex) return hex;
  }
  return null;
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const i = Math.floor(hue * 6);
  const f = hue * 6 - i;
  const p = value * (1 - saturation);
  const q = value * (1 - f * saturation);
  const t = value * (1 - (1 - f) * saturation);
  let r = 0;
  let g = 0;
  let b = 0;
  switch (((i % 6) + 6) % 6) {
    case 0: [r, g, b] = [value, t, p]; break;
    case 1: [r, g, b] = [q, value, p]; break;
    case 2: [r, g, b] = [p, value, t]; break;
    case 3: [r, g, b] = [p, q, value]; break;
    case 4: [r, g, b] = [t, p, value]; break;
    default: [r, g, b] = [value, p, q]; break;
  }
  return '#' + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

// Renders <gradient:c1:c2:...:cN[:phase]> with hex or named stops and any number of stops.
export function applyGradientMiniMessage(input: unknown, config: Config): string {
  return String(input).replace(
    /<gradient((?::[^:>\s]+)+)>([\s\S]*?)<\/gradient>/gi,
    (_all, argStr: string, body: string) => {
      const args = argStr.split(':').filter(Boolean);
      let phase = 0;
      let stopArgs = args;
      const last = args[args.length - 1];
      if (args.length > 2 && /^-?\d*\.?\d+$/.test(last)) {
        phase = Number.parseFloat(last);
        stopArgs = args.slice(0, -1);
      }
      const stops = stopArgs.map(resolveStopHex).filter((s): s is string => s != null);
      const chars = [...body];
      if (chars.length === 0) return '';
      if (stops.length < 2) return body;
      return chars
        .map((char, index) => {
          let t = chars.length === 1 ? 0 : index / (chars.length - 1);
          if (phase !== 0) {
            // A phase shifts the gradient cyclically; without it the endpoints stay at 0 and 1.
            t = (t + phase) % 1;
            if (t < 0) t += 1;
          }
          const pos = t * (stops.length - 1);
          const i = Math.min(stops.length - 2, Math.floor(pos));
          const color = interpolateColor(stops[i], stops[i + 1], pos - i);
          return `${hexToken(color, config)}${char}`;
        })
        .join('');
    },
  );
}

// Renders <rainbow[:phase]> by sweeping the hue wheel across the body.
export function applyRainbowMiniMessage(input: unknown, config: Config): string {
  return String(input).replace(
    /<rainbow(:[^>\s]+)?>([\s\S]*?)<\/rainbow>/gi,
    (_all, phaseArg: string | undefined, body: string) => {
      const chars = [...body];
      if (chars.length === 0) return '';
      let phase = 0;
      if (phaseArg) {
        const parsed = Number.parseFloat(phaseArg.slice(1));
        if (Number.isFinite(parsed)) phase = parsed;
      }
      return chars
        .map((char, index) => {
          let hue = (chars.length <= 1 ? 0 : index / chars.length) + phase;
          hue -= Math.floor(hue);
          return `${hexToken(hsvToHex(hue, 1, 1), config)}${char}`;
        })
        .join('');
    },
  );
}

export function normalizeMiniColorName(name: string): string {
  if (name === 'grey') {
    return 'gray';
  }
  if (name === 'dark_grey') {
    return 'dark_gray';
  }
  return name;
}

export function miniTagInfo(content: string, config: Config): MiniTagInfo | null {
  const clean = String(content || '')
    .trim()
    .replace(/\s*\/$/, '');
  const [rawName, ...rawArgs] = clean.split(':');
  const name = rawName.toLowerCase();
  const args = rawArgs.join(':');
  if (name === 'reset') {
    return { type: 'reset', name };
  }
  if (MINI_COLORS[name]) {
    return { type: 'color', name: normalizeMiniColorName(name), code: MINI_COLORS[name] };
  }
  if (MINI_FORMAT_CODES[name]) {
    return { type: 'format', name: MINI_FORMAT_CANONICAL[name], code: MINI_FORMAT_CODES[name] };
  }
  if (['color', 'colour', 'c'].includes(name) && args) {
    const color = args.trim().toLowerCase();
    if (/^#[a-f0-9]{6}$/i.test(color)) {
      return { type: 'color', name: 'color', code: hexToken(color, config) };
    }
    if (MINI_COLORS[color]) {
      return { type: 'color', name: 'color', code: MINI_COLORS[color] };
    }
  }
  if (/^#[a-f0-9]{6}$/i.test(name)) {
    return { type: 'color', name, code: hexToken(name, config) };
  }
  return null;
}

export function activeMiniCodes(stack: MiniTagInfo[]): string {
  const lastColor = [...stack].reverse().find((entry) => entry.type === 'color');
  const formats: string[] = [];
  const seen = new Set<string>();
  for (const entry of stack) {
    if (entry.type === 'format' && !seen.has(entry.name)) {
      seen.add(entry.name);
      formats.push(entry.code as string);
    }
  }
  return (lastColor ? (lastColor.code as string) : '') + formats.join('');
}

export function activeMiniFormatCodes(stack: MiniTagInfo[]): string {
  const formats: string[] = [];
  const seen = new Set<string>();
  for (const entry of stack) {
    if (entry.type === 'format' && !seen.has(entry.name)) {
      seen.add(entry.name);
      formats.push(entry.code as string);
    }
  }
  return formats.join('');
}

export function removeLastMiniTag(stack: MiniTagInfo[], name: string): boolean {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i].name === name) {
      stack.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function miniToLegacy(input: unknown, config: Config): string {
  let output = applyGradientMiniMessage(input, config);
  output = applyRainbowMiniMessage(output, config);
  output = output.replace(/<newline\s*\/?>|<br\s*\/?>/gi, '\n');
  const stack: MiniTagInfo[] = [];
  output = output.replace(/<(!?\/?)([^<>\r\n]+)>/g, (match, prefix: string, content: string) => {
    const closing = prefix.includes('/');
    let name = String(content)
      .trim()
      .replace(/\s*\/$/, '')
      .split(':', 1)[0]
      .toLowerCase();
    if (name.startsWith('/')) {
      name = name.slice(1);
    }
    name = normalizeMiniColorName(name);
    const info = miniTagInfo(content, config);
    if (!info && closing && ['color', 'colour', 'c'].includes(name)) {
      removeLastMiniTag(stack, 'color');
      const active = activeMiniCodes(stack);
      return active ? `&r${active}` : '&r';
    }
    if (!info) {
      return match;
    }
    if (info.type === 'reset') {
      stack.length = 0;
      return '&r';
    }
    if (closing) {
      removeLastMiniTag(stack, info.name || name);
      const active = activeMiniCodes(stack);
      return active ? `&r${active}` : '&r';
    }
    stack.push(info);
    if (info.type === 'color') {
      return (info.code as string) + activeMiniFormatCodes(stack);
    }
    return info.code as string;
  });
  return output;
}

export function formatTextSegments(text: unknown, config: Config = DEFAULT_CONFIG): FormatSegment[] {
  const prepared = config.use_minimessage ? miniToLegacy(String(text ?? ''), config) : String(text ?? '');
  const segments: FormatSegment[] = [];
  let style: StyleState = {
    color: null,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    obfuscated: false,
  };
  let buffer = '';

  const flush = () => {
    if (buffer !== '') {
      segments.push({ text: buffer, style: { ...style } });
      buffer = '';
    }
  };

  for (let i = 0; i < prepared.length; i += 1) {
    const rest = prepared.slice(i);
    const hexPattern = config.legacy_hex ? /^&#([a-f0-9]{6})/i : /^#([a-f0-9]{6})/i;
    const hex = rest.match(hexPattern);
    if (hex) {
      flush();
      style.color = '#' + hex[1].toLowerCase();
      i += hex[0].length - 1;
      continue;
    }

    if (prepared[i] === '&' && i + 1 < prepared.length) {
      const code = prepared[i + 1].toLowerCase();
      if (LEGACY_COLORS[code]) {
        flush();
        style = {
          color: LEGACY_COLORS[code],
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          obfuscated: false,
        };
        i += 1;
        continue;
      }
      if (LEGACY_FORMATS[code]) {
        flush();
        (style as unknown as Record<string, boolean>)[LEGACY_FORMATS[code]] = true;
        i += 1;
        continue;
      }
      if (code === 'r') {
        flush();
        style = {
          color: null,
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
          obfuscated: false,
        };
        i += 1;
        continue;
      }
    }

    buffer += prepared[i];
  }
  flush();
  return segments;
}

export function formatTextHtml(text: unknown, config: Config = DEFAULT_CONFIG): string {
  return formatTextSegments(text, config)
    .map((segment) => {
      const declarations: string[] = [];
      if (segment.style.color) {
        declarations.push(`color:${segment.style.color}`);
      }
      if (segment.style.bold) {
        declarations.push('font-weight:700');
      }
      if (segment.style.italic) {
        declarations.push('font-style:italic');
      }
      const decorations: string[] = [];
      if (segment.style.underline) {
        decorations.push('underline');
      }
      if (segment.style.strikethrough) {
        decorations.push('line-through');
      }
      if (decorations.length > 0) {
        declarations.push(`text-decoration:${decorations.join(' ')}`);
      }
      if (segment.style.obfuscated) {
        declarations.push('filter:blur(1px)');
      }
      return `<span style="${declarations.join(';')}">${escapeHtml(segment.text).replace(/\n/g, '<br>')}</span>`;
    })
    .join('');
}

// Reverse path ported from static/app.js (legacy -> MiniMessage).
export function legacyToMiniMessage(value: unknown): string {
  return String(value ?? '')
    .replace(/&#([a-f0-9]{6})/gi, (_all, hex: string) => `<#${hex.toLowerCase()}>`)
    .replace(/&([0-9a-f])/gi, (_all, code: string) => `<${LEGACY_TO_MINI_COLORS[code.toLowerCase()]}>`)
    .replace(/&([klmnor])/gi, (_all, code: string) => `<${LEGACY_TO_MINI_FORMATS[code.toLowerCase()]}>`);
}

export function convertConfigTextToMiniMessage(value: unknown): unknown {
  if (typeof value === 'string') {
    return legacyToMiniMessage(value);
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = convertConfigTextToMiniMessage(value[i]);
    }
    return value;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      obj[key] = convertConfigTextToMiniMessage(obj[key]);
    }
  }
  return value;
}

// Set of editor-recognized MiniMessage tag names. Ported from static/app.js
// MINI_EDITOR_TAGS. Used by styled-text.ts.
export const MINI_EDITOR_TAGS: ReadonlySet<string> = new Set([
  'black',
  'dark_blue',
  'dark_green',
  'dark_aqua',
  'dark_red',
  'dark_purple',
  'gold',
  'gray',
  'dark_gray',
  'blue',
  'green',
  'aqua',
  'red',
  'light_purple',
  'yellow',
  'white',
  ...Object.values(LEGACY_TO_MINI_FORMATS),
  'color',
  'colour',
  'c',
  'gradient',
  'rainbow',
  'transition',
  'newline',
  'br',
  'reset',
]);
