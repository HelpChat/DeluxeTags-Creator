import type { PreviewResult } from '../core'
import { useApp } from '../state/store'
import { TagEditor } from './TagEditor'
import { CategoryEditor } from './CategoryEditor'
import { StaticEditor } from './StaticEditor'
import { EmptySlotActions } from './EmptySlotActions'

function Hint() {
  const { dispatch } = useApp()
  return (
    <div className="ctx-hint">
      <div className="ctx-hint-icon">
        <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
          <rect x="1.5" y="1.5" width="4" height="4" rx=".5" />
          <rect x="6.5" y="1.5" width="4" height="4" rx=".5" />
          <rect x="11.5" y="1.5" width="3" height="4" rx=".5" />
          <rect x="1.5" y="7" width="4" height="4" rx=".5" />
          <rect x="6.5" y="7" width="4" height="4" rx=".5" />
          <rect x="11.5" y="7" width="3" height="4" rx=".5" />
        </svg>
      </div>
      <h2>Click a slot to edit</h2>
      <p>Click any slot in the inventory to edit it, or click an empty slot to add a tag, category, or button.</p>
      <div className="ctx-hint-actions">
        <button type="button" className="primary" onClick={() => dispatch({ type: 'add-tag' })}>
          + Add Tag
        </button>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'add-category' })}>
          + Add Category
        </button>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'open-modal', modal: 'generator' })}>
          Generate
        </button>
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 16, lineHeight: 1.6 }}>
        Shortcuts: Ctrl C and Ctrl V copy and paste, Ctrl D duplicate, Delete remove, arrow keys move
        the selection, Ctrl Z and Ctrl Y undo and redo.
      </p>
    </div>
  )
}

function PanelBody({ preview }: { preview: PreviewResult }) {
  const { state } = useApp()
  const { slot } = state.selection

  // While picking slots on the grid, keep that static item's editor open regardless of selection.
  if (state.slotPick && state.config.gui[state.slotPick]) {
    return <StaticEditor key={state.slotPick} itemKey={state.slotPick} />
  }

  if (slot == null) return <Hint />
  const item = preview.slots[slot]
  if (!item) return <EmptySlotActions slot={slot} />

  const ref = item.ref
  if (ref?.kind === 'tag') return <TagEditor key={ref.id} tagId={ref.id} />
  if (ref?.kind === 'category') return <CategoryEditor key={ref.id} catId={ref.id} />
  if (ref?.kind === 'static') return <StaticEditor key={ref.id} itemKey={ref.id} />
  return <Hint />
}

export function ContextPanel({ preview }: { preview: PreviewResult }) {
  return (
    <aside id="context-panel" aria-label="Tag editor">
      <PanelBody preview={preview} />
    </aside>
  )
}
