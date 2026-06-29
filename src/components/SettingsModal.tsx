import { useState } from 'react'
import { useApp } from '../state/store'
import { tagIds } from '../state/operations'
import { McText } from './McText'

const MC_VERSIONS = ['1.21.4', '1.21', '1.20.4', '1.19.4', '1.18.2', '1.17.1', '1.16.5']

function templateVersion(template: string): string {
  const match = /minecraft-assets\/([^/]+)\//.exec(template)
  return match ? match[1] : MC_VERSIONS[0]
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange(value: boolean): void }) {
  return (
    <div className="settings-toggle-row">
      <label className="settings-toggle-label" htmlFor={id}>
        {label}
        {hint ? <small>{hint}</small> : null}
      </label>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  )
}

export function SettingsModal() {
  const { state, dispatch } = useApp()
  const config = state.config
  const preview = state.preview
  const setPath = (path: string, value: unknown) => dispatch({ type: 'set-path', path, value })
  const placeholder = config.gui.tag_availability_placeholder
  const lockedItem = config.gui.tag_visible_item
  const [tagSlotsText, setTagSlotsText] = useState(
    Array.isArray(config.gui.tag_slots) ? config.gui.tag_slots.join(', ') : String(config.gui.tag_slots ?? ''),
  )

  function setTagSlots(value: string) {
    setTagSlotsText(value)
    setPath('config.gui.tag_slots', value.split(/[\s,]+/).filter(Boolean))
  }

  function setVersion(version: string) {
    const template = preview.iconTemplate.includes('minecraft-assets/')
      ? preview.iconTemplate.replace(/minecraft-assets\/[^/]+\//, `minecraft-assets/${version}/`)
      : preview.iconTemplate
    setPath('preview.iconTemplate', template)
  }
  const chatSample = String(config.format_chat.format)
    .replace('%1$s', preview.playerName || 'Steve')
    .replace('%2$s', 'Hello there!')

  return (
    <div className="modal-card wide">
      <div className="modal-header">
        <h2>Settings</h2>
        <button type="button" className="modal-close-btn" aria-label="Close dialog" onClick={() => dispatch({ type: 'close-modal' })}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="modal-body">
        <div className="settings-group">
          <div className="settings-group-label">Text Formatting</div>
          <Toggle
            id="s-mm"
            label="Use MiniMessage"
            hint="Use <red>, <bold> tags instead of &c, &l codes."
            checked={config.use_minimessage}
            onChange={(value) => dispatch({ type: 'toggle-minimessage', value })}
          />
          <Toggle
            id="s-hex"
            label="Legacy hex colors"
            hint="Use &#RRGGBB instead of #RRGGBB for hex colors."
            checked={config.legacy_hex}
            onChange={(value) => setPath('config.legacy_hex', value)}
          />
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Plugin Behaviour</div>
          <Toggle id="s-ft" label="Force tags" hint="Require players to always have a tag selected." checked={config.force_tags} onChange={(v) => setPath('config.force_tags', v)} />
          <Toggle id="s-ltj" label="Load tag on join" hint="Restore a player's last tag when they join." checked={config.load_tag_on_join} onChange={(v) => setPath('config.load_tag_on_join', v)} />
          <Toggle id="s-cu" label="Check for updates" hint="Notify admins when a new version is released." checked={config.check_updates} onChange={(v) => setPath('config.check_updates', v)} />
          <Toggle id="s-pc" label="PAPI chat support" hint="Parse PlaceholderAPI tags in chat messages." checked={config.papi_chat} onChange={(v) => setPath('config.papi_chat', v)} />
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Chat Format</div>
          <Toggle id="s-fce" label="Enable chat format" checked={config.format_chat.enabled} onChange={(v) => setPath('config.format_chat.enabled', v)} />
          <div className="field" style={{ marginTop: 8 }}>
            <span>Format string</span>
            <input
              type="text"
              value={config.format_chat.format}
              placeholder="%deluxetags_tag% %1$s: %2$s"
              onChange={(e) => setPath('config.format_chat.format', e.target.value)}
            />
            <small>%1$s = player name, %2$s = message.</small>
          </div>
          <div className="chat-preview" style={{ fontFamily: 'PixelCraft', fontSize: 18 }}>
            <McText raw={chatSample} config={config} />
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Inventory</div>
          <div className="field">
            <span>Menu size</span>
            <select value={config.gui.size} onChange={(e) => setPath('config.gui.size', Number.parseInt(e.target.value, 10))}>
              {[9, 18, 27, 36, 45, 54].map((s) => (
                <option key={s} value={s}>
                  {s} slots
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span>Menu title</span>
            <input type="text" value={config.gui.name} placeholder="Tags Menu" onChange={(e) => setPath('config.gui.name', e.target.value)} />
          </div>
          <div className="field">
            <span>Tag slots</span>
            <input type="text" value={tagSlotsText} placeholder="e.g. 0-35" onChange={(e) => setTagSlots(e.target.value)} />
            <small>Slots where tags and categories are placed. Numbers or ranges like 0-35.</small>
          </div>
          <div className="form-grid two">
            <div className="field">
              <span>Unlocked text</span>
              <input
                type="text"
                value={placeholder.has_permission}
                onChange={(e) => setPath('config.gui.tag_availability_placeholder.has_permission', e.target.value)}
              />
            </div>
            <div className="field">
              <span>Locked text</span>
              <input
                type="text"
                value={placeholder.no_permission}
                onChange={(e) => setPath('config.gui.tag_availability_placeholder.no_permission', e.target.value)}
              />
            </div>
            <div className="field">
              <span>Locked tag item</span>
              <input
                type="text"
                value={String(lockedItem.material ?? '')}
                placeholder="BARRIER"
                onChange={(e) => setPath('config.gui.tag_visible_item.material', e.target.value)}
              />
            </div>
            <div className="field">
              <span>Locked tag data</span>
              <input
                type="number"
                value={lockedItem.data === '' || lockedItem.data == null ? '' : String(lockedItem.data)}
                placeholder="0"
                onChange={(e) => setPath('config.gui.tag_visible_item.data', e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-label">Preview</div>
          <div className="form-grid two">
            <div className="field">
              <span>Player name</span>
              <input type="text" value={preview.playerName || ''} placeholder="Steve" onChange={(e) => setPath('preview.playerName', e.target.value)} />
            </div>
            <div className="field">
              <span>Active tag</span>
              <select value={preview.activeTagId} onChange={(e) => setPath('preview.activeTagId', e.target.value)}>
                <option value="">None</option>
                {tagIds(config).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Screen</span>
              <select value={preview.screen} onChange={(e) => setPath('preview.screen', e.target.value)}>
                <option value="auto">Auto</option>
                <option value="categories">Categories</option>
                <option value="tags">Tags</option>
              </select>
            </div>
            <div className="field">
              <span>Permissions</span>
              <select value={preview.permissionMode} onChange={(e) => setPath('preview.permissionMode', e.target.value)}>
                <option value="all">All unlocked</option>
                <option value="none">All locked</option>
                <option value="custom">Custom (per tag)</option>
              </select>
            </div>
            <div className="field">
              <span>Display name</span>
              <input type="text" value={preview.displayName || ''} placeholder="Steve" onChange={(e) => setPath('preview.displayName', e.target.value)} />
            </div>
            <div className="field">
              <span>Minecraft version (textures)</span>
              <select value={templateVersion(preview.iconTemplate)} onChange={(e) => setVersion(e.target.value)}>
                {MC_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Toggle
            id="s-slt"
            label="Show locked tags"
            hint="Show tags the player cannot select in the preview."
            checked={preview.showLockedTags}
            onChange={(v) => setPath('preview.showLockedTags', v)}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'close-modal' })}>
          Close
        </button>
      </div>
    </div>
  )
}
