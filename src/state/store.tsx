import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { convertConfigTextToMiniMessage, createDefaultState, type Config, type Preview } from '../core'
import { historyReducer } from './reducer'
import { ensureSelections } from './operations'
import { loadSavedConfig, saveConfig } from './persistence'
import type { Action, AppState, ClipboardEntry, HistoryState, Toast } from './types'

/**
 * Imperative handle a focused styled editor registers so the color helper can act on it
 * without routing through React state (which would re-render and drop the caret).
 */
export interface ActiveEditor {
  applyWrapper(opening: string, closing: string, fallbackText?: string): void
  insertText(text: string): void
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  canUndo: boolean
  canRedo: boolean
  toasts: Toast[]
  toast(message: string, error?: boolean): void
  activeEditor: React.MutableRefObject<ActiveEditor | null>
  clipboard: React.MutableRefObject<ClipboardEntry[]>
}

const AppContext = createContext<AppContextValue | null>(null)

function makeInitialHistory(): HistoryState {
  const base = createDefaultState()
  // Restore the autosaved config when present; otherwise start from the default,
  // enabling MiniMessage as the first-run default.
  const saved = loadSavedConfig()
  let config: Config
  if (saved) {
    config = saved
  } else {
    base.config.use_minimessage = true
    convertConfigTextToMiniMessage(base.config)
    config = base.config as Config
  }
  const present: AppState = ensureSelections({
    config,
    // Start with no equipped tag, so the first tag is not highlighted by default.
    preview: { ...(base.preview as Preview), activeTagId: '' },
    selection: { slot: null, marked: [], tag: 'example', category: 'general' },
    modal: 'none',
    yamlDraft: '',
    yamlError: null,
    slotPick: null,
  })
  return { present, past: [], future: [] }
}

let toastSeq = 0

export function AppProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, makeInitialHistory)
  const [toasts, setToasts] = useState<Toast[]>([])
  const activeEditor = useRef<ActiveEditor | null>(null)
  const clipboard = useRef<ClipboardEntry[]>([])

  // Autosave the config to localStorage, debounced so rapid edits (typing) write once.
  // Only fires when the config reference changes, so pure UI actions do not touch storage.
  const saveTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (saveTimer.current !== undefined) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveConfig(history.present.config)
    }, 400)
    return () => {
      if (saveTimer.current !== undefined) window.clearTimeout(saveTimer.current)
    }
  }, [history.present.config])

  const toast = useCallback((message: string, error = false) => {
    toastSeq += 1
    const entry: Toast = { id: toastSeq, message, error }
    setToasts((current) => [...current, entry])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== entry.id))
    }, 2800)
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      state: history.present,
      dispatch,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      toasts,
      toast,
      activeEditor,
      clipboard,
    }),
    [history, toasts, toast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used within an AppProvider')
  return value
}
