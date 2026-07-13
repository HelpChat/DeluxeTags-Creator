import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { parseSlotList, type PreviewResult } from '../core'
import { useApp } from '../state/store'
import { categoryIds, menuSize } from '../state/operations'
import { McText } from './McText'
import { Select } from './Select'
import { Slot } from './Slot'
import { StyledEditor } from './StyledEditor'

type BuiltPreview = PreviewResult

export function InventoryArea({ preview }: { preview: BuiltPreview }) {
  const { state, dispatch, toast } = useApp()
  const draggedSlot = useRef<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const rows = Math.ceil(preview.slots.length / 9)
  const marked = new Set(state.selection.marked)

  // Slot-picking mode for a static GUI item: clicking slots toggles them in that item's slot list.
  const slotPick = state.slotPick
  const pickItem = slotPick ? (state.config.gui[slotPick] as Record<string, unknown> | undefined) : undefined
  const assignedSlots = new Set(
    slotPick && pickItem ? parseSlotList((pickItem.slots as string[]) || [], menuSize(state.config)).slots : [],
  )

  // Let Escape leave picking mode, matching the popovers and dialogs elsewhere.
  useEffect(() => {
    if (!slotPick) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dispatch({ type: 'set-slot-pick', key: null })
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slotPick, dispatch])

  function pickToggle(index: number) {
    if (!slotPick) return
    if (assignedSlots.has(index) || preview.slots[index] == null) {
      dispatch({ type: 'toggle-static-slot', key: slotPick, slot: index })
    } else {
      toast('That slot is already used.', true)
    }
  }

  // The title shown is the menu name, or the current category's menu title in a category view.
  const catId = preview.categoryIdentifier
  const editingCategory =
    preview.screen === 'tags' && catId !== 'all' && state.config.categories[catId] ? catId : null
  const titlePath = editingCategory ? `config.categories.${editingCategory}.gui_name` : 'config.gui.name'
  const titleValue = editingCategory
    ? String(state.config.categories[editingCategory].gui_name)
    : String(state.config.gui.name)
  const [titleEditing, setTitleEditing] = useState(false)

  const cats = categoryIds(state.config, false)
  function setScreen(screen: 'tags' | 'categories') {
    dispatch({ type: 'set-path', path: 'preview.screen', value: screen })
    dispatch({ type: 'set-path', path: 'preview.page', value: 1 })
  }
  function setCategory(category: string) {
    // Picking a category implies the tags view, so force it off the category menu.
    dispatch({ type: 'set-path', path: 'preview.category', value: category })
    dispatch({ type: 'set-path', path: 'preview.screen', value: 'tags' })
    dispatch({ type: 'set-path', path: 'preview.page', value: 1 })
  }

  function handleSelect(index: number, event: React.MouseEvent) {
    // While picking, clicks assign slots to the static item instead of selecting.
    if (slotPick) {
      pickToggle(index)
      return
    }
    // Ctrl/Cmd toggles a slot in the selection, Shift selects a range, plain click selects one.
    const mode = event.shiftKey ? 'range' : event.ctrlKey || event.metaKey ? 'toggle' : 'single'
    dispatch({ type: 'select-slot', slot: index, mode })
  }

  function handleDrop(toSlot: number) {
    const from = draggedSlot.current
    draggedSlot.current = null
    setDropTarget(null)
    setDragging(false)
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
          <div className="view-switcher">
            <button type="button" className={preview.screen === 'tags' ? 'active' : ''} onClick={() => setScreen('tags')}>
              Tags
            </button>
            <button
              type="button"
              className={preview.screen === 'categories' ? 'active' : ''}
              onClick={() => setScreen('categories')}
            >
              Categories
            </button>
            {preview.screen === 'tags' && cats.length > 0 && (
              <Select
                ariaLabel="Preview category"
                className="switcher-select"
                align="right"
                value={cats.includes(preview.categoryIdentifier) ? preview.categoryIdentifier : 'all'}
                options={[{ value: 'all', label: 'All tags' }, ...cats.map((id) => ({ value: id, label: id }))]}
                onChange={setCategory}
              />
            )}
            {preview.screen === 'categories' && (
              <button type="button" className="add-category-btn" onClick={() => dispatch({ type: 'add-category' })}>
                + Add Category
              </button>
            )}
          </div>
        </div>
        {slotPick && (
          <div className="pick-banner" role="status">
            <span>Click slots in the preview to assign them. Click an assigned slot to remove it.</span>
            <button type="button" className="primary" onClick={() => dispatch({ type: 'set-slot-pick', key: null })}>
              Done
            </button>
          </div>
        )}
        <div
          className={`inventory-grid${slotPick ? ' picking' : ''}${dragging ? ' dragging' : ''}`}
          style={{ '--rows': rows } as CSSProperties}
          onDragEnd={() => {
            setDropTarget(null)
            setDragging(false)
          }}
        >
          {preview.slots.map((item, index) => (
            <Slot
              key={index}
              item={item}
              index={index}
              inspected={state.selection.slot === index}
              marked={marked.has(index)}
              picking={!!slotPick}
              assigned={assignedSlots.has(index)}
              config={state.config}
              iconTemplate={state.preview.iconTemplate}
              dropTarget={dropTarget === index}
              onSelect={handleSelect}
              onDragStart={(i) => {
                draggedSlot.current = i
                setDragging(true)
              }}
              onDragEnter={setDropTarget}
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
