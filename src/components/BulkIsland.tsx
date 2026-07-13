import { useApp } from '../state/store'
import { categoryIds, markedRefs } from '../state/operations'
import { useConfirm } from './ConfirmDialog'
import { Select } from './Select'

/**
 * A persistent floating island. It always shows the keyboard shortcuts, and when one or more slots
 * are selected it also shows the bulk actions. Copy and paste are keyboard-only (Ctrl C / Ctrl V).
 */
export function BulkIsland() {
  const { state, dispatch } = useApp()
  const confirm = useConfirm()
  const count = state.selection.marked.length
  const { tags, categories } = markedRefs(state)
  const hasItems = tags.length > 0 || categories.length > 0

  async function handleDelete() {
    const n = tags.length + categories.length
    const ok = await confirm({
      title: n > 1 ? 'Delete selected?' : 'Delete entry?',
      message: `Delete ${n} selected ${n === 1 ? 'entry' : 'entries'}? You can undo this with Ctrl Z.`,
    })
    if (ok) dispatch({ type: 'bulk-delete' })
  }

  return (
    <div className="bulk-island" role="toolbar" aria-label="Actions and shortcuts">
      <span className="bulk-count">{count > 0 ? `${count} selected` : 'No selection'}</span>
      <div className="bulk-actions">
        <button type="button" disabled={!hasItems} onClick={() => dispatch({ type: 'bulk-duplicate' })}>
          Duplicate
        </button>
        <Select
          className="bulk-move-select"
          ariaLabel="Move selected tags to category"
          placeholder="Move to…"
          disabled={tags.length === 0}
          dropUp
          value=""
          options={categoryIds(state.config, false).map((id) => ({ value: id, label: id }))}
          onChange={(category) => dispatch({ type: 'bulk-move-category', category })}
        />
        <button type="button" className="danger" disabled={!hasItems} onClick={handleDelete}>
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
