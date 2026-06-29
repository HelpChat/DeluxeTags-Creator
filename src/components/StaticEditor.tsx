import { useState, type ReactNode } from 'react'
import { useApp } from '../state/store'
import { AdvancedFields } from './AdvancedFields'
import { EditorField } from './EditorField'
import { ItemPicker } from './ItemPicker'
import { PlaceholderPalette } from './PlaceholderPalette'

interface StaticLabel {
  label: string
  icon: ReactNode
}

const STATIC_LABELS: Record<string, StaticLabel> = {
  divider_item: {
    label: 'Divider',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 8h10" />
      </svg>
    ),
  },
  has_tag_item: {
    label: 'Current Tag',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 8.5l4 4 7-7" />
      </svg>
    ),
  },
  no_tag_item: {
    label: 'No Tag',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
        <path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z" />
        <path d="M4 4l8 8" strokeWidth="1.8" />
      </svg>
    ),
  },
  exit_item: {
    label: 'Exit Button',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14V2h8v12" />
        <path d="M1.5 14h13" />
        <circle cx="10.5" cy="8.5" r=".7" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  category_back_item: {
    label: 'Category Back',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 3.5L5.5 8l5 4.5" />
      </svg>
    ),
  },
  next_page: {
    label: 'Next Page',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 3.5L10.5 8l-5 4.5" />
      </svg>
    ),
  },
  previous_page: {
    label: 'Previous Page',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 3.5L5.5 8l5 4.5" />
      </svg>
    ),
  },
  tag_visible_item: {
    label: 'Locked Tag',
    icon: (
      <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <rect x="2.5" y="7" width="11" height="7.5" rx="1.5" />
        <path d="M5 7V5.5a3 3 0 016 0V7" />
      </svg>
    ),
  },
}

export function StaticEditor({ itemKey }: { itemKey: string }) {
  const { state, dispatch } = useApp()
  const config = state.config
  const item = config.gui[itemKey] as Record<string, unknown> | undefined
  const slotsInitial = Array.isArray(item?.slots) ? (item?.slots as string[]).join(', ') : String(item?.slots ?? '')
  const [slotsText, setSlotsText] = useState(slotsInitial)
  if (!item) return null

  const isVisible = itemKey === 'tag_visible_item'
  const info = STATIC_LABELS[itemKey] ?? { label: itemKey, icon: null }
  const base = `config.gui.${itemKey}`
  const setPath = (key: string, value: unknown) => dispatch({ type: 'set-path', path: `${base}.${key}`, value })
  const displayname = String(item.displayname ?? '')
  const loreVal = Array.isArray(item.lore) ? (item.lore as string[]).join('\n') : String(item.lore ?? '')

  function handleSlots(value: string) {
    setSlotsText(value)
    setPath('slots', value.split(/[\s,]+/).filter(Boolean))
  }

  return (
    <>
      <div className="ctx-header">
        <div className="ctx-header-icon">{info.icon}</div>
        <div className="ctx-header-text">
          <strong>{info.label}</strong>
          <small>{itemKey}</small>
        </div>
      </div>

      <div className="ctx-body">
        <div className="ctx-section">
          <span className="ctx-section-label">Item</span>
          <ItemPicker value={String(item.material ?? '')} iconTemplate={state.preview.iconTemplate} onPick={(material) => setPath('material', material)} />
        </div>

        <div className="ctx-section">
          <span className="ctx-section-label">Data Value</span>
          <input
            type="number"
            value={item.data === '' || item.data == null ? '' : String(item.data)}
            placeholder="0"
            onChange={(e) => setPath('data', e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))}
          />
        </div>

        {isVisible ? null : (
          <>
            <EditorField label="Display Name" value={displayname} config={config} placeholder="Display name..." onChange={(raw) => setPath('displayname', raw)} />
            <EditorField label="Lore" value={loreVal} config={config} multiline rows={3} onChange={(raw) => setPath('lore', raw.split('\n'))} />
            <div className="ctx-section">
              <span className="ctx-section-label">Slots</span>
              <input type="text" value={slotsText} placeholder="e.g. 45, 47-53" onChange={(e) => handleSlots(e.target.value)} />
              <small style={{ color: '#555', fontSize: 11, display: 'block', marginTop: 4 }}>Use slot numbers or ranges like 36-44.</small>
            </div>
            <PlaceholderPalette />
          </>
        )}

        <AdvancedFields item={item} setPath={setPath} />
      </div>
    </>
  )
}
