import { iconCandidates, type Config, type PreviewItem } from '../core'
import { McText } from './McText'
import { MaterialIcon } from './MaterialIcon'

interface SlotProps {
  item: PreviewItem | null
  index: number
  inspected: boolean
  marked: boolean
  config: Config
  iconTemplate: string
  /** True while a drag is hovering this slot, to show where the item will land. */
  dropTarget?: boolean
  /** True while the grid is in static-item slot-picking mode. */
  picking?: boolean
  /** True when this slot is assigned to the static item being picked for. */
  assigned?: boolean
  onSelect(index: number, event: React.MouseEvent): void
  onDragStart(index: number): void
  onDragEnter(index: number): void
  onDrop(index: number): void
}

function ItemTooltip({ item, config }: { item: PreviewItem; config: Config }) {
  const lore = item.lore || []
  const showTag = item.tagText && item.tagText !== item.displayname && !lore.includes(item.tagText)
  return (
    <div className="item-tooltip">
      <strong>
        <McText raw={item.displayname || item.material} config={config} />
      </strong>
      {showTag ? (
        <span className="tooltip-tag">
          <McText raw={item.tagText} config={config} />
        </span>
      ) : null}
      {lore.map((line, i) => (
        <span key={i}>
          <McText raw={line} config={config} />
        </span>
      ))}
      <small>{item.material}</small>
    </div>
  )
}

export function Slot({ item, index, inspected, marked, config, iconTemplate, dropTarget, picking, assigned, onSelect, onDragStart, onDragEnter, onDrop }: SlotProps) {
  const pickClass = `${picking ? ' picking' : ''}${assigned ? ' pick-assigned' : ''}`
  if (!item) {
    return (
      <div
        className={`mc-slot empty${inspected ? ' inspected' : ''}${marked ? ' marked' : ''}${dropTarget ? ' drop-target' : ''}${pickClass}`}
        data-slot={index}
        data-empty="true"
        onClick={(e) => onSelect(index, e)}
        onDragEnter={() => onDragEnter(index)}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
          onDrop(index)
        }}
      >
        <span>{index}</span>
        <button type="button" className="slot-add" tabIndex={-1}>
          <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M8 3.4v9.2M3.4 8h9.2" />
          </svg>
        </button>
      </div>
    )
  }

  const candidates = iconCandidates(item.material, iconTemplate)
  const ref = item.ref || ({} as NonNullable<PreviewItem['ref']>)
  const classes = [
    'mc-slot',
    item.selected ? 'selected' : '',
    item.canSelect ? '' : 'locked',
    inspected ? 'inspected' : '',
    marked ? 'marked' : '',
    dropTarget ? 'drop-target' : '',
    picking ? 'picking' : '',
    assigned ? 'pick-assigned' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      data-slot={index}
      data-kind={ref.kind || item.type}
      data-id={ref.id || ''}
      draggable
      onClick={(e) => onSelect(index, e)}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(index))
        onDragStart(index)
      }}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
      }}
    >
      <span className="slot-num">{index}</span>
      <MaterialIcon material={item.material} candidates={candidates} imgClass="item-icon" fallbackClass="item-fallback" />
      <ItemTooltip item={item} config={config} />
    </div>
  )
}
