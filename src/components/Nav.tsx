import { dumpConfigYaml } from '../core'
import { useApp } from '../state/store'

export function Nav() {
  const { state, dispatch, toast, canUndo, canRedo } = useApp()

  function downloadYaml() {
    const yaml = dumpConfigYaml(state.config, 'full')
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'config.yml'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(a.href)
    a.remove()
    toast('config.yml downloaded.')
  }

  return (
    <nav id="app-nav">
      <div className="nav-left">
        <a className="nav-logo-link" href="./index.html" aria-label="DeluxeTags builder">
          <img className="nav-logo-img" src="/nav-logo.png" alt="DeluxeTags" />
        </a>
        <span className="nav-pipe">/</span>
        <p id="paste-time">Config Builder</p>
      </div>
      <div className="nav-right">
        <div className="preview-mode" title="Show placeholder values, or the literal %placeholder% text">
          <button
            type="button"
            className={state.preview.parsePlaceholders !== false ? 'active' : ''}
            onClick={() => dispatch({ type: 'set-path', path: 'preview.parsePlaceholders', value: true })}
          >
            Parsed
          </button>
          <button
            type="button"
            className={state.preview.parsePlaceholders === false ? 'active' : ''}
            onClick={() => dispatch({ type: 'set-path', path: 'preview.parsePlaceholders', value: false })}
          >
            Raw
          </button>
        </div>
        <span className="nav-pipe">/</span>
        <button
          className={`function${canUndo ? ' enabled' : ''}`}
          id="nav-undo-btn"
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => dispatch({ type: 'undo' })}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4L2.5 7.5 6 11" />
            <path d="M2.5 7.5H10a3.5 3.5 0 010 7H7" />
          </svg>
        </button>
        <button
          className={`function${canRedo ? ' enabled' : ''}`}
          id="nav-redo-btn"
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => dispatch({ type: 'redo' })}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4l3.5 3.5L10 11" />
            <path d="M13.5 7.5H6a3.5 3.5 0 000 7h3" />
          </svg>
        </button>
        <span className="nav-pipe">/</span>
        <button
          className="function enabled"
          id="nav-import-btn"
          title="Import config.yml"
          aria-label="Import YAML"
          onClick={() => dispatch({ type: 'open-modal', modal: 'import' })}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 10V2M5 5l3-3 3 3" />
            <path d="M3 11v2h10v-2" />
          </svg>
        </button>
        <button
          className="function enabled"
          id="nav-download-btn"
          title="Download config.yml"
          aria-label="Download YAML"
          onClick={downloadYaml}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8M5 7l3 3 3-3" />
            <path d="M3 13h10" />
          </svg>
        </button>
        <button
          className="function enabled"
          id="nav-settings-btn"
          title="Settings"
          aria-label="Settings"
          onClick={() => dispatch({ type: 'open-modal', modal: 'settings' })}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.19 2.54c-.3-1.25-2.08-1.25-2.38 0a1.226 1.226 0 01-1.829.758c-1.097-.668-2.353.587-1.685 1.684a1.226 1.226 0 01-.757 1.83c-1.25.303-1.25 2.08 0 2.382a1.226 1.226 0 01.757 1.83c-.668 1.097.588 2.352 1.685 1.684a1.226 1.226 0 011.829.757c.303 1.25 2.08 1.25 2.38 0a1.227 1.227 0 011.83-.757c1.096.668 2.352-.587 1.684-1.685a1.227 1.227 0 01.758-1.829c1.25-.302 1.25-2.08 0-2.382a1.226 1.226 0 01-.758-1.83c.668-1.096-.588-2.352-1.685-1.684a1.226 1.226 0 01-1.83-.757z M8 10.4a2.4 2.4 0 100-4.8 2.4 2.4 0 000 4.8z"
            />
          </svg>
        </button>
      </div>
    </nav>
  )
}
