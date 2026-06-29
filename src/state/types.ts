import type { Config, Preview } from '../core'

export type ModalKind = 'none' | 'settings' | 'import' | 'generator'

export interface Selection {
  /** Primary selected inventory slot index, or null when nothing is selected. */
  slot: number | null
  /** All marked slots for bulk operations (includes the primary slot). */
  marked: number[]
  /** Selected tag id (drives the tag editor). */
  tag: string
  /** Selected category id (drives the category editor). */
  category: string
}

/** How a slot click affects the multi-selection. */
export type SelectMode = 'single' | 'toggle' | 'range'

/** In-app clipboard entry for copy and paste of a tag or category. */
export interface ClipboardEntry {
  kind: 'tag' | 'category'
  baseId: string
  data: unknown
}

export interface AppState {
  config: Config
  preview: Preview
  selection: Selection
  modal: ModalKind
  /** Last imported or pasted YAML, retained so the import modal can show it again. */
  yamlDraft: string
  yamlError: string | null
}

/** A history entry snapshots only the config (config edits are undoable). */
export interface HistoryEntry {
  config: Config
  selection: Selection
}

export interface HistoryState {
  present: AppState
  past: HistoryEntry[]
  future: HistoryEntry[]
  /** Identifies the last edit so consecutive edits to the same field coalesce into one undo step. */
  lastEditKey?: string
}

export type Action =
  | { type: 'set-path'; path: string; value: unknown }
  | { type: 'select-slot'; slot: number | null; mode?: SelectMode }
  | { type: 'clear-marks' }
  | { type: 'bulk-delete' }
  | { type: 'bulk-duplicate' }
  | { type: 'bulk-move-category'; category: string }
  | { type: 'bulk-move-to-slot'; toSlot: number }
  | { type: 'add-tag' }
  | { type: 'add-category' }
  | { type: 'delete-tag'; id: string }
  | { type: 'delete-category'; id: string }
  | { type: 'rename-tag'; oldId: string; newId: string }
  | { type: 'rename-category'; oldId: string; newId: string }
  | { type: 'add-tag-at-slot'; slot: number }
  | { type: 'add-category-at-slot'; slot: number }
  | { type: 'set-static-at-slot'; key: string; slot: number }
  | { type: 'clone-tag'; id: string }
  | { type: 'clone-category'; id: string }
  | { type: 'paste-entries'; entries: ClipboardEntry[] }
  | { type: 'remove-static-slot'; key: string; slot: number }
  | { type: 'add-generated-tags'; tags: import('../generators').GeneratedTag[] }
  | { type: 'move-preview-item'; fromSlot: number; toSlot: number }
  | { type: 'pick-item'; path: string; material: string }
  | { type: 'preview-prev' }
  | { type: 'preview-next' }
  | { type: 'set-active-tag'; id: string }
  | { type: 'import'; config: Config; yamlDraft: string }
  | { type: 'open-modal'; modal: ModalKind }
  | { type: 'close-modal' }
  | { type: 'toggle-minimessage'; value: boolean }
  | { type: 'undo' }
  | { type: 'redo' }

/** A toast message shown in the live region. */
export interface Toast {
  id: number
  message: string
  error: boolean
}
