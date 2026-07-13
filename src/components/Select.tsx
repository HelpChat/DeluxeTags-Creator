import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange(value: string): void
  /** Text shown when no option matches the value (e.g. an action menu like "Move to..."). */
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  /** Extra class on the wrapper so callers can size/skin the trigger. */
  className?: string
  /** Which edge the menu aligns to. Defaults to the left. */
  align?: 'left' | 'right'
  /** Open the menu upward (for triggers near the bottom of the viewport). */
  dropUp?: boolean
}

/**
 * A custom dropdown that replaces the native <select>, so the trigger and the option list are fully
 * styled (the native control could not be sized or vertically centred with the pixel font). Closes
 * on an outside click or Escape.
 */
export function Select({ value, options, onChange, placeholder, ariaLabel, disabled, className, align = 'left', dropUp }: SelectProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

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

  return (
    <div className={`custom-select${className ? ` ${className}` : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`custom-select-value${current ? '' : ' placeholder'}`}>{current ? current.label : placeholder}</span>
        <svg className="custom-select-caret" viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <ul
          className={`custom-select-menu${align === 'right' ? ' align-right' : ''}${dropUp ? ' drop-up' : ''}`}
          role="listbox"
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`custom-select-option${o.value === value ? ' selected' : ''}`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
