import { normalizeImportedConfig } from './config';
import { convertConfigTextToMiniMessage } from './minimessage';
import { clone } from './util';
import { dumpConfigYaml } from './yaml';
import { DEFAULT_PREVIEW } from './constants';
import type { Config, Preview } from './types';

// Typed, DOM-free equivalent of the legacy window.DeluxeTagsBuilder test API.
// Kept for tests and future automation (decision recorded in 01-core-port.md).

export interface BuilderState {
  config: Config;
  preview: Preview;
  yamlError: string | null;
}

export function getByPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<any>((target, key) => target?.[key], root);
}

export class DeluxeTagsBuilder {
  private _state: BuilderState;

  constructor(config?: unknown) {
    this._state = {
      config: normalizeImportedConfig(config ?? {}),
      preview: clone(DEFAULT_PREVIEW),
      yamlError: null,
    };
  }

  get state(): BuilderState {
    return clone(this._state);
  }

  load(config: unknown): void {
    this._state.config = normalizeImportedConfig(config);
    if (this._state.config.use_minimessage) {
      convertConfigTextToMiniMessage(this._state.config);
    }
  }

  getYaml(): string {
    return dumpConfigYaml(this._state.config, 'full');
  }

  getByPath(path: string): unknown {
    return getByPath(this._state, path);
  }
}
