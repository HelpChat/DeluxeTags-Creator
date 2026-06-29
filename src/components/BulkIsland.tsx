import { clone } from '../core'
import { useApp } from '../state/store'
import { categoryIds, markedRefs } from '../state/operations'
import type { ClipboardEntry } from '../state/types'

/**
 * A persistent floating island. It always shows the keyboard shortcuts, and when one or more slots
 * are selected it also shows the bulk actions.
 */
export function BulkIsland() {
  const { state, dispatch, clipboard, toast } = useApp()
  const count = state.selection.marked.length
  const { tags, categories } = markedRefs(state)
  const hasItems = tags.length > 0 || categories.length > 0

  function copy() {
    const entries: ClipboardEntry[] = [
      ...tags.map((id) => ({ kind: 'tag' as const, baseId: id, data: clone(state.config.deluxetags[id]) })),
      ...categories.map((id) => ({ kind: 'category' as const, baseId: id, data: clone(state.config.categories[id]) })),
    ]
    if (entries.length) {
      clipboard.current = entries
      toast(`Copied ${entries.length} item${entries.length > 1 ? 's' : ''}.`)
    }
  }

  return (
    <div className="bulk-island" role="toolbar" aria-label="Actions and shortcuts">
      <span className="bulk-count">{count > 0 ? `${count} selected` : 'No selection'}</span>
      <div className="bulk-actions">
        <button type="button" disabled={!hasItems} onClick={copy}>
          Copy
        </button>
        <button type="button" disabled={!hasItems} onClick={() => dispatch({ type: 'bulk-duplicate' })}>
          Duplicate
        </button>
        <select
          value=""
          disabled={tags.length === 0}
          aria-label="Move selected tags to category"
          onChange={(e) => {
            if (e.target.value) dispatch({ type: 'bulk-move-category', category: e.target.value })
          }}
        >
          <option value="" disabled>
            Move to…
          </option>
          {categoryIds(state.config, false).map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button type="button" className="danger" disabled={!hasItems} onClick={() => dispatch({ type: 'bulk-delete' })}>
          Delete
        </button>
        <button type="button" disabled={count === 0} onClick={() => dispatch({ type: 'clear-marks' })}>
          Clear
        </button>
      </div>
      <span className="bulk-hint">
        Ctrl C copy · Ctrl V paste · Ctrl D duplicate · Del delete · arrows move · Ctrl Z / Ctrl Y undo and redo
      </span>
    </div>
  )
}
