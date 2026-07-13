import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/store'
import { PlaceholderPalette, type PlaceholderContext } from './PlaceholderPalette'

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

export function ColorHelper({ context = 'tag' }: { context?: PlaceholderContext }) {
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
    const hex = value.toLowerCase()
    // Legacy mode has no <color> tag; insert the &#RRGGBB code the plugin understands instead.
    if (useMini) activeEditor.current?.applyWrapper(`<color:${hex}>`, '</color>')
    else activeEditor.current?.insertText(`&${hex}`)
  }

  // Apply the colour once, on the native "change" event (fired when the picker closes), not on the
  // continuous "input" events React's onChange maps to. Applying on every drag re-ran the wrapper
  // after the selection had already collapsed, which spammed the fallback "Text" in each colour.
  const applyHexRef = useRef(applyHex)
  applyHexRef.current = applyHex
  useEffect(() => {
    const el = hexRef.current
    if (!el) return
    const handler = () => applyHexRef.current(el.value)
    el.addEventListener('change', handler)
    return () => el.removeEventListener('change', handler)
  }, [])

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
        <input ref={hexRef} type="color" className="mm-hex-input" defaultValue="#55ffff" />
        {useMini && (
          <button
            type="button"
            className="mm-fmt-btn"
            title="gradient"
            onMouseDown={keepSelection}
            onClick={() => setGradientOpen((open) => !open)}
          >
            Gradient
          </button>
        )}
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
        <PlaceholderPalette context={context} />
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
