import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { convertConfigTextToMiniMessage, createDefaultState, type Config, type Preview } from '../core'
import { historyReducer } from './reducer'
import { ensureSelections } from './operations'
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
  base.config.use_minimessage = true
  convertConfigTextToMiniMessage(base.config)
  const present: AppState = ensureSelections({
    config: base.config as Config,
    // Start with no equipped tag, so the first tag is not highlighted by default.
    preview: { ...(base.preview as Preview), activeTagId: '' },
    selection: { slot: null, marked: [], tag: 'example', category: 'general' },
    modal: 'none',
    yamlDraft: '',
    yamlError: null,
  })
  return { present, past: [], future: [] }
}

let toastSeq = 0

export function AppProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, makeInitialHistory)
  const [toasts, setToasts] = useState<Toast[]>([])
  const activeEditor = useRef<ActiveEditor | null>(null)
  const clipboard = useRef<ClipboardEntry[]>([])

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
