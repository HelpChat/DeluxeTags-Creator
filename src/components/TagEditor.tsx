import { useState } from 'react'
import { useApp } from '../state/store'
import { categoryIds, tagIds } from '../state/operations'
import { EditorField } from './EditorField'
import { ItemPicker } from './ItemPicker'
import { Select } from './Select'
import { useConfirm } from './ConfirmDialog'

export function TagEditor({ tagId }: { tagId: string }) {
  const { state, dispatch, toast } = useApp()
  const confirm = useConfirm()
  const config = state.config
  const tag = config.deluxetags[tagId]
  const [renameValue, setRenameValue] = useState(tagId)
  if (!tag) return null

  const base = `config.deluxetags.${tagId}`
  const setPath = (key: string, value: unknown) => dispatch({ type: 'set-path', path: `${base}.${key}`, value })
  const cats = categoryIds(config, false)
  const descVal = Array.isArray(tag.description) ? tag.description.join('\n') : String(tag.description ?? '')
  const unlocked = state.preview.unlockedTags[tagId] !== false

  function setUnlocked(value: boolean) {
    dispatch({ type: 'set-path', path: `preview.unlockedTags.${tagId}`, value })
    if (!value && state.preview.permissionMode !== 'custom') {
      dispatch({ type: 'set-path', path: 'preview.permissionMode', value: 'custom' })
    }
  }

  async function handleDelete() {
    if (tagIds(config).length <= 1) {
      toast('Cannot delete the last tag.', true)
      return
    }
    const ok = await confirm({
      title: 'Delete tag?',
      message: `Delete the tag "${tagId}"? You can undo this with Ctrl Z.`,
    })
    if (ok) dispatch({ type: 'delete-tag', id: tagId })
  }

  function handleRename() {
    const value = renameValue.trim()
    if (!value) {
      toast('ID cannot be empty.', true)
      return
    }
    if (value !== tagId && tagIds(config).includes(value)) {
      toast('That ID is already in use.', true)
      return
    }
    dispatch({ type: 'rename-tag', oldId: tagId, newId: value })
  }

  return (
    <>
      <div className="ctx-header">
        <div className="ctx-header-icon">
          <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
            <path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z" />
          </svg>
        </div>
        <div className="ctx-header-text">
          <strong>{tagId}</strong>
        </div>
        <button type="button" className="ctx-clone-btn" title="Duplicate tag (Ctrl+D)" onClick={() => dispatch({ type: 'clone-tag', id: tagId })}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
            <path d="M10.5 5.5V3.2A1.2 1.2 0 009.3 2H3.2A1.2 1.2 0 002 3.2v6.1A1.2 1.2 0 003.2 10.5h2.3" />
          </svg>
        </button>
        <button type="button" className="ctx-delete-btn" title="Delete tag" onClick={handleDelete}>
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="ctx-body">
        <EditorField label="Tag Text" value={tag.tag} config={config} context="tag" placeholder="&7[&eVIP&7]" onChange={(raw) => setPath('tag', raw)} />
        <EditorField
          label="Display Name"
          value={tag.displayname}
          config={config}
          context="tag"
          placeholder="&6Tag: %deluxetags_identifier%"
          onChange={(raw) => setPath('displayname', raw)}
        />
        <EditorField
          label="Description"
          value={descVal}
          config={config}
          context="tag"
          multiline
          rows={3}
          onChange={(raw) => setPath('description', raw.split('\n'))}
        />

        <div className="ctx-section">
          <span className="ctx-section-label">Item</span>
          <ItemPicker value={tag.item} iconTemplate={state.preview.iconTemplate} onPick={(material) => setPath('item', material)} />
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Data Value</span>
          <input
            type="number"
            value={tag.data === '' || tag.data == null ? '' : String(tag.data)}
            placeholder="0"
            onChange={(e) => setPath('data', e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))}
          />
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Preview Lock</span>
          <div className="settings-toggle-row">
            <label className="settings-toggle-label" htmlFor={`lock-${tagId}`}>
              Show as unlocked
              <small>Preview this tag as a player who has permission. Turn off to preview the locked look.</small>
            </label>
            <input
              id={`lock-${tagId}`}
              type="checkbox"
              checked={unlocked}
              onChange={(e) => setUnlocked(e.target.checked)}
            />
          </div>
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Permission</span>
          <input
            type="text"
            value={tag.permission}
            placeholder={`deluxetags.tag.${tagId}`}
            onChange={(e) => setPath('permission', e.target.value)}
          />
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Category</span>
          <Select
            ariaLabel="Category"
            className="field-select"
            value={tag.category}
            options={(cats.includes(tag.category) ? cats : [...cats, tag.category]).map((id) => ({ value: id, label: id }))}
            onChange={(value) => setPath('category', value)}
          />
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Unique Tag ID</span>
          <div className="rename-row">
            <input type="text" value={renameValue} placeholder={tagId} onChange={(e) => setRenameValue(e.target.value)} />
            <button type="button" onClick={handleRename}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
