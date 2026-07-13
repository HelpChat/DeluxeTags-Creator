import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultState, type Config } from '../core'
import { AUTOSAVE_STORAGE_KEY, clearSavedConfig, loadSavedConfig, saveConfig } from './persistence'

function defaultConfig(): Config {
  return createDefaultState().config as Config
}

describe('autosave persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(loadSavedConfig()).toBeNull()
  })

  it('round-trips a saved config', () => {
    const config = defaultConfig()
    config.gui.name = 'My Custom Tags'
    saveConfig(config)

    const loaded = loadSavedConfig()
    expect(loaded).not.toBeNull()
    expect(loaded?.gui.name).toBe('My Custom Tags')
  })

  it('coerces a partial stored payload into a complete config instead of returning null', () => {
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify({ gui: { name: 'Partial' } }))

    const loaded = loadSavedConfig()
    expect(loaded).not.toBeNull()
    expect(loaded?.gui.name).toBe('Partial')
    // Missing fields are filled from defaults by normalizeImportedConfig.
    expect(loaded?.categories).toBeDefined()
    expect(loaded?.deluxetags).toBeDefined()
  })

  it('returns null when the stored value is not valid JSON', () => {
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, 'not json {')
    expect(loadSavedConfig()).toBeNull()
  })

  it('clears the saved config', () => {
    saveConfig(defaultConfig())
    expect(loadSavedConfig()).not.toBeNull()

    clearSavedConfig()
    expect(loadSavedConfig()).toBeNull()
  })
})
