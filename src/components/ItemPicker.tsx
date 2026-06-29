import { useState } from 'react'
import { iconCandidates } from '../core'
import { MaterialIcon } from './MaterialIcon'
import { PICKER_MATERIALS } from './materials'

interface ItemPickerProps {
  value: string
  iconTemplate: string
  onPick(material: string): void
}

export function ItemPicker({ value, iconTemplate, onPick }: ItemPickerProps) {
  const [query, setQuery] = useState('')
  const current = (value || '').toUpperCase()
  const needle = query.trim().toLowerCase()

  return (
    <div className="item-picker-wrap">
      <div className="item-picker-custom">
        <input
          type="text"
          className="item-picker-custom-input"
          value={current}
          placeholder="Custom material, e.g. OAK_SIGN"
          onChange={(e) => onPick(e.target.value)}
        />
      </div>
      <input
        type="text"
        className="item-picker-search"
        placeholder="Filter materials…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="item-picker-grid">
        {PICKER_MATERIALS.map((material) => {
          const hidden = needle.length > 0 && !material.toLowerCase().includes(needle)
          return (
            <button
              key={material}
              type="button"
              className={`item-picker-btn${material === current ? ' selected' : ''}${hidden ? ' hidden' : ''}`}
              title={material}
              onClick={() => onPick(material)}
            >
              <MaterialIcon
                material={material}
                candidates={iconCandidates(material, iconTemplate)}
                imgClass="ip-img"
                fallbackClass="ip-fallback"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
