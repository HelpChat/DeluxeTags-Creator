import { buildPreview, createDefaultState, type Config, type Preview } from '../core'
import { historyReducer } from './reducer'
import { ensureSelections, tagIds } from './operations'
import type { Action, HistoryState } from './types'

function initialHistory(): HistoryState {
  const base = createDefaultState()
  const present = ensureSelections({
    config: base.config as Config,
    preview: base.preview as Preview,
    selection: { slot: null, marked: [], tag: 'example', category: 'general' },
    modal: 'none',
    yamlDraft: '',
    yamlError: null,
  })
  return { present, past: [], future: [] }
}

function run(history: HistoryState, ...actions: Action[]): HistoryState {
  return actions.reduce(historyReducer, history)
}

describe('history reducer', () => {
  it('adds a tag and records one undo step', () => {
    const history = run(initialHistory(), { type: 'add-tag' })
    expect(tagIds(history.present.config).length).toBe(2)
    expect(history.past.length).toBe(1)
  })

  it('undoes and redoes a config edit', () => {
    const added = run(initialHistory(), { type: 'add-tag' })
    const undone = historyReducer(added, { type: 'undo' })
    expect(tagIds(undone.present.config).length).toBe(1)
    expect(undone.future.length).toBe(1)
    const redone = historyReducer(undone, { type: 'redo' })
    expect(tagIds(redone.present.config).length).toBe(2)
  })

  it('coalesces consecutive edits to the same field into one undo step', () => {
    const history = run(
      initialHistory(),
      { type: 'set-path', path: 'config.deluxetags.example.tag', value: 'a' },
      { type: 'set-path', path: 'config.deluxetags.example.tag', value: 'ab' },
      { type: 'set-path', path: 'config.deluxetags.example.tag', value: 'abc' },
    )
    expect(history.past.length).toBe(1)
    const undone = historyReducer(history, { type: 'undo' })
    expect(undone.present.config.deluxetags.example.tag).toBe('&8[&bDeluxeTags&8]')
  })

  it('does not record history for preview-only changes', () => {
    const history = run(initialHistory(), { type: 'set-path', path: 'preview.playerName', value: 'Alex' })
    expect(history.past.length).toBe(0)
    expect(history.present.preview.playerName).toBe('Alex')
  })

  it('clones a tag under a new id and records one undo step', () => {
    const history = run(initialHistory(), { type: 'clone-tag', id: 'example' })
    const ids = tagIds(history.present.config)
    expect(ids.length).toBe(2)
    expect(ids).toContain('example_copy')
    expect(history.past.length).toBe(1)
    expect(history.present.config.deluxetags.example_copy.permission).toBe('deluxetags.tag.example_copy')
  })

  it('pastes entries from the clipboard', () => {
    const base = initialHistory()
    const data = base.present.config.deluxetags.example
    const history = historyReducer(base, {
      type: 'paste-entries',
      entries: [{ kind: 'tag', baseId: 'example', data }],
    })
    expect(tagIds(history.present.config)).toContain('example_copy')
  })

  it('marks a range and bulk-duplicates the marked tags', () => {
    // mark two tag slots by selecting one then range-selecting another with tags present
    const withTags = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' })
    const built = buildPreview(withTags.present.config, withTags.present.preview)
    const tagSlots = built.slots
      .map((s, i) => (s?.ref?.kind === 'tag' ? i : -1))
      .filter((i) => i >= 0)
    const marked = run(
      withTags,
      { type: 'select-slot', slot: tagSlots[0], mode: 'single' },
      { type: 'select-slot', slot: tagSlots[1], mode: 'toggle' },
    )
    expect(marked.present.selection.marked.length).toBe(2)
    const before = tagIds(marked.present.config).length
    const dup = historyReducer(marked, { type: 'bulk-duplicate' })
    expect(tagIds(dup.present.config).length).toBe(before + 2)
  })

  it('places a newly created tag at the clicked slot, not the end', () => {
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' }) // 3 tags at slots 0,1,2
    h = historyReducer(h, { type: 'add-tag-at-slot', slot: 1 })
    const built = buildPreview(h.present.config, h.present.preview)
    expect(built.slots[1]?.ref?.id).toBe(h.present.selection.tag)
  })

  it('pastes a tag at the selected slot', () => {
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' })
    h = historyReducer(h, { type: 'select-slot', slot: 1, mode: 'single' })
    const data = h.present.config.deluxetags.example
    h = historyReducer(h, { type: 'paste-entries', entries: [{ kind: 'tag', baseId: 'example', data }] })
    const built = buildPreview(h.present.config, h.present.preview)
    expect(built.slots[1]?.ref?.id).toBe('example_copy')
  })

  it('moves all marked tags as a group to the drop slot', () => {
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' }) // 3 tags at 0,1,2
    h = run(h, { type: 'select-slot', slot: 0, mode: 'single' }, { type: 'select-slot', slot: 1, mode: 'toggle' })
    expect(h.present.selection.marked.length).toBe(2)
    h = historyReducer(h, { type: 'bulk-move-to-slot', toSlot: 10 })
    const built = buildPreview(h.present.config, h.present.preview)
    expect(built.slots[10]?.ref?.kind).toBe('tag')
    expect(built.slots[11]?.ref?.kind).toBe('tag')
  })

  it('clears marks without recording history', () => {
    const marked = run(initialHistory(), { type: 'select-slot', slot: 0, mode: 'single' })
    const cleared = historyReducer(marked, { type: 'clear-marks' })
    expect(cleared.present.selection.marked).toEqual([])
    expect(cleared.past.length).toBe(marked.past.length)
  })

  it('leaves state unchanged when a rename collides', () => {
    const withTwo = run(initialHistory(), { type: 'add-tag' })
    const newId = tagIds(withTwo.present.config).find((id) => id !== 'example')!
    const attempted = historyReducer(withTwo, { type: 'rename-tag', oldId: 'example', newId })
    expect(attempted).toBe(withTwo)
  })
})
