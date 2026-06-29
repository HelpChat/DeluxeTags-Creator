import yaml from 'js-yaml';
import { buildExportObject, normalizeImportedConfig } from './config';
import { isPlainObject } from './util';
import type { Config } from './types';

export function dumpConfigYaml(config: Config, mode = 'full'): string {
  return yaml.dump(buildExportObject(config as unknown as Record<string, unknown>, mode), {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'",
  });
}

export function parseConfigYaml(text: string): Config {
  const parsed = yaml.load(text || '') || {};
  if (!isPlainObject(parsed)) {
    throw new Error('Top-level YAML must be a mapping.');
  }
  return normalizeImportedConfig(parsed);
}
