import { buildPreview, clone, convertConfigTextToMiniMessage, createDefaultState, type Config } from '../core'
import type { Action, AppState, HistoryEntry, HistoryState } from './types'
import {
  addCategory,
  addCategoryAtSlot,
  addTag,
  addTagAtSlot,
  bulkDelete,
  bulkDuplicate,
  bulkMoveCategory,
  bulkMoveToSlot,
  clearMarks,
  cloneCategory,
  cloneTag,
  deleteCategory,
  deleteTag,
  ensureSelections,
  insertGeneratedTags,
  movePreviewItem,
  pasteEntries,
  removeStaticSlot,
  renameCategory,
  renameTag,
  selectSlot,
  setByPath,
  setStaticItemAtSlot,
  toggleStaticSlot,
} from './operations'

function snapshot(state: AppState): HistoryEntry {
  return { config: clone(state.config), selection: { ...state.selection } }
}

// Whether an action edits the config (and therefore belongs on the undo stack).
function isConfigEdit(action: Action): boolean {
  switch (action.type) {
    case 'set-path':
      return action.path.startsWith('config.')
    case 'add-tag':
    case 'add-category':
    case 'delete-tag':
    case 'delete-category':
    case 'rename-tag':
    case 'rename-category':
    case 'add-tag-at-slot':
    case 'add-category-at-slot':
    case 'set-static-at-slot':
    case 'toggle-static-slot':
    case 'clone-tag':
    case 'clone-category':
    case 'paste-entries':
    case 'bulk-delete':
    case 'bulk-duplicate':
    case 'bulk-move-category':
    case 'bulk-move-to-slot':
    case 'remove-static-slot':
    case 'add-generated-tags':
    case 'move-preview-item':
    case 'pick-item':
    case 'import':
    case 'reset':
    case 'toggle-minimessage':
      return true
    default:
      return false
  }
}

function applyAction(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'set-path':
      return setByPath(state, action.path, action.value)
    case 'select-slot':
      return selectSlot(state, action.slot, action.mode)
    case 'clear-marks':
      return clearMarks(state)
    case 'bulk-delete':
      return bulkDelete(state)
    case 'bulk-duplicate':
      return bulkDuplicate(state)
    case 'bulk-move-category':
      return bulkMoveCategory(state, action.category)
    case 'bulk-move-to-slot':
      return bulkMoveToSlot(state, action.toSlot)
    case 'add-tag':
      return addTag(state)
    case 'add-category':
      return addCategory(state)
    case 'delete-tag':
      return deleteTag(state, action.id)
    case 'delete-category':
      return deleteCategory(state, action.id)
    case 'rename-tag':
      return renameTag(state, action.oldId, action.newId) ?? state
    case 'rename-category':
      return renameCategory(state, action.oldId, action.newId) ?? state
    case 'add-tag-at-slot':
      return addTagAtSlot(state, action.slot)
    case 'add-category-at-slot':
      return addCategoryAtSlot(state, action.slot)
    case 'set-static-at-slot':
      return setStaticItemAtSlot(state, action.key, action.slot)
    case 'toggle-static-slot':
      return toggleStaticSlot(state, action.key, action.slot)
    case 'set-slot-pick':
      return state.slotPick === action.key ? state : { ...state, slotPick: action.key }
    case 'clone-tag':
      return cloneTag(state, action.id)
    case 'clone-category':
      return cloneCategory(state, action.id)
    case 'paste-entries':
      return pasteEntries(state, action.entries)
    case 'remove-static-slot':
      return removeStaticSlot(state, action.key, action.slot)
    case 'add-generated-tags':
      return insertGeneratedTags(state, action.tags)
    case 'move-preview-item':
      return movePreviewItem(state, action.fromSlot, action.toSlot)
    case 'pick-item':
      return setByPath(state, action.path, action.material)
    case 'preview-prev':
      return { ...state, preview: { ...state.preview, page: Math.max(1, (Number(state.preview.page) || 1) - 1) } }
    case 'preview-next': {
      const built = buildPreview(state.config, state.preview)
      return { ...state, preview: { ...state.preview, page: Math.min(built.pages, built.page + 1) } }
    }
    case 'set-active-tag':
      return { ...state, preview: { ...state.preview, activeTagId: action.id } }
    case 'import': {
      const config = clone(action.config)
      if (config.use_minimessage) convertConfigTextToMiniMessage(config)
      return {
        ...state,
        config,
        yamlDraft: action.yamlDraft,
        yamlError: null,
        selection: { ...state.selection, slot: null },
        slotPick: null,
      }
    }
    case 'reset': {
      // Rebuild the default config (MiniMessage on, matching first run) and clear the selection.
      const config = createDefaultState().config as Config
      config.use_minimessage = true
      convertConfigTextToMiniMessage(config)
      return {
        ...state,
        config,
        selection: { slot: null, marked: [], tag: 'example', category: 'general' },
        slotPick: null,
        yamlDraft: '',
        yamlError: null,
      }
    }
    case 'open-modal':
      return { ...state, modal: action.modal }
    case 'close-modal':
      return { ...state, modal: 'none' }
    case 'toggle-minimessage': {
      const config = setByPath(state, 'config.use_minimessage', action.value).config
      if (action.value) convertConfigTextToMiniMessage(config)
      return { ...state, config }
    }
    default:
      return state
  }
}

export function historyReducer(history: HistoryState, action: Action): HistoryState {
  if (action.type === 'undo') {
    if (history.past.length === 0) return history
    const previous = history.past[history.past.length - 1]
    const present: AppState = {
      ...history.present,
      config: clone(previous.config),
      selection: { ...previous.selection },
    }
    return {
      present: ensureSelections(present),
      past: history.past.slice(0, -1),
      future: [snapshot(history.present), ...history.future],
    }
  }

  if (action.type === 'redo') {
    if (history.future.length === 0) return history
    const nextEntry = history.future[0]
    const present: AppState = {
      ...history.present,
      config: clone(nextEntry.config),
      selection: { ...nextEntry.selection },
    }
    return {
      present: ensureSelections(present),
      past: [...history.past, snapshot(history.present)],
      future: history.future.slice(1),
    }
  }

  const present = ensureSelections(applyAction(history.present, action))
  if (present === history.present) return history

  if (isConfigEdit(action)) {
    const editKey = action.type === 'set-path' ? `set-path:${action.path}` : undefined
    // Coalesce consecutive edits to the same field (for example typing) into one undo step.
    if (editKey && editKey === history.lastEditKey) {
      return { present, past: history.past, future: [], lastEditKey: editKey }
    }
    return {
      present,
      past: [...history.past, snapshot(history.present)],
      future: [],
      lastEditKey: editKey,
    }
  }
  return { ...history, present, lastEditKey: undefined }
}
