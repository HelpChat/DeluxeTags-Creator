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
    slotPick: null,
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

  it('toggles a static item slot on and off (interactive slots)', () => {
    const key = 'exit_item'
    let history = initialHistory()
    const before = (history.present.config.gui[key] as { slots: string[] }).slots
    expect(before).not.toContain('46')
    history = run(history, { type: 'toggle-static-slot', key, slot: 46 })
    expect((history.present.config.gui[key] as { slots: string[] }).slots).toContain('46')
    expect(history.past.length).toBe(1) // undoable config edit
    history = run(history, { type: 'toggle-static-slot', key, slot: 46 })
    expect((history.present.config.gui[key] as { slots: string[] }).slots).not.toContain('46')
  })

  it('flows a tag out of the way when a static item is dropped on it (no stacking)', () => {
    let history = initialHistory()
    // put a static divider on slot 1 (the example tag is at slot 0)
    history = run(history, { type: 'set-static-at-slot', key: 'divider_item', slot: 1 })
    // drag the divider from slot 1 onto the tag at slot 0
    history = run(history, { type: 'move-preview-item', fromSlot: 1, toSlot: 0 })
    const built = buildPreview(history.present.config, history.present.preview)
    expect(built.slots[0]?.ref?.kind).toBe('static')
    expect(built.slots[1]?.ref?.kind).toBe('tag')
  })

  it('adds a category without creating a tag, and shows it on the categories screen', () => {
    let history = initialHistory()
    const tagsBefore = tagIds(history.present.config).length
    history = run(history, { type: 'add-category' })
    expect(tagIds(history.present.config).length).toBe(tagsBefore)
    const newCat = history.present.selection.category
    const built = buildPreview(history.present.config, history.present.preview)
    const shown = built.slots.some((s) => s?.ref?.kind === 'category' && s.ref.id === newCat)
    expect(shown).toBe(true)
  })

  it('swaps back cleanly when a static in front is dropped on a tag', () => {
    let history = initialHistory()
    history = run(history, { type: 'set-static-at-slot', key: 'divider_item', slot: 1 })
    // static behind: drop divider (slot 1) on tag (slot 0) -> divider at 0, tag at 1
    history = run(history, { type: 'move-preview-item', fromSlot: 1, toSlot: 0 })
    let built = buildPreview(history.present.config, history.present.preview)
    expect(built.slots[0]?.ref?.kind).toBe('static')
    expect(built.slots[1]?.ref?.kind).toBe('tag')
    // static now in front: drop divider (slot 0) back on tag (slot 1) -> tag reclaims slot 0
    history = run(history, { type: 'move-preview-item', fromSlot: 0, toSlot: 1 })
    built = buildPreview(history.present.config, history.present.preview)
    expect(built.slots[0]?.ref?.kind).toBe('tag')
    expect(built.slots[1]?.ref?.kind).toBe('static')
  })

  it('resets the config back to the default and can be undone', () => {
    let history = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' })
    expect(tagIds(history.present.config).length).toBe(3)
    history = run(history, { type: 'reset' })
    expect(tagIds(history.present.config)).toEqual(['example'])
    const undone = historyReducer(history, { type: 'undo' })
    expect(tagIds(undone.present.config).length).toBe(3)
  })

  it('sets and clears slot-pick mode without recording undo history', () => {
    let history = initialHistory()
    const before = history.past.length
    history = run(history, { type: 'set-slot-pick', key: 'exit_item' })
    expect(history.present.slotPick).toBe('exit_item')
    history = run(history, { type: 'set-slot-pick', key: null })
    expect(history.present.slotPick).toBeNull()
    expect(history.past.length).toBe(before)
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

  it('keeps tags contiguous (no gaps) when marked tags are dragged to a far slot', () => {
    // Tags are order-only in DeluxeTags: dragging them cannot leave a gap. Moving marked tags
    // to slot 10 reorders them but they stay packed in the contiguous tag region.
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' }) // 3 tags at 0,1,2
    h = run(h, { type: 'select-slot', slot: 0, mode: 'single' }, { type: 'select-slot', slot: 1, mode: 'toggle' })
    expect(h.present.selection.marked.length).toBe(2)
    h = historyReducer(h, { type: 'bulk-move-to-slot', toSlot: 10 })
    const built = buildPreview(h.present.config, h.present.preview)
    const tagSlots = built.slots.map((s, i) => (s?.ref?.kind === 'tag' ? i : -1)).filter((i) => i >= 0)
    // three tags, packed contiguously from the region start, no gap opened at slot 10
    expect(tagSlots).toEqual([0, 1, 2])
    expect(built.slots[10]?.ref?.kind).not.toBe('tag')
  })

  it('reflows tag_slots with no gap after deleting a middle tag (Item 2)', () => {
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' }) // 3 tags at 0,1,2
    const middle = tagIds(h.present.config)[1]
    h = historyReducer(h, { type: 'delete-tag', id: middle })
    // two tags remain and tag_slots is a contiguous run with no gap
    expect(tagIds(h.present.config).length).toBe(2)
    expect(h.present.config.gui.tag_slots).toEqual(['0', '1'])
    const built = buildPreview(h.present.config, h.present.preview)
    const tagSlots = built.slots.map((s, i) => (s?.ref?.kind === 'tag' ? i : -1)).filter((i) => i >= 0)
    expect(tagSlots).toEqual([0, 1])
  })

  it('keeps tag_slots contiguous when a single tag is dragged onto a far empty slot (Item 2)', () => {
    let h = run(initialHistory(), { type: 'add-tag' }, { type: 'add-tag' }) // 3 tags at 0,1,2
    h = historyReducer(h, { type: 'move-preview-item', fromSlot: 0, toSlot: 20 })
    expect(h.present.config.gui.tag_slots).toEqual(['0', '1', '2'])
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
