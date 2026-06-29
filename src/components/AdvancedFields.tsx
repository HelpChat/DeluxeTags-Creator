interface AdvancedFieldsProps {
  item: Record<string, unknown>
  /** Sets a key relative to the item base path, e.g. setPath('item_model', value). */
  setPath(key: string, value: unknown): void
}

const COMPONENT_KEYS = ['colors', 'flags', 'floats', 'strings'] as const

function componentLines(item: Record<string, unknown>, key: string): string {
  const component = item.model_data_component as Record<string, unknown> | undefined
  const lines = component?.[key]
  return Array.isArray(lines) ? lines.join('\n') : ''
}

/**
 * Resource-pack item fields (item_model, model_data, model_data_component). The core round-trips
 * these for tags, categories, and GUI items, but the original UI never exposed them (Phase 6).
 */
export function AdvancedFields({ item, setPath }: AdvancedFieldsProps) {
  const modelData = item.model_data
  return (
    <details className="ctx-section">
      <summary className="ctx-section-label" style={{ cursor: 'pointer' }}>
        Advanced (resource pack)
      </summary>
      <div className="field" style={{ marginTop: 8 }}>
        <span>Item model</span>
        <input
          type="text"
          value={item.item_model == null ? '' : String(item.item_model)}
          placeholder="e.g. namespace:custom_item"
          onChange={(e) => setPath('item_model', e.target.value)}
        />
      </div>
      <div className="field">
        <span>Custom model data</span>
        <input
          type="number"
          value={modelData == null || modelData === '' ? '' : String(modelData)}
          placeholder="e.g. 1001"
          onChange={(e) => setPath('model_data', e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))}
        />
      </div>
      {COMPONENT_KEYS.map((key) => (
        <div className="field" key={key}>
          <span>
            Component {key} <small style={{ color: '#666' }}>(one per line)</small>
          </span>
          <textarea
            rows={2}
            spellCheck={false}
            value={componentLines(item, key)}
            onChange={(e) =>
              setPath(`model_data_component.${key}`, e.target.value === '' ? [] : e.target.value.split('\n'))
            }
          />
        </div>
      ))}
    </details>
  )
}
