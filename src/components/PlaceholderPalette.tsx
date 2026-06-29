import { useApp } from '../state/store'

const PLACEHOLDERS: Array<{ label: string; value: string }> = [
  { label: 'Tag', value: '%deluxetags_tag%' },
  { label: 'Identifier', value: '%deluxetags_identifier%' },
  { label: 'Description', value: '%deluxetags_description%' },
  { label: 'Amount', value: '%deluxetags_amount%' },
  { label: 'Category amount', value: '%deluxetags_category_amount%' },
  { label: 'Available', value: '%deluxetags_available%' },
  { label: 'Player', value: '%player%' },
  { label: 'Display name', value: '%displayname%' },
  { label: 'Next page', value: '%next_page%' },
  { label: 'Prev page', value: '%previous_page%' },
  { label: 'Current page', value: '%current_page%' },
]

/**
 * A palette of DeluxeTags placeholders. Clicking a chip inserts it into the focused styled editor,
 * or copies it to the clipboard when no editor is focused.
 */
export function PlaceholderPalette() {
  const { activeEditor, toast } = useApp()

  function use(value: string) {
    if (activeEditor.current) {
      activeEditor.current.insertText(value)
    } else {
      navigator.clipboard?.writeText(value).catch(() => {})
      toast(`Copied ${value}`)
    }
  }

  return (
    <details className="ctx-section placeholder-palette" open>
      <summary className="ctx-section-label" style={{ cursor: 'pointer' }}>
        Placeholders (click to insert)
      </summary>
      <div className="placeholder-chips">
        {PLACEHOLDERS.map((p) => (
          <button
            key={p.value}
            type="button"
            className="placeholder-chip"
            title={p.value}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => use(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </details>
  )
}
