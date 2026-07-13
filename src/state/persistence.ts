import { normalizeImportedConfig, type Config } from '../core'

/** Versioned key so a future breaking change can migrate or discard old autosaves. */
export const AUTOSAVE_STORAGE_KEY = 'deluxetags:autosave:v1'

/** localStorage can throw on access in private mode or sandboxed frames, so guard every use. */
function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Load the autosaved config, or null when there is nothing valid to restore.
 * Anything stored is run through normalizeImportedConfig so a partial or stale
 * payload is coerced into a complete Config rather than crashing the app.
 */
export function loadSavedConfig(): Config | null {
  const storage = getStorage()
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(AUTOSAVE_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    return normalizeImportedConfig(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Persist the config. Best effort: quota or private-mode errors are swallowed. */
export function saveConfig(config: Config): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore write failures; autosave must never break the editor.
  }
}

/** Drop the autosave, for example when the user resets to a fresh config. */
export function clearSavedConfig(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(AUTOSAVE_STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
