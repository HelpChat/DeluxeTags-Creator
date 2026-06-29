import { useState } from 'react'
import { useApp } from '../state/store'
import {
  STYLE_PRESETS,
  TAG_PACKS,
  applyStylePreset,
  gradientStyle,
  randomTag,
  type GeneratedTag,
} from '../generators'
import { McText } from './McText'

type Mode = 'styled' | 'packs' | 'random'

const PIXEL = { fontFamily: 'PixelCraft', fontSize: 16, lineHeight: 1.3 }

export function GeneratorModal() {
  const { state, dispatch, toast } = useApp()
  const config = state.config
  const [mode, setMode] = useState<Mode>('styled')
  const [text, setText] = useState('VIP')
  const [styleId, setStyleId] = useState('rainbow')
  const [useCustom, setUseCustom] = useState(false)
  const [from, setFrom] = useState('#ff5500')
  const [to, setTo] = useState('#ffdd00')
  const [rolled, setRolled] = useState<GeneratedTag[]>([])

  const sample = text || 'Tag'
  const styledOutput = useCustom ? gradientStyle(sample, from, to) : applyStylePreset(sample, styleId)

  function addTags(tags: GeneratedTag[]) {
    if (!tags.length) return
    dispatch({ type: 'add-generated-tags', tags })
    dispatch({ type: 'close-modal' })
    toast(tags.length > 1 ? `Added ${tags.length} tags.` : 'Tag added.')
  }

  return (
    <div className="modal-card wide">
      <div className="modal-header">
        <h2>Tag Generator</h2>
        <button type="button" className="modal-close-btn" aria-label="Close dialog" onClick={() => dispatch({ type: 'close-modal' })}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="modal-body">
        <div className="mm-format-row" style={{ marginBottom: 12 }}>
          {(['styled', 'packs', 'random'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`mm-fmt-btn${mode === m ? ' selected' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'styled' ? 'Styled text' : m === 'packs' ? 'Preset packs' : 'Random'}
            </button>
          ))}
        </div>

        {mode === 'styled' ? (
          <>
            <div className="field">
              <span>Text</span>
              <input className="gen-text" type="text" value={text} placeholder="VIP" onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="form-grid two">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`slot-action-btn${styleId === preset.id && !useCustom ? ' selected' : ''}`}
                  onClick={() => {
                    setStyleId(preset.id)
                    setUseCustom(false)
                  }}
                >
                  <span style={PIXEL}>
                    <McText raw={preset.apply(sample)} config={config} />
                  </span>
                  <span className="action-label">{preset.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`gen-custom-toggle${useCustom ? ' active' : ''}`}
              aria-pressed={useCustom}
              onClick={() => setUseCustom((v) => !v)}
            >
              Custom gradient
            </button>
            {useCustom ? (
              <div className="gradient-colors">
                <label className="swatch">
                  <span>From</span>
                  <input type="color" value={from} onChange={(e) => setFrom(e.target.value)} />
                  <code>{from}</code>
                </label>
                <label className="swatch">
                  <span>To</span>
                  <input type="color" value={to} onChange={(e) => setTo(e.target.value)} />
                  <code>{to}</code>
                </label>
              </div>
            ) : null}
            <div className="chat-preview gen-preview">
              <McText raw={styledOutput} config={config} />
            </div>
          </>
        ) : null}

        {mode === 'packs' ? (
          <>
            {TAG_PACKS.map((pack) => (
              <div className="pack-row" key={pack.id}>
                <div className="pack-info">
                  <div className="settings-group-label">{pack.label}</div>
                  <div className="pack-tags" style={PIXEL}>
                    {pack.tags.map((t, i) => (
                      <span key={i}>
                        <McText raw={t.tag} config={config} />
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" className="primary pack-add" onClick={() => addTags(pack.tags)}>
                  Add {pack.tags.length} tags
                </button>
              </div>
            ))}
          </>
        ) : null}

        {mode === 'random' ? (
          <>
            <button
              type="button"
              className="secondary"
              onClick={() => setRolled(Array.from({ length: 4 }, () => randomTag()))}
            >
              Generate options
            </button>
            <div className="form-grid two" style={{ marginTop: 10 }}>
              {rolled.map((t, i) => (
                <button key={i} type="button" className="slot-action-btn" onClick={() => addTags([t])}>
                  <span style={PIXEL}>
                    <McText raw={t.tag} config={config} />
                  </span>
                  <span className="action-label">Add</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'close-modal' })}>
          Close
        </button>
        {mode === 'styled' ? (
          <button type="button" className="primary" onClick={() => addTags([{ tag: styledOutput }])}>
            Create tag
          </button>
        ) : null}
      </div>
    </div>
  )
}
