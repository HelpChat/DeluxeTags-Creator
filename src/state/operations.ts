import {
  buildPreview,
  clone,
  legacyToMiniMessage,
  parseSlotList,
  renameKey,
  type Config,
} from '../core'
import type { GeneratedTag } from '../generators'
import type { AppState, ClipboardEntry, Selection, SelectMode } from './types'

// Pure config and selection operations ported from the original static/app.js.
// Each public op takes the current AppState and returns a new AppState. Config and
// preview are cloned before mutation so the originals are never touched, matching the
// original "mutate then render" flow without sharing references.

type AnyRecord = Record<string, unknown>

export function categoryIds(config: Config, includeAll = true): string[] {
  const categories = config.categories || {}
  return Object.keys(categories)
    .filter((id) => includeAll || id !== 'all')
    .sort(
      (a, b) =>
        (Number.parseInt(String((categories[a] as unknown as AnyRecord).order), 10) || 0) -
          (Number.parseInt(String((categories[b] as unknown as AnyRecord).order), 10) || 0) || a.localeCompare(b),
    )
}

export function tagIds(config: Config): string[] {
  const tags = config.deluxetags || {}
  return Object.keys(tags).sort(
    (a, b) =>
      (Number.parseInt(String((tags[a] as unknown as AnyRecord).order), 10) || 0) -
        (Number.parseInt(String((tags[b] as unknown as AnyRecord).order), 10) || 0) || a.localeCompare(b),
  )
}

export function menuSize(config: Config): number {
  return Number.parseInt(String(config.gui?.size), 10) || 54
}

function maxOrder(entries: AnyRecord[]): number {
  return entries.reduce((max, item) => {
    const value = Number.parseInt(String(item.order), 10)
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
}

function nextUnique(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base}_${i}`)) i += 1
  return `${base}_${i}`
}

interface SlotAssignment {
  id: string
  slot: number
}

/**
 * The current tag-to-slot assignment: each tag (sorted by order) mapped to the slot it occupies.
 * Tags fill the resolved tag_slots in order; when there are more tags than slots, the extra ones
 * are given the slots just past the last one.
 */
function currentAssignment(next: AppState): SlotAssignment[] {
  const slots = parseSlotList(next.config.gui.tag_slots, menuSize(next.config)).slots
  const ids = tagIds(next.config)
  let lastSlot = slots.length ? slots[slots.length - 1] : -1
  return ids.map((id, i) => {
    let slot = slots[i]
    if (slot == null) {
      lastSlot += 1
      slot = lastSlot
    } else {
      lastSlot = slot
    }
    return { id, slot }
  })
}

/** All menu slots occupied by static GUI items (dividers, exit, page buttons, etc.). */
function staticOccupiedSlots(config: Config): Set<number> {
  const size = menuSize(config)
  const used = new Set<number>()
  for (const value of Object.values(config.gui as unknown as AnyRecord)) {
    const item = value as AnyRecord | null
    if (item && Array.isArray(item.slots)) {
      for (const slot of parseSlotList(item.slots as string[], size).slots) used.add(slot)
    }
  }
  return used
}

/**
 * Write an assignment back to config. Tags are dynamic in DeluxeTags: they always occupy a
 * contiguous run of slots with no gaps, and only their order is meaningful. So we keep the
 * configured region start (the lowest existing tag slot) and lay the tags out from there in
 * their sorted order, skipping any slot a static item sits on, which turns any arbitrary drop slot
 * into a pure reorder and lets tags flow around static items instead of stacking under them.
 */
function applyAssignment(next: AppState, assignment: SlotAssignment[], reclaimSlot?: number): void {
  const sorted = [...assignment].sort((a, b) => a.slot - b.slot)
  const prev = parseSlotList(next.config.gui.tag_slots, menuSize(next.config)).slots
  let base = prev.length ? Math.min(...prev) : sorted.length ? sorted[0].slot : 0
  // When a static vacates a slot below the region (e.g. it was dropped onto a tag from in front),
  // let the tags reclaim it so they do not drift forward past the region start.
  if (reclaimSlot != null && reclaimSlot < base) base = reclaimSlot
  const statics = staticOccupiedSlots(next.config)
  const size = menuSize(next.config)
  const tagSlots: string[] = []
  let slot = base
  sorted.forEach((a, i) => {
    while (slot < size && statics.has(slot)) slot += 1
    tagSlots.push(String(slot))
    ;(next.config.deluxetags[a.id] as unknown as AnyRecord).order = i + 1
    slot += 1
  })
  next.config.gui.tag_slots = tagSlots
}

/** Re-flow tags into a contiguous, gap-free run. Call after removing tags. */
function reflowTags(next: AppState, reclaimSlot?: number): void {
  applyAssignment(next, currentAssignment(next), reclaimSlot)
}

/** Place a tag id at an exact slot, shifting any tags at or after that slot up to make room. */
function assignToSlot(assignment: SlotAssignment[], id: string, slot: number): SlotAssignment[] {
  const others = assignment.filter((a) => a.id !== id)
  if (others.some((a) => a.slot === slot)) {
    for (const a of others) {
      if (a.slot >= slot) a.slot += 1
    }
  }
  others.push({ id, slot })
  return others
}

/** The lowest menu slot not already occupied by a tag. */
function nextFreeSlot(next: AppState): number {
  const used = new Set(currentAssignment(next).map((a) => a.slot))
  const size = menuSize(next.config)
  for (let i = 0; i < size; i += 1) if (!used.has(i)) return i
  return used.size
}

/** Add a new tag and assign it the next free slot, keeping tag_slots and orders in sync. */
function appendTag(next: AppState, id: string, data: AnyRecord): void {
  const existing = currentAssignment(next)
  const slot = nextFreeSlot(next)
  data.order = 0
  next.config.deluxetags[id] = data as unknown as (typeof next.config.deluxetags)[string]
  applyAssignment(next, assignToSlot(existing, id, slot))
}

function textForMode(config: Config, value: string): string {
  return config.use_minimessage ? legacyToMiniMessage(value) : value
}

function linesForMode(config: Config, lines: string[]): string[] {
  return lines.map((line) => textForMode(config, line))
}

/** Clone the editable parts of state so reducer ops stay immutable. */
function draft(state: AppState): AppState {
  return {
    ...state,
    config: clone(state.config),
    preview: clone(state.preview),
    selection: { ...state.selection },
  }
}

export function ensureSelections(state: AppState): AppState {
  const cats = categoryIds(state.config)
  const tags = tagIds(state.config)
  let category = state.selection.category
  let tag = state.selection.tag
  if (!cats.includes(category)) category = cats.includes('general') ? 'general' : cats[0] || ''
  if (!tags.includes(tag)) tag = tags[0] || ''
  let preview = state.preview
  // Allow "no active tag" (empty). Only clear it when it points at a tag that no longer exists.
  const active = String(state.preview.activeTagId)
  if (active !== '' && !tags.includes(active)) {
    preview = { ...state.preview, activeTagId: '' }
  }
  const selectionChanged = category !== state.selection.category || tag !== state.selection.tag
  if (!selectionChanged && preview === state.preview) return state
  const selection: Selection = selectionChanged ? { ...state.selection, category, tag } : state.selection
  return { ...state, selection, preview }
}

/** Resolve which tag/category a slot points at and update the selection (with multi-select modes). */
export function selectSlot(state: AppState, slot: number | null, mode: SelectMode = 'single'): AppState {
  const next = draft(state)
  const current = next.selection.marked
  let marked: number[]
  let primary: number | null = slot

  if (slot == null) {
    marked = []
    primary = null
  } else if (mode === 'toggle') {
    if (current.includes(slot)) {
      marked = current.filter((s) => s !== slot)
      primary = marked.length ? marked[marked.length - 1] : null
    } else {
      marked = [...current, slot]
    }
  } else if (mode === 'range' && next.selection.slot != null) {
    const lo = Math.min(next.selection.slot, slot)
    const hi = Math.max(next.selection.slot, slot)
    const range: number[] = []
    for (let i = lo; i <= hi; i += 1) range.push(i)
    marked = [...new Set([...current, ...range])]
  } else {
    marked = [slot]
  }

  next.selection.marked = marked
  next.selection.slot = primary
  if (primary != null) {
    const preview = buildPreview(next.config, next.preview)
    const ref = ((preview.slots[primary] as unknown as AnyRecord | null)?.ref as AnyRecord) || null
    if (ref?.kind === 'tag') next.selection.tag = String(ref.id)
    else if (ref?.kind === 'category') next.selection.category = String(ref.id)
  }
  return next
}

/**
 * Find the visible slot currently occupied by a given tag or category in the built preview, or
 * null when it is not on the active screen. Used after add/delete/clone so the sidebar can re-open
 * the resulting entry's editor instead of falling back to the empty hint.
 */
function slotOfRef(next: AppState, kind: 'tag' | 'category', id: string): number | null {
  const preview = buildPreview(next.config, next.preview)
  for (let i = 0; i < preview.slots.length; i += 1) {
    const ref = ((preview.slots[i] as unknown as AnyRecord | null)?.ref as AnyRecord) || null
    if (ref?.kind === kind && String(ref.id) === id) return i
  }
  return null
}

/** Resolve the marked slots to the distinct tag and category ids they point at. */
export function markedRefs(state: AppState): { tags: string[]; categories: string[] } {
  const preview = buildPreview(state.config, state.preview)
  const tags: string[] = []
  const categories: string[] = []
  for (const slot of state.selection.marked) {
    const ref = ((preview.slots[slot] as unknown as AnyRecord | null)?.ref as AnyRecord) || null
    if (ref?.kind === 'tag' && !tags.includes(String(ref.id))) tags.push(String(ref.id))
    else if (ref?.kind === 'category' && !categories.includes(String(ref.id))) categories.push(String(ref.id))
  }
  return { tags, categories }
}

export function clearMarks(state: AppState): AppState {
  if (state.selection.marked.length === 0 && state.selection.slot == null) return state
  return { ...state, selection: { ...state.selection, marked: [], slot: null } }
}

export function bulkDelete(state: AppState): AppState {
  const { tags, categories } = markedRefs(state)
  if (!tags.length && !categories.length) return state
  const next = draft(state)
  for (const id of tags) {
    delete next.config.deluxetags[id]
    delete next.preview.unlockedTags[id]
  }
  for (const id of categories) {
    if (id !== 'all') delete next.config.categories[id]
  }
  const fallback = categoryIds(next.config, false)[0] || 'general'
  for (const tag of Object.values(next.config.deluxetags) as unknown as AnyRecord[]) {
    if (categories.includes(String(tag.category))) tag.category = fallback
  }
  if (tags.length) reflowTags(next)
  next.selection.marked = []
  next.selection.slot = null
  // Keep an editor open on a surviving tag rather than falling back to the empty hint.
  const remaining = tagIds(next.config)
  if (remaining.length) {
    const target = slotOfRef(next, 'tag', remaining[0])
    if (target != null) return selectSlot(next, target)
  }
  return next
}

export function bulkDuplicate(state: AppState): AppState {
  const { tags, categories } = markedRefs(state)
  let next: AppState = state
  for (const id of tags) next = cloneTag(next, id)
  for (const id of categories) next = cloneCategory(next, id)
  // The last clone left its slot selected; keep it so its editor stays open, just clear the marks.
  return { ...next, selection: { ...next.selection, marked: [] } }
}

export function bulkMoveCategory(state: AppState, category: string): AppState {
  const { tags } = markedRefs(state)
  if (!tags.length) return state
  const next = draft(state)
  for (const id of tags) {
    const tag = next.config.deluxetags[id] as unknown as AnyRecord | undefined
    if (tag) tag.category = category
  }
  return next
}

/**
 * Move all marked items (tags and static cells) as a group to consecutive slots starting at toSlot,
 * keeping their order. Tags move via the slot assignment, static cells via their slot list.
 */
export function bulkMoveToSlot(state: AppState, toSlot: number): AppState {
  const next = draft(state)
  const preview = buildPreview(next.config, next.preview)
  const sorted = [...next.selection.marked].sort((a, b) => a - b)
  const moves: Array<{ slot: number; target: number; kind: string; id: string }> = []
  for (const slot of sorted) {
    const ref = ((preview.slots[slot] as unknown as AnyRecord | null)?.ref as AnyRecord) || null
    if (ref && (ref.kind === 'tag' || ref.kind === 'static')) {
      moves.push({ slot, target: toSlot + moves.length, kind: String(ref.kind), id: String(ref.id) })
    }
  }
  if (moves.length === 0) return next

  const tagMoves = moves.filter((m) => m.kind === 'tag')
  if (tagMoves.length) {
    let assignment = currentAssignment(next)
    for (const m of tagMoves) assignment = assignToSlot(assignment, m.id, m.target)
    applyAssignment(next, assignment)
  }
  for (const m of moves.filter((m) => m.kind === 'static')) {
    moveStaticSlot(next.config, m.id, m.slot, m.target)
  }
  next.selection.marked = moves.map((m) => m.target)
  next.selection.slot = toSlot
  return next
}

export function addTag(state: AppState): AppState {
  const next = draft(state)
  const id = nextUnique('tag', tagIds(next.config))
  appendTag(next, id, {
    category: categoryIds(next.config, false)[0] || 'general',
    tag: textForMode(next.config, '&7[&fNew Tag&7]'),
    displayname: textForMode(next.config, '&6Tag&f: &6%deluxetags_identifier%'),
    description: linesForMode(next.config, ['&7A new tag.', '%deluxetags_available%']),
    item: 'NAME_TAG',
    data: 0,
    permission: `deluxetags.tag.${id}`,
  })
  next.preview.unlockedTags[id] = true
  next.selection.tag = id
  const slot = slotOfRef(next, 'tag', id)
  return slot != null ? selectSlot(next, slot) : { ...next, selection: { ...next.selection, slot: null } }
}

export function deleteTag(state: AppState, id: string): AppState {
  const next = draft(state)
  const order = tagIds(state.config).indexOf(id)
  delete next.config.deluxetags[id]
  delete next.preview.unlockedTags[id]
  const remaining = tagIds(next.config)
  if (next.preview.activeTagId === id) next.preview.activeTagId = remaining[0] || ''
  reflowTags(next)
  // Select the neighbour that took the deleted tag's place so the editor stays open.
  const targetTag = remaining.length ? remaining[Math.min(order, remaining.length - 1)] : ''
  next.selection.tag = targetTag
  const slot = targetTag ? slotOfRef(next, 'tag', targetTag) : null
  return slot != null ? selectSlot(next, slot) : { ...next, selection: { ...next.selection, slot: null } }
}

export function addCategory(state: AppState): AppState {
  const next = draft(state)
  const id = nextUnique('category', categoryIds(next.config))
  next.config.categories[id] = {
    order: categoryIds(next.config).length + 1,
    item: 'NAME_TAG',
    name: textForMode(next.config, `&6${id}`),
    lore: linesForMode(next.config, ['&7Click to view tags']),
    gui_name: textForMode(next.config, `&6${id} tags`),
  }
  next.selection.category = id
  // Show the categories screen and open the new (still empty) category's editor. The categories
  // screen lists empty categories, so no placeholder tag is created and nothing lands on the tags
  // pages.
  next.preview.screen = 'categories'
  const slot = slotOfRef(next, 'category', id)
  return slot != null ? selectSlot(next, slot) : next
}

export function deleteCategory(state: AppState, id: string): AppState {
  const next = draft(state)
  const fallback = categoryIds(next.config, false).find((c) => c !== id) || 'general'
  delete next.config.categories[id]
  for (const tag of Object.values(next.config.deluxetags) as unknown as AnyRecord[]) {
    if (tag.category === id) tag.category = fallback
  }
  next.selection.category = fallback
  const slot = slotOfRef(next, 'category', fallback)
  return slot != null ? selectSlot(next, slot) : { ...next, selection: { ...next.selection, slot: null } }
}

/** Returns the new state, or null when the new id collides. */
export function renameTag(state: AppState, oldId: string, newId: string): AppState | null {
  const next = draft(state)
  if (!renameKey(next.config.deluxetags, oldId, newId)) return null
  const tag = next.config.deluxetags[newId] as unknown as AnyRecord
  if (!tag.permission || tag.permission === `deluxetags.tag.${oldId}`) {
    tag.permission = `deluxetags.tag.${newId}`
  }
  next.preview.unlockedTags[newId] = next.preview.unlockedTags[oldId] !== false
  delete next.preview.unlockedTags[oldId]
  if (next.preview.activeTagId === oldId) next.preview.activeTagId = newId
  next.selection.tag = newId
  return next
}

/** Returns the new state, or null when the new id collides or is reserved. */
export function renameCategory(state: AppState, oldId: string, newId: string): AppState | null {
  const next = draft(state)
  if (!renameKey(next.config.categories, oldId, newId)) return null
  for (const tag of Object.values(next.config.deluxetags) as unknown as AnyRecord[]) {
    if (tag.category === oldId) tag.category = newId
  }
  next.selection.category = newId
  if (next.preview.category === oldId) next.preview.category = newId
  return next
}

export function addTagAtSlot(state: AppState, slot: number): AppState {
  const next = draft(state)
  const id = nextUnique('tag', tagIds(next.config))
  const builtPreview = buildPreview(next.config, next.preview)
  const category =
    builtPreview.screen === 'tags' && builtPreview.categoryIdentifier !== 'all'
      ? builtPreview.categoryIdentifier
      : categoryIds(next.config, false)[0] || 'general'
  const existing = currentAssignment(next)
  next.config.deluxetags[id] = {
    order: 0,
    category,
    tag: textForMode(next.config, '&7[&fNew Tag&7]'),
    displayname: textForMode(next.config, '&6Tag&f: &6%deluxetags_identifier%'),
    description: linesForMode(next.config, ['&7A new tag.', '%deluxetags_available%']),
    item: 'NAME_TAG',
    data: 0,
    permission: `deluxetags.tag.${id}`,
  }
  applyAssignment(next, assignToSlot(existing, id, slot))
  next.preview.unlockedTags[id] = true
  next.selection.tag = id
  return selectSlot(next, slot)
}

export function addCategoryAtSlot(state: AppState, _slot: number): AppState {
  const next = draft(state)
  const id = nextUnique('category', categoryIds(next.config))
  next.config.categories[id] = {
    order: maxOrder(Object.values(next.config.categories) as unknown as AnyRecord[]) + 1,
    item: 'NAME_TAG',
    name: textForMode(next.config, `&6${id}`),
    lore: linesForMode(next.config, ['&7Click to view tags']),
    gui_name: textForMode(next.config, `&6${id} tags`),
  }
  next.selection.category = id
  // Categories live on the categories screen (which lists empty ones), so no placeholder tag is
  // created; switch there and open the new category's editor.
  next.preview.screen = 'categories'
  const slot = slotOfRef(next, 'category', id)
  return slot != null ? selectSlot(next, slot) : next
}

export function setStaticItemAtSlot(state: AppState, key: string, slot: number): AppState {
  const next = draft(state)
  const item = next.config.gui[key] as AnyRecord | undefined
  if (!item) return next
  const slots = parseSlotList((item.slots as string[]) || [], menuSize(next.config)).slots
  if (!slots.includes(slot)) slots.push(slot)
  item.slots = slots.sort((a, b) => a - b).map(String)
  return selectSlot(next, slot)
}

/** Add or remove a single slot from a static GUI item's slot list, keeping it sorted. */
export function toggleStaticSlot(state: AppState, key: string, slot: number): AppState {
  const next = draft(state)
  const item = next.config.gui[key] as AnyRecord | undefined
  if (!item) return next
  const slots = parseSlotList((item.slots as string[]) || [], menuSize(next.config)).slots
  const updated = slots.includes(slot) ? slots.filter((s) => s !== slot) : [...slots, slot]
  item.slots = updated.sort((a, b) => a - b).map(String)
  return next
}

function moveStaticSlot(config: Config, key: string, fromSlot: number, toSlot: number): void {
  const item = config.gui[key] as AnyRecord | undefined
  if (!item || !Array.isArray(item.slots)) return
  const slots = parseSlotList(item.slots as string[], menuSize(config)).slots
  const nextSlots = slots.map((s) => (s === fromSlot ? toSlot : s))
  if (!nextSlots.includes(toSlot)) nextSlots.push(toSlot)
  item.slots = [...new Set(nextSlots)].sort((a, b) => a - b).map(String)
}

function swapOrders(col: Record<string, AnyRecord>, a: string, b: string): boolean {
  if (!col[a] || !col[b] || a === b) return false
  const tmp = col[a].order
  col[a].order = col[b].order
  col[b].order = tmp
  return true
}

export function movePreviewItem(state: AppState, fromSlot: number, toSlot: number): AppState {
  const next = draft(state)
  const preview = buildPreview(next.config, next.preview)
  const from = preview.slots[fromSlot] as unknown as AnyRecord | null
  const to = preview.slots[toSlot] as unknown as AnyRecord | null
  const fromRef = (from?.ref as AnyRecord) || null
  const toRef = (to?.ref as AnyRecord) || null
  if (!fromRef || fromSlot === toSlot) return next
  if (fromRef.kind === 'static') {
    moveStaticSlot(next.config, String(fromRef.id), fromSlot, toSlot)
    // Reflow so tags flow around the static's new slot instead of stacking under it, reclaiming the
    // slot the static left (so a static dropped on a tag from in front swaps cleanly).
    reflowTags(next, fromSlot)
  } else if (fromRef.kind === 'tag' && toRef?.kind === 'tag') {
    // Swap the two tags' slots so they trade places.
    const assignment = currentAssignment(next)
    const a = assignment.find((x) => x.id === String(fromRef.id))
    const b = assignment.find((x) => x.id === String(toRef.id))
    if (a && b) {
      const tmp = a.slot
      a.slot = b.slot
      b.slot = tmp
      applyAssignment(next, assignment)
    }
  } else if (fromRef.kind === 'category' && toRef?.kind === 'category') {
    swapOrders(next.config.categories as unknown as Record<string, AnyRecord>, String(fromRef.id), String(toRef.id))
  } else if (fromRef.kind === 'tag' && !to) {
    // Move the tag to the empty slot exactly.
    applyAssignment(next, assignToSlot(currentAssignment(next), String(fromRef.id), toSlot))
  }
  return selectSlot(next, toSlot)
}

function insertClonedTag(state: AppState, source: unknown, baseId: string, slot: number | null): AppState {
  const next = draft(state)
  const data = clone(source) as AnyRecord
  const newId = nextUnique(`${baseId}_copy`, tagIds(next.config))
  if (!data.permission || data.permission === `deluxetags.tag.${baseId}`) {
    data.permission = `deluxetags.tag.${newId}`
  }
  const existing = currentAssignment(next)
  const targetSlot = slot != null ? slot : (existing.length ? Math.max(...existing.map((a) => a.slot)) + 1 : 0)
  data.order = 0
  next.config.deluxetags[newId] = data as unknown as (typeof next.config.deluxetags)[string]
  applyAssignment(next, assignToSlot(existing, newId, targetSlot))
  next.preview.unlockedTags[newId] = true
  next.selection.tag = newId
  const sel = slotOfRef(next, 'tag', newId)
  return sel != null ? selectSlot(next, sel) : { ...next, selection: { ...next.selection, slot: null } }
}

function insertClonedCategory(state: AppState, source: unknown, baseId: string): AppState {
  const next = draft(state)
  const data = clone(source) as AnyRecord
  const newId = nextUnique(`${baseId}_copy`, categoryIds(next.config))
  data.order = maxOrder(Object.values(next.config.categories) as unknown as AnyRecord[]) + 1
  next.config.categories[newId] = data as unknown as (typeof next.config.categories)[string]
  next.selection.category = newId
  const slot = slotOfRef(next, 'category', newId)
  return slot != null ? selectSlot(next, slot) : { ...next, selection: { ...next.selection, slot: null } }
}

export function cloneTag(state: AppState, id: string): AppState {
  const source = state.config.deluxetags[id] as unknown as AnyRecord | undefined
  if (!source) return state
  // Place the copy in the slot right after the original.
  const entry = currentAssignment(state).find((a) => a.id === id)
  return insertClonedTag(state, source, id, entry != null ? entry.slot + 1 : null)
}

export function cloneCategory(state: AppState, id: string): AppState {
  if (!state.config.categories[id]) return state
  return insertClonedCategory(state, state.config.categories[id], id)
}

export function pasteEntries(state: AppState, entries: ClipboardEntry[]): AppState {
  let next: AppState = state
  const slot = state.selection.slot
  for (const entry of entries) {
    if (entry.kind === 'tag') {
      next = insertClonedTag(next, entry.data, entry.baseId, slot)
    } else if (entry.kind === 'category') {
      next = insertClonedCategory(next, entry.data, entry.baseId)
    }
  }
  // Keep the target slot selected so the pasted tag's editor opens.
  return slot != null ? selectSlot(next, slot) : next
}

export function removeStaticSlot(state: AppState, key: string, slot: number): AppState {
  const next = draft(state)
  const item = next.config.gui[key] as AnyRecord | undefined
  if (!item || !Array.isArray(item.slots)) return next
  const slots = parseSlotList(item.slots as string[], menuSize(next.config)).slots.filter((s) => s !== slot)
  item.slots = slots.map(String)
  next.selection.slot = null
  return next
}

export function insertGeneratedTags(state: AppState, tags: GeneratedTag[]): AppState {
  const next = draft(state)
  let firstId: string | null = null
  for (const spec of tags) {
    const id = nextUnique('tag', tagIds(next.config))
    appendTag(next, id, {
      category: spec.category || categoryIds(next.config, false)[0] || 'general',
      tag: spec.tag,
      displayname: spec.displayname ?? textForMode(next.config, '&6Tag&f: &6%deluxetags_identifier%'),
      description: spec.description ?? linesForMode(next.config, ['&7Generated tag.', '%deluxetags_available%']),
      item: spec.item || 'NAME_TAG',
      data: 0,
      permission: `deluxetags.tag.${id}`,
    })
    next.preview.unlockedTags[id] = true
    if (!firstId) firstId = id
  }
  if (firstId) {
    next.selection.tag = firstId
    const slot = slotOfRef(next, 'tag', firstId)
    if (slot != null) return selectSlot(next, slot)
    next.selection.slot = null
  }
  return next
}

/** Generic data-path setter for the bound inputs (config.* and preview.*). */
export function setByPath(state: AppState, path: string, value: unknown): AppState {
  const next = draft(state)
  const parts = path.split('.')
  const root = parts[0]
  let target: AnyRecord
  if (root === 'config') target = next.config as unknown as AnyRecord
  else if (root === 'preview') target = next.preview as unknown as AnyRecord
  else return next
  let cursor: AnyRecord = target
  for (let i = 1; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {}
    cursor = cursor[key] as AnyRecord
  }
  cursor[parts[parts.length - 1]] = value
  return next
}
