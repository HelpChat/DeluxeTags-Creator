import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ConfirmOptions {
  title: string
  message: string
  /** Label for the confirming button (defaults to "Delete"). */
  confirmLabel?: string
  /** Style the confirm button as destructive (defaults to true). */
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingConfirm {
  options: ConfirmOptions
  resolve(result: boolean): void
}

/**
 * Provides an imperative confirm(): Promise<boolean> so any component (or the keyboard handler)
 * can await a yes/no before a destructive action. Renders a single modal that matches the app's
 * existing modal styling.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => setPending({ options, resolve }))
  }, [])

  function settle(result: boolean) {
    pending?.resolve(result)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <ConfirmDialog options={pending.options} onCancel={() => settle(false)} onConfirm={() => settle(true)} />}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const value = useContext(ConfirmContext)
  if (!value) throw new Error('useConfirm must be used within a ConfirmProvider')
  return value
}

function ConfirmDialog({ options, onCancel, onConfirm }: { options: ConfirmOptions; onCancel(): void; onConfirm(): void }) {
  const { title, message, confirmLabel = 'Delete', danger = true } = options

  // Escape cancels, Enter confirms.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, onConfirm])

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="modal-card" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close-btn" aria-label="Close dialog" onClick={onCancel}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: '#bbb', fontSize: 13, lineHeight: 1.5 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={danger ? 'primary danger' : 'primary'} autoFocus onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
