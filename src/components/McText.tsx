import { escapeHtml, formatTextHtml, type Config } from '../core'
import { useApp } from '../state/store'

interface McTextProps {
  raw: string
  config: Config
  className?: string
  /** Render as a block element instead of an inline span wrapper. */
  as?: 'span' | 'div' | 'strong'
}

/**
 * Renders Minecraft formatted text (legacy codes, hex, or MiniMessage) as styled HTML,
 * using the core formatter. The output is trusted: it is produced by formatTextHtml, which
 * escapes the text content and only emits style spans.
 *
 * In Raw preview mode the text is shown literally (escaped) so the MiniMessage tags, legacy
 * codes, and %placeholders% appear as their source rather than being rendered.
 */
export function McText({ raw, config, className, as = 'span' }: McTextProps) {
  const { state } = useApp()
  const literal = state.preview.parsePlaceholders === false
  const html = literal ? escapeHtml(raw) : formatTextHtml(raw, config)
  const Tag = as
  // The mc-text class lets CSS keep the Minecraft pixel font even inside buttons.
  return <Tag className={className ? `mc-text ${className}` : 'mc-text'} dangerouslySetInnerHTML={{ __html: html }} />
}
