import type { ReactNode } from 'react'
import { useApp } from '../state/store'

const GRID_ICON = (
  <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="4" height="4" rx=".5" />
    <rect x="6.5" y="1.5" width="4" height="4" rx=".5" />
    <rect x="11.5" y="1.5" width="3" height="4" rx=".5" />
    <rect x="1.5" y="7" width="4" height="4" rx=".5" />
    <rect x="6.5" y="7" width="4" height="4" rx=".5" />
    <rect x="11.5" y="7" width="3" height="4" rx=".5" />
  </svg>
)

function ActionButton({ icon, label, primary, onClick }: { icon: ReactNode; label: string; primary?: boolean; onClick(): void }) {
  return (
    <button type="button" className={`slot-action-btn${primary ? ' primary-action' : ''}`} onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  )
}

export function EmptySlotActions({ slot }: { slot: number }) {
  const { dispatch } = useApp()
  const setStatic = (key: string) => dispatch({ type: 'set-static-at-slot', key, slot })

  return (
    <>
      <div className="ctx-header">
        <div className="ctx-header-icon">{GRID_ICON}</div>
        <div className="ctx-header-text">
          <strong>Slot {slot}</strong>
          <small>Empty, choose what to add</small>
        </div>
      </div>
      <div className="ctx-slot-label">What goes here?</div>
      <div className="slot-action-grid">
        <ActionButton
          primary
          label="Add a Tag"
          onClick={() => dispatch({ type: 'add-tag-at-slot', slot })}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10.5" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
              <path d="M1.5 9 6 4H13.5v8L8 15.5a.75.75 0 01-1 0z" />
            </svg>
          }
        />
        <ActionButton
          label="Category"
          onClick={() => dispatch({ type: 'add-category-at-slot', slot })}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
              <path d="M1.5 13.5V4.5h5.5l1.5-2H14.5v11z" />
            </svg>
          }
        />
        <ActionButton
          label="Divider"
          onClick={() => setStatic('divider_item')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 8h10" />
            </svg>
          }
        />
        <ActionButton
          label="Exit"
          onClick={() => setStatic('exit_item')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14V2h8v12" />
              <path d="M1.5 14h13" />
              <circle cx="10.5" cy="8.5" r=".7" fill="currentColor" stroke="none" />
            </svg>
          }
        />
        <ActionButton
          label="Back"
          onClick={() => setStatic('category_back_item')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 3.5L5.5 8l5 4.5" />
            </svg>
          }
        />
        <ActionButton
          label="Next Page"
          onClick={() => setStatic('next_page')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 3.5L10.5 8l-5 4.5" />
            </svg>
          }
        />
        <ActionButton
          label="Prev Page"
          onClick={() => setStatic('previous_page')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 3.5L5.5 8l5 4.5" />
            </svg>
          }
        />
        <ActionButton
          label="Current Tag"
          onClick={() => setStatic('has_tag_item')}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 8.5l4 4 7-7" />
            </svg>
          }
        />
        <ActionButton
          label="Generate"
          onClick={() => dispatch({ type: 'open-modal', modal: 'generator' })}
          icon={
            <svg className="ctx-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2l1.2 2.8L13 6l-2.8 1.2L9 10 7.8 7.2 5 6l2.8-1.2z" />
              <path d="M3.5 10.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6L1.2 12.8l1.6-.7z" />
            </svg>
          }
        />
      </div>
    </>
  )
}
