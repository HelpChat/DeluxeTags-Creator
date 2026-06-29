import { useState } from 'react'
import { parseConfigYaml } from '../core'
import { useApp } from '../state/store'

export function ImportModal() {
  const { state, dispatch, toast } = useApp()
  const [text, setText] = useState(state.yamlDraft || '')

  function handleImport() {
    try {
      const config = parseConfigYaml(text)
      dispatch({ type: 'import', config, yamlDraft: text })
      dispatch({ type: 'close-modal' })
      toast('Config imported.')
    } catch (error) {
      toast(`Import failed: ${(error as Error).message}`, true)
    }
  }

  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2>Import config.yml</h2>
        <button type="button" className="modal-close-btn" aria-label="Close dialog" onClick={() => dispatch({ type: 'close-modal' })}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="modal-body">
        <p style={{ color: '#888', fontSize: 12, margin: '0 0 10px' }}>
          Paste your existing config.yml here. Older DeluxeTags formats are supported.
        </p>
        <textarea
          id="yaml-import-area"
          rows={14}
          spellCheck={false}
          placeholder="Paste config.yml here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'close-modal' })}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={handleImport}>
          Import
        </button>
      </div>
    </div>
  )
}
