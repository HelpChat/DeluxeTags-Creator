import { useState } from 'react'
import { iconCandidates } from '../core'
import { useApp } from '../state/store'
import { categoryIds, tagIds } from '../state/operations'
import { AdvancedFields } from './AdvancedFields'
import { EditorField } from './EditorField'
import { ItemPicker } from './ItemPicker'
import { MaterialIcon } from './MaterialIcon'
import { McText } from './McText'
import { PlaceholderPalette } from './PlaceholderPalette'

export function TagEditor({ tagId }: { tagId: string }) {
  const { state, dispatch, toast } = useApp()
  const config = state.config
  const tag = config.deluxetags[tagId]
  const [renameValue, setRenameValue] = useState(tagId)
  if (!tag) return null

  const base = `config.deluxetags.${tagId}`
  const setPath = (key: string, value: unknown) => dispatch({ type: 'set-path', path: `${base}.${key}`, value })
  const cats = categoryIds(config, false)
  const descVal = Array.isArray(tag.description) ? tag.description.join('\n') : String(tag.description ?? '')
  const candidates = iconCandidates(tag.item || 'NAME_TAG', state.preview.iconTemplate)
  const unlocked = state.preview.unlockedTags[tagId] !== false

  function setUnlocked(value: boolean) {
    dispatch({ type: 'set-path', path: `preview.unlockedTags.${tagId}`, value })
    if (!value && state.preview.permissionMode !== 'custom') {
      dispatch({ type: 'set-path', path: 'preview.permissionMode', value: 'custom' })
    }
  }

  function handleDelete() {
    if (tagIds(config).length <= 1) {
      toast('Cannot delete the last tag.', true)
      return
    }
    dispatch({ type: 'delete-tag', id: tagId })
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
          <strong>
            <McText raw={tag.tag || tagId} config={config} />
          </strong>
          <small>{tagId}</small>
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
        <div className="tag-banner">
          <div className="tag-banner-preview">
            <McText raw={tag.tag || '&7[&fTag&7]'} config={config} />
          </div>
          <div className="tag-banner-icon">
            <MaterialIcon material={tag.item} candidates={candidates} imgClass="item-icon" fallbackClass="item-fallback-sm" />
          </div>
        </div>

        <EditorField label="Tag Text" value={tag.tag} config={config} placeholder="&7[&eVIP&7]" onChange={(raw) => setPath('tag', raw)} />
        <EditorField
          label="Display Name"
          value={tag.displayname}
          config={config}
          placeholder="&6Tag: %deluxetags_identifier%"
          onChange={(raw) => setPath('displayname', raw)}
        />
        <EditorField
          label="Description"
          value={descVal}
          config={config}
          multiline
          rows={3}
          onChange={(raw) => setPath('description', raw.split('\n'))}
        />

        <PlaceholderPalette />

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
              Unlocked in preview
              <small>Lock to preview how this tag looks for players without permission.</small>
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
          <select value={tag.category} onChange={(e) => setPath('category', e.target.value)}>
            {cats.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
            {cats.includes(tag.category) ? null : <option value={tag.category}>{tag.category}</option>}
          </select>
        </div>

        <AdvancedFields item={tag as unknown as Record<string, unknown>} setPath={setPath} />

        <div className="ctx-section">
          <span className="ctx-section-label">Rename ID</span>
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
