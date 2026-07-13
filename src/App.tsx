import { useEffect, useMemo } from 'react'
import { buildPreview, dumpConfigYaml } from './core'
import { AppProvider, useApp } from './state/store'
import { Nav } from './components/Nav'
import { Toasts } from './components/Toasts'
import { InventoryArea } from './components/InventoryArea'
import { ContextPanel } from './components/ContextPanel'
import { SettingsModal } from './components/SettingsModal'
import { ImportModal } from './components/ImportModal'
import { GeneratorModal } from './components/GeneratorModal'
import { Hotkeys } from './components/Hotkeys'
import { BulkIsland } from './components/BulkIsland'
import { ConfirmProvider } from './components/ConfirmDialog'

function Modals() {
  const { state, dispatch } = useApp()
  if (state.modal === 'none') return null
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) dispatch({ type: 'close-modal' })
      }}
    >
      {state.modal === 'settings' ? <SettingsModal /> : state.modal === 'import' ? <ImportModal /> : <GeneratorModal />}
    </div>
  )
}

function Builder() {
  const { state } = useApp()
  const preview = useMemo(() => buildPreview(state.config, state.preview), [state.config, state.preview])

  // Re-exposed test handle (Phase 1 decision): lets tests and automation read state without the UI.
  useEffect(() => {
    ;(window as unknown as { DeluxeTagsBuilder?: unknown }).DeluxeTagsBuilder = {
      getState: () => state,
      getYaml: () => dumpConfigYaml(state.config, 'full'),
    }
  }, [state])

  return (
    <>
      <Nav />
      <Toasts />
      <Hotkeys preview={preview} />
      <main id="builder-app">
        <section id="inventory-area" aria-label="Minecraft inventory preview">
          <InventoryArea preview={preview} />
        </section>
        <ContextPanel preview={preview} />
      </main>
      <BulkIsland />
      <Modals />
    </>
  )
}

export function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <Builder />
      </ConfirmProvider>
    </AppProvider>
  )
}
