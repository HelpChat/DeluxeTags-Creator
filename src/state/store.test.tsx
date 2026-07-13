import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppProvider, useApp } from './store'
import { loadSavedConfig } from './persistence'

describe('store autosave wiring', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists a config edit to localStorage', async () => {
    const { result } = renderHook(() => useApp(), { wrapper: AppProvider })

    act(() => {
      result.current.dispatch({ type: 'set-path', path: 'config.gui.name', value: 'Persisted Menu' })
    })

    // The save is debounced, so poll until it lands.
    await waitFor(() => expect(loadSavedConfig()?.gui.name).toBe('Persisted Menu'))
  })

  it('restores the saved config on a fresh mount', async () => {
    const first = renderHook(() => useApp(), { wrapper: AppProvider })
    act(() => {
      first.result.current.dispatch({ type: 'set-path', path: 'config.gui.name', value: 'Restored Menu' })
    })
    await waitFor(() => expect(loadSavedConfig()?.gui.name).toBe('Restored Menu'))
    first.unmount()

    // A brand new provider (simulating a page reload) should start from the saved config.
    const second = renderHook(() => useApp(), { wrapper: AppProvider })
    expect(second.result.current.state.config.gui.name).toBe('Restored Menu')
  })
})
