import { useRef, useState } from 'react'
import { useApp } from '../state/store'

interface FormatButton {
  node: JSX.Element
  mm: string
  legacy: string
}

const FORMATS: FormatButton[] = [
  { node: <b>B</b>, mm: 'bold', legacy: '&l' },
  { node: <i>I</i>, mm: 'italic', legacy: '&o' },
  { node: <u>U</u>, mm: 'underlined', legacy: '&n' },
  { node: <s>S</s>, mm: 'strikethrough', legacy: '&m' },
]

/** Keep the editor selection when a helper control is pressed instead of stealing focus. */
function keepSelection(event: React.MouseEvent) {
  event.preventDefault()
}

export function ColorHelper() {
  const { state, activeEditor } = useApp()
  const hexRef = useRef<HTMLInputElement>(null)
  const [gradientOpen, setGradientOpen] = useState(false)
  const gradientStart = useRef<HTMLInputElement>(null)
  const gradientEnd = useRef<HTMLInputElement>(null)
  const useMini = state.config.use_minimessage

  function applyFormat(format: FormatButton) {
    if (useMini) activeEditor.current?.applyWrapper(`<${format.mm}>`, `</${format.mm}>`)
    else activeEditor.current?.insertText(format.legacy)
  }

  function applyHex(value: string) {
    activeEditor.current?.applyWrapper(`<color:${value.toLowerCase()}>`, '</color>')
  }

  function applyGradient() {
    const start = (gradientStart.current?.value || '#55ffff').toLowerCase()
    const end = (gradientEnd.current?.value || '#ff55ff').toLowerCase()
    activeEditor.current?.applyWrapper(`<gradient:${start}:${end}>`, '</gradient>')
    setGradientOpen(false)
  }

  return (
    <div className="mm-helper">
      <div className="mm-helper-label">MiniMessage</div>
      <div className="mm-format-row">
        <button
          type="button"
          className="mm-fmt-btn"
          onMouseDown={keepSelection}
          onClick={() => hexRef.current?.click()}
        >
          Hex
        </button>
        <input
          ref={hexRef}
          type="color"
          className="mm-hex-input"
          defaultValue="#55ffff"
          onChange={(e) => applyHex(e.target.value)}
        />
        <button
          type="button"
          className="mm-fmt-btn"
          title="gradient"
          onMouseDown={keepSelection}
          onClick={() => setGradientOpen((open) => !open)}
        >
          Gradient
        </button>
        {FORMATS.map((format) => (
          <button
            key={format.mm}
            type="button"
            className="mm-fmt-btn"
            title={format.mm}
            onMouseDown={keepSelection}
            onClick={() => applyFormat(format)}
          >
            {format.node}
          </button>
        ))}
      </div>
      <div className="mm-gradient-panel" hidden={!gradientOpen}>
        <input ref={gradientStart} type="color" defaultValue="#55ffff" />
        <input ref={gradientEnd} type="color" defaultValue="#ff55ff" />
        <button type="button" className="mm-fmt-btn" onMouseDown={keepSelection} onClick={applyGradient}>
          Apply
        </button>
      </div>
    </div>
  )
}
