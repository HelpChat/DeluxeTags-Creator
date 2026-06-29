import { useEffect, useRef, type CSSProperties, type FormEvent } from 'react'
import {
  formatTextHtml,
  patchRawFromPlain,
  replaceStyledRange,
  styledPlainMap,
  type Config,
} from '../core'
import { useApp, type ActiveEditor } from '../state/store'

interface StyledEditorProps {
  value: string
  config: Config
  onChange(raw: string): void
  multiline?: boolean
  rows?: number
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onBlur?(): void
}

/** HTML for the contenteditable: newlines become literal \n, which renders via white-space pre-wrap. */
function editorHtml(raw: string, config: Config): string {
  return formatTextHtml(raw, config).replace(/<br\s*\/?>/g, '\n')
}

/** Plain text offset of a DOM position, measured against the editor contents. */
function plainOffsetAt(editor: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange()
  range.selectNodeContents(editor)
  range.setEnd(node, offset)
  return range.toString().length
}

function selectionPlainRange(editor: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null
  const a = plainOffsetAt(editor, range.startContainer, range.startOffset)
  const b = plainOffsetAt(editor, range.endContainer, range.endOffset)
  return { start: Math.min(a, b), end: Math.max(a, b) }
}

function setCaret(editor: HTMLElement, offset: number): void {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let remaining = Math.max(0, offset)
  let node = walker.nextNode()
  const range = document.createRange()
  const selection = window.getSelection()
  while (node) {
    const length = node.nodeValue?.length ?? 0
    if (remaining <= length) {
      range.setStart(node, remaining)
      range.collapse(true)
      selection?.removeAllRanges()
      selection?.addRange(range)
      return
    }
    remaining -= length
    node = walker.nextNode()
  }
  range.selectNodeContents(editor)
  range.collapse(false)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

export function StyledEditor({ value, config, onChange, multiline = false, rows, placeholder, className, autoFocus, onBlur }: StyledEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rawRef = useRef(value)
  const savedSelection = useRef<{ start: number; end: number } | null>(null)
  const mounted = useRef(false)
  const { activeEditor } = useApp()
  const useMini = config.use_minimessage
  const configKey = `${config.use_minimessage}|${config.legacy_hex}`
  const configKeyRef = useRef(configKey)

  // Set the DOM content on mount and whenever the value or formatting mode changes from outside.
  // During local typing we update rawRef ourselves and call onChange, so value comes back equal to
  // rawRef and this guard skips, leaving the caret untouched.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const firstMount = !mounted.current
    if (firstMount || value !== rawRef.current || configKey !== configKeyRef.current) {
      mounted.current = true
      rawRef.current = value
      configKeyRef.current = configKey
      el.innerHTML = editorHtml(value, config)
    }
    if (firstMount && autoFocus) {
      el.focus()
      setCaret(el, styledPlainMap(value, useMini).plain.length)
    }
  })

  function commit(newRaw: string, caret: number) {
    const el = ref.current
    if (!el) return
    rawRef.current = newRaw
    el.innerHTML = editorHtml(newRaw, config)
    setCaret(el, Math.min(caret, styledPlainMap(newRaw, useMini).plain.length))
    onChange(newRaw)
  }

  function applyRange(start: number, end: number, text: string) {
    const newRaw = replaceStyledRange(rawRef.current, start, end, text, useMini)
    commit(newRaw, start + styledPlainMap(text, useMini).plain.length)
  }

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    const native = event.nativeEvent as InputEvent
    const el = ref.current
    if (!el) return
    const type = native.inputType || ''
    let text: string | null = null

    if (type === 'insertText') {
      text = native.data ?? ''
    } else if (type === 'insertParagraph' || type === 'insertLineBreak') {
      if (!multiline) {
        event.preventDefault()
        return
      }
      text = '\n'
    } else if (type === 'insertFromPaste' || type === 'insertFromDrop' || type === 'insertReplacementText') {
      text = native.dataTransfer?.getData('text/plain') ?? native.data ?? ''
      if (!multiline) text = text.replace(/\r?\n/g, ' ')
    } else if (type.startsWith('delete')) {
      text = ''
    } else if (type.startsWith('format')) {
      event.preventDefault()
      return
    } else {
      // Unknown insert type: let the browser apply it, then reconcile in handleInput.
      return
    }

    const ranges = native.getTargetRanges?.()
    let plain: { start: number; end: number } | null = null
    if (ranges && ranges.length > 0) {
      const r = ranges[0]
      const a = plainOffsetAt(el, r.startContainer, r.startOffset)
      const b = plainOffsetAt(el, r.endContainer, r.endOffset)
      plain = { start: Math.min(a, b), end: Math.max(a, b) }
    } else {
      plain = selectionPlainRange(el)
    }
    if (!plain) return
    event.preventDefault()
    applyRange(plain.start, plain.end, text)
  }

  // Fallback for edits that were not handled in beforeinput.
  function handleInput() {
    const el = ref.current
    if (!el) return
    const previousPlain = styledPlainMap(rawRef.current, useMini).plain
    const raw = el.textContent ?? ''
    const nextPlain = multiline ? raw : raw.replace(/\n+/g, ' ')
    const caret = selectionPlainRange(el)?.end ?? nextPlain.length
    const newRaw = patchRawFromPlain(rawRef.current, previousPlain, nextPlain, useMini)
    commit(newRaw, caret)
  }

  function rememberSelection() {
    const el = ref.current
    if (!el) return
    const sel = selectionPlainRange(el)
    if (sel) savedSelection.current = sel
  }

  function registerActiveEditor() {
    const handle: ActiveEditor = {
      applyWrapper(opening, closing, fallbackText = 'Text') {
        const el = ref.current
        if (!el) return
        const sel = selectionPlainRange(el) ??
          savedSelection.current ?? { start: styledPlainMap(rawRef.current, useMini).plain.length, end: 0 }
        const start = Math.min(sel.start, sel.end)
        const end = Math.max(sel.start, sel.end)
        const raw = rawRef.current
        const map = styledPlainMap(raw, useMini).offsetToRaw
        const rawStart = map[start] ?? raw.length
        const rawEnd = map[end] ?? rawStart
        const hasSelection = end > start
        const body = hasSelection ? raw.slice(rawStart, rawEnd) : fallbackText
        const newRaw = raw.slice(0, rawStart) + opening + body + closing + raw.slice(rawEnd)
        const caret = hasSelection ? end : start + styledPlainMap(fallbackText, useMini).plain.length
        commit(newRaw, caret)
      },
      insertText(text) {
        const el = ref.current
        if (!el) return
        const sel = selectionPlainRange(el) ?? savedSelection.current
        const start = sel ? Math.min(sel.start, sel.end) : styledPlainMap(rawRef.current, useMini).plain.length
        const end = sel ? Math.max(sel.start, sel.end) : start
        applyRange(start, end, text)
      },
    }
    activeEditor.current = handle
  }

  return (
    <div
      ref={ref}
      className={`styled-editor has-mm-helper ${multiline ? 'multiline' : 'singleline'}${className ? ` ${className}` : ''}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-multiline={multiline || undefined}
      data-styled-editor="true"
      data-single-line={multiline ? 'false' : 'true'}
      data-placeholder={styledPlainMap(placeholder ?? '', useMini).plain}
      style={{ '--editor-rows': rows ?? (multiline ? 3 : 1) } as CSSProperties}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onFocus={() => {
        registerActiveEditor()
        rememberSelection()
      }}
      onBlur={onBlur}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
    />
  )
}
