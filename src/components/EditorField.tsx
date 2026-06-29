import type { Config } from '../core'
import { ColorHelper } from './ColorHelper'
import { StyledEditor } from './StyledEditor'

interface EditorFieldProps {
  label: string
  value: string
  config: Config
  onChange(raw: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
}

/** A labelled styled-text section: the contenteditable editor plus its MiniMessage helper. */
export function EditorField({ label, value, config, onChange, multiline, rows, placeholder }: EditorFieldProps) {
  return (
    <div className="ctx-section">
      <span className="ctx-section-label">{label}</span>
      <StyledEditor
        value={value}
        config={config}
        onChange={onChange}
        multiline={multiline}
        rows={rows}
        placeholder={placeholder}
      />
      <ColorHelper />
    </div>
  )
}
