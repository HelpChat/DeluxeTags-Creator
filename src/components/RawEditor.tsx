import { useRef } from 'react'
import { useApp, type ActiveEditor } from '../state/store'

interface RawEditorProps {
  value: string
  onChange(raw: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
}

/**
 * A plain text box for editing the literal source. It registers itself as the active editor so the
 * MiniMessage toolbar (format buttons, hex, gradient, placeholders) works here too, inserting the
 * raw tags/codes at the caret instead of acting on the visual editor.
 */
export function RawEditor({ value, onChange, multiline, rows, placeholder }: RawEditorProps) {
  const { activeEditor } = useApp()
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  function setCaret(pos: number) {
    const el = ref.current
    if (!el) return
    const apply = () => {
      try {
        el.focus()
        el.selectionStart = el.selectionEnd = pos
      } catch {
        // selection APIs can throw on detached nodes; ignore.
      }
    }
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply)
    else apply()
  }

  function register() {
    const handle: ActiveEditor = {
      insertText(text) {
        const el = ref.current
        if (!el) return
        const raw = valueRef.current
        const start = el.selectionStart ?? raw.length
        const end = el.selectionEnd ?? start
        onChange(raw.slice(0, start) + text + raw.slice(end))
        setCaret(start + text.length)
      },
      applyWrapper(opening, closing, fallbackText = 'Text') {
        const el = ref.current
        if (!el) return
        const raw = valueRef.current
        const start = el.selectionStart ?? raw.length
        const end = el.selectionEnd ?? start
        const body = end > start ? raw.slice(start, end) : fallbackText
        const insert = opening + body + closing
        onChange(raw.slice(0, start) + insert + raw.slice(end))
        setCaret(start + insert.length)
      },
    }
    activeEditor.current = handle
  }

  const setRef = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    ref.current = el
  }

  if (multiline) {
    return (
      <textarea
        ref={setRef}
        className="raw-editor"
        value={value}
        rows={rows ?? 3}
        spellCheck={false}
        placeholder={placeholder}
        onFocus={register}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <input
      ref={setRef}
      type="text"
      className="raw-editor"
      value={value}
      spellCheck={false}
      placeholder={placeholder}
      onFocus={register}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
