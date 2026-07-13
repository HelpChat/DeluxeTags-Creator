import { useState } from 'react'
import type { Config } from '../core'
import { ColorHelper } from './ColorHelper'
import type { PlaceholderContext } from './PlaceholderPalette'
import { RawEditor } from './RawEditor'
import { StyledEditor } from './StyledEditor'

interface EditorFieldProps {
  label: string
  value: string
  config: Config
  onChange(raw: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
  /** Which editor this field belongs to, so its placeholder button hides page-only placeholders. */
  context?: PlaceholderContext
}

/**
 * A labelled styled-text section. By default it shows the rendered (parsed) text in the visual
 * editor with its MiniMessage helper. The Raw toggle swaps in a plain text box that shows the
 * literal source (MiniMessage tags, legacy codes, and placeholders) for direct editing.
 */
export function EditorField({ label, value, config, onChange, multiline, rows, placeholder, context }: EditorFieldProps) {
  const [raw, setRaw] = useState(false)
  return (
    <div className="ctx-section">
      <div className="ctx-field-head">
        <span className="ctx-section-label">{label}</span>
        <button
          type="button"
          className={`field-raw-toggle${raw ? ' active' : ''}`}
          title={raw ? 'Show the rendered text' : 'Show the raw source (MiniMessage tags and codes)'}
          onClick={() => setRaw((r) => !r)}
        >
          {raw ? 'Parsed' : 'Raw'}
        </button>
      </div>
      {raw ? (
        <RawEditor value={value} onChange={onChange} multiline={multiline} rows={rows} placeholder={placeholder} />
      ) : (
        <StyledEditor
          value={value}
          config={config}
          onChange={onChange}
          multiline={multiline}
          rows={rows}
          placeholder={placeholder}
        />
      )}
      <ColorHelper context={context} />
    </div>
  )
}
