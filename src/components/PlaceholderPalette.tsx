import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/store'

/** Where the palette is shown, so page placeholders only appear where they make sense. */
export type PlaceholderContext = 'tag' | 'category' | 'static'

const PLACEHOLDERS: Array<{ label: string; value: string; page?: boolean }> = [
  { label: 'Tag', value: '%deluxetags_tag%' },
  { label: 'Identifier', value: '%deluxetags_identifier%' },
  { label: 'Description', value: '%deluxetags_description%' },
  { label: 'Amount', value: '%deluxetags_amount%' },
  { label: 'Category amount', value: '%deluxetags_category_amount%' },
  { label: 'Available', value: '%deluxetags_available%' },
  { label: 'Player', value: '%player%' },
  { label: 'Display name', value: '%displayname%' },
  // Page placeholders only resolve on the GUI page-navigation items, not on tags or categories.
  { label: 'Next page', value: '%next_page%', page: true },
  { label: 'Prev page', value: '%previous_page%', page: true },
  { label: 'Current page', value: '%current_page%', page: true },
]

/**
 * A compact placeholder inserter that lives in a field's MiniMessage toolbar, alongside the format
 * buttons. The icon button opens a popover of DeluxeTags placeholders; clicking a chip inserts it
 * into the focused editor, or copies it when no editor is focused. Page placeholders are hidden
 * unless the field belongs to a static GUI item, since they do not resolve on tag or category text.
 */
export function PlaceholderPalette({ context = 'tag' }: { context?: PlaceholderContext }) {
  const { activeEditor, toast } = useApp()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const placeholders = context === 'static' ? PLACEHOLDERS : PLACEHOLDERS.filter((p) => !p.page)

  // Close the popover on an outside click or Escape.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function use(value: string) {
    if (activeEditor.current) {
      activeEditor.current.insertText(value)
    } else {
      navigator.clipboard?.writeText(value).catch(() => {})
      toast(`Copied ${value}`)
    }
    setOpen(false)
  }

  return (
    <div className="placeholder-menu" ref={wrapRef}>
      <button
        type="button"
        className="mm-fmt-btn placeholder-fmt-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Insert a placeholder"
        // Keep the editor focused so the inserted placeholder lands at the caret.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
          <path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z" />
        </svg>
      </button>
      {open && (
        <div className="placeholder-popover" role="menu">
          <div className="placeholder-chips">
            {placeholders.map((p) => (
              <button
                key={p.value}
                type="button"
                className="placeholder-chip"
                title={p.value}
                role="menuitem"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => use(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
