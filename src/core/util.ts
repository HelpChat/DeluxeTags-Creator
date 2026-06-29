import { MATERIAL_ALIASES } from './constants';

export function clone<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mergePlain(base: unknown, override: unknown): any {
  const output = clone(base) as any;
  if (!isPlainObject(override)) {
    return output;
  }
  for (const key of Object.keys(override)) {
    if (isPlainObject(output[key]) && isPlainObject(override[key])) {
      output[key] = mergePlain(output[key], override[key]);
    } else {
      output[key] = clone(override[key]);
    }
  }
  return output;
}

export function toLines(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map((line) => String(line));
  }
  if (value == null) {
    return clone(fallback);
  }
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

export function toSlotEntries(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value == null) {
    return clone(fallback);
  }
  return [String(value)];
}

export function normalizeMaterial(value: unknown, fallback?: unknown): string {
  const raw = value == null ? fallback : value;
  const normalized = String(raw == null ? '' : raw)
    .trim()
    .replace(/^minecraft:/i, '')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .toUpperCase();
  return MATERIAL_ALIASES[normalized] || normalized;
}

export function normalizeData(value: unknown, fallback: number | string = 0): number | string {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number.parseInt(value as string, 10);
  return Number.isFinite(parsed) ? parsed : (value as number | string);
}

export function asExportNumber(value: unknown): number | string {
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && String(parsed) === String(value).trim()
    ? parsed
    : (value as number | string);
}

export function isIntegerLike(value: unknown): boolean {
  return /^-?\d+$/.test(String(value ?? '').trim());
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface SlotListResult {
  slots: number[];
  issues: string[];
}

export function parseSlotList(value: unknown, menuSize = 54): SlotListResult {
  const entries = toSlotEntries(value);
  const slots: number[] = [];
  const issues: string[] = [];
  for (const entry of entries) {
    const token = String(entry).trim();
    if (token === '') {
      continue;
    }
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = token.match(/^\d+$/);
    if (range) {
      const start = Number.parseInt(range[1], 10);
      const end = Number.parseInt(range[2], 10);
      if (end < start) {
        issues.push(`Slot range "${token}" ends before it starts.`);
        continue;
      }
      for (let slot = start; slot <= end; slot += 1) {
        slots.push(slot);
      }
      continue;
    }
    if (single) {
      slots.push(Number.parseInt(token, 10));
      continue;
    }
    issues.push(`Slot token "${token}" is malformed.`);
  }
  for (const slot of slots) {
    if (slot < 0 || slot >= menuSize) {
      issues.push(`Slot ${slot} is outside menu size ${menuSize}.`);
    }
  }
  return {
    slots: [...new Set(slots)],
    issues,
  };
}

export function renameKey(
  object: Record<string, unknown> | null | undefined,
  oldKey: string,
  newKey: string,
): boolean {
  const trimmed = String(newKey || '').trim();
  if (!trimmed || oldKey === trimmed || !object || object[trimmed]) {
    return false;
  }
  const entries = Object.entries(object);
  const next: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    next[key === oldKey ? trimmed : key] = value;
  }
  for (const key of Object.keys(object)) {
    delete object[key];
  }
  Object.assign(object, next);
  return true;
}
