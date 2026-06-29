import { useEffect } from 'react'
import { buildPreview, clone, type PreviewResult } from '../core'
import { useApp } from '../state/store'
import { markedRefs } from '../state/operations'
import type { ClipboardEntry } from '../state/types'

const COLS = 9

/** Global keyboard shortcuts. Renders nothing; attaches a document keydown listener. */
export function Hotkeys({ preview }: { preview: PreviewResult }) {
  const { state, dispatch, clipboard, toast } = useApp()

  useEffect(() => {
    function isTyping(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }

    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        dispatch({ type: 'redo' })
        return
      }

      if (isTyping(e.target)) return

      if (e.key === 'Escape') {
        dispatch({ type: 'clear-marks' })
        return
      }

      const { tags, categories } = markedRefs(state)

      if (mod && key === 'c') {
        const entries: ClipboardEntry[] = [
          ...tags.map((id) => ({ kind: 'tag' as const, baseId: id, data: clone(state.config.deluxetags[id]) })),
          ...categories.map((id) => ({ kind: 'category' as const, baseId: id, data: clone(state.config.categories[id]) })),
        ]
        if (entries.length) {
          clipboard.current = entries
          toast(entries.length > 1 ? `Copied ${entries.length} items.` : 'Copied.')
        }
        return
      }

      if (mod && key === 'v') {
        if (clipboard.current.length) {
          e.preventDefault()
          dispatch({ type: 'paste-entries', entries: clipboard.current })
        }
        return
      }

      if (mod && key === 'd') {
        if (tags.length || categories.length) {
          e.preventDefault()
          dispatch({ type: 'bulk-duplicate' })
        }
        return
      }

      if (e.key === 'Delete') {
        if (tags.length || categories.length) {
          dispatch({ type: 'bulk-delete' })
        } else {
          const slot = state.selection.slot
          const ref = slot != null ? buildPreview(state.config, state.preview).slots[slot]?.ref : null
          if (ref?.kind === 'static' && slot != null) dispatch({ type: 'remove-static-slot', key: ref.id, slot })
        }
        return
      }

      if (e.key.startsWith('Arrow') && state.selection.slot != null) {
        const slot = state.selection.slot
        let next = slot
        if (e.key === 'ArrowLeft') next = slot - 1
        else if (e.key === 'ArrowRight') next = slot + 1
        else if (e.key === 'ArrowUp') next = slot - COLS
        else if (e.key === 'ArrowDown') next = slot + COLS
        if (next >= 0 && next < preview.slots.length) {
          e.preventDefault()
          dispatch({ type: 'select-slot', slot: next, mode: e.shiftKey ? 'range' : 'single' })
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state, preview, dispatch, clipboard, toast])

  return null
}
