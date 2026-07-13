import { useState } from 'react'
import { useApp } from '../state/store'
import { EditorField } from './EditorField'
import { ItemPicker } from './ItemPicker'
import { useConfirm } from './ConfirmDialog'

export function CategoryEditor({ catId }: { catId: string }) {
  const { state, dispatch, toast } = useApp()
  const confirm = useConfirm()
  const config = state.config
  const cat = config.categories[catId]
  const [renameValue, setRenameValue] = useState(catId)
  if (!cat) return null

  const isAll = catId === 'all'
  const base = `config.categories.${catId}`
  const setPath = (key: string, value: unknown) => dispatch({ type: 'set-path', path: `${base}.${key}`, value })
  const loreVal = Array.isArray(cat.lore) ? cat.lore.join('\n') : String(cat.lore ?? '')

  function handleRename() {
    const value = renameValue.trim()
    if (!value || value === 'all') {
      toast('Invalid category ID.', true)
      return
    }
    if (value !== catId && config.categories[value]) {
      toast('That ID is already in use.', true)
      return
    }
    dispatch({ type: 'rename-category', oldId: catId, newId: value })
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete category?',
      message: `Delete the category "${catId}"? Its tags move to another category. You can undo this with Ctrl Z.`,
    })
    if (ok) dispatch({ type: 'delete-category', id: catId })
  }

  return (
    <>
      <div className="ctx-header">
        <div className="ctx-header-icon">
          <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M1.5 13.5V4.5h5.5l1.5-2H14.5v11z" />
          </svg>
        </div>
        <div className="ctx-header-text">
          <strong>{catId}</strong>
        </div>
        {isAll ? null : (
          <button type="button" className="ctx-clone-btn" title="Duplicate category (Ctrl+D)" onClick={() => dispatch({ type: 'clone-category', id: catId })}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
              <path d="M10.5 5.5V3.2A1.2 1.2 0 009.3 2H3.2A1.2 1.2 0 002 3.2v6.1A1.2 1.2 0 003.2 10.5h2.3" />
            </svg>
          </button>
        )}
        {isAll ? null : (
          <button type="button" className="ctx-delete-btn" title="Delete category" onClick={handleDelete}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      <div className="ctx-body">
        <EditorField label="Category Name" value={cat.name} config={config} context="category" placeholder="&6Category Name" onChange={(raw) => setPath('name', raw)} />
        <EditorField label="Menu Title" value={cat.gui_name} config={config} context="category" placeholder="&6Category Tags" onChange={(raw) => setPath('gui_name', raw)} />
        <EditorField label="Lore" value={loreVal} config={config} context="category" multiline rows={3} onChange={(raw) => setPath('lore', raw.split('\n'))} />

        <div className="ctx-section">
          <span className="ctx-section-label">Item</span>
          <ItemPicker value={cat.item} iconTemplate={state.preview.iconTemplate} onPick={(material) => setPath('item', material)} />
        </div>

        {isAll ? null : (
          <div className="ctx-section">
            <span className="ctx-section-label">Unique Category ID</span>
            <div className="rename-row">
              <input type="text" value={renameValue} placeholder={catId} onChange={(e) => setRenameValue(e.target.value)} />
              <button type="button" onClick={handleRename}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
