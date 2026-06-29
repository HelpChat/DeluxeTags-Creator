import { useRef, useState, type CSSProperties } from 'react'
import type { PreviewResult } from '../core'
import { useApp } from '../state/store'
import { McText } from './McText'
import { Slot } from './Slot'
import { StyledEditor } from './StyledEditor'

type BuiltPreview = PreviewResult

export function InventoryArea({ preview }: { preview: BuiltPreview }) {
  const { state, dispatch } = useApp()
  const draggedSlot = useRef<number | null>(null)
  const rows = Math.ceil(preview.slots.length / 9)
  const marked = new Set(state.selection.marked)

  // The title shown is the menu name, or the current category's menu title in a category view.
  const catId = preview.categoryIdentifier
  const editingCategory =
    preview.screen === 'tags' && catId !== 'all' && state.config.categories[catId] ? catId : null
  const titlePath = editingCategory ? `config.categories.${editingCategory}.gui_name` : 'config.gui.name'
  const titleValue = editingCategory
    ? String(state.config.categories[editingCategory].gui_name)
    : String(state.config.gui.name)
  const [titleEditing, setTitleEditing] = useState(false)

  function handleSelect(index: number, event: React.MouseEvent) {
    // Ctrl/Cmd toggles a slot in the selection, Shift selects a range, plain click selects one.
    const mode = event.shiftKey ? 'range' : event.ctrlKey || event.metaKey ? 'toggle' : 'single'
    dispatch({ type: 'select-slot', slot: index, mode })
  }

  function handleDrop(toSlot: number) {
    const from = draggedSlot.current
    draggedSlot.current = null
    if (from == null) return
    // If the dragged slot is part of a multi-selection, move the whole group.
    if (marked.has(from) && state.selection.marked.length > 1) {
      dispatch({ type: 'bulk-move-to-slot', toSlot })
    } else {
      dispatch({ type: 'move-preview-item', fromSlot: from, toSlot })
    }
  }

  return (
    <div id="inventory-content">
      <div className="inventory-shell">
        <div className="inventory-title">
          {titleEditing ? (
            <StyledEditor
              key={titlePath}
              className="title-editor"
              value={titleValue}
              config={state.config}
              placeholder="Menu title"
              autoFocus
              onBlur={() => setTitleEditing(false)}
              onChange={(raw) => dispatch({ type: 'set-path', path: titlePath, value: raw })}
            />
          ) : (
            <strong className="title-display" title="Click to edit the title" onClick={() => setTitleEditing(true)}>
              {preview.title ? <McText raw={preview.title} config={state.config} /> : <span className="muted">Menu title</span>}
            </strong>
          )}
          <span>
            {preview.screen} {'·'} page {preview.page}/{preview.pages}
          </span>
        </div>
        <div className="inventory-grid" style={{ '--rows': rows } as CSSProperties}>
          {preview.slots.map((item, index) => (
            <Slot
              key={index}
              item={item}
              index={index}
              inspected={state.selection.slot === index}
              marked={marked.has(index)}
              config={state.config}
              iconTemplate={state.preview.iconTemplate}
              onSelect={handleSelect}
              onDragStart={(i) => {
                draggedSlot.current = i
              }}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
      <div className="page-nav">
        <button type="button" aria-label="Previous page" disabled={preview.page <= 1} onClick={() => dispatch({ type: 'preview-prev' })}>
          <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <span>
          Page {preview.page} of {preview.pages}
        </span>
        <button type="button" aria-label="Next page" disabled={preview.page >= preview.pages} onClick={() => dispatch({ type: 'preview-next' })}>
          <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
