import { applyStylePreset, generatePack, gradientStyle, randomTag, STYLE_PRESETS, TAG_PACKS } from './generators'

describe('tag generators', () => {
  it('applies a named style preset', () => {
    expect(applyStylePreset('VIP', 'rainbow')).toBe('<rainbow>VIP</rainbow>')
    expect(applyStylePreset('VIP', 'fire')).toBe('<gradient:#ff5500:#ffdd00>VIP</gradient>')
  })

  it('returns the text unchanged for an unknown preset', () => {
    expect(applyStylePreset('VIP', 'nope')).toBe('VIP')
  })

  it('builds a custom two-stop gradient', () => {
    expect(gradientStyle('VIP', '#ff0000', '#00ff00')).toBe('<gradient:#ff0000:#00ff00>VIP</gradient>')
  })

  it('generates a themed pack of tags', () => {
    const tags = generatePack('elements')
    expect(tags).toHaveLength(4)
    expect(tags[0].tag).toContain('gradient')
    expect(tags[0].item).toBe('BLAZE_POWDER')
    expect(generatePack('nope')).toEqual([])
  })

  it('generates a deterministic random tag with a seeded rng', () => {
    const tag = randomTag(() => 0)
    expect(tag.tag).toBe(STYLE_PRESETS[0].apply('Shadow'))
    expect(tag.item).toBeDefined()
  })

  it('every preset and pack tag is non-empty', () => {
    expect(STYLE_PRESETS.length).toBeGreaterThan(0)
    for (const pack of TAG_PACKS) {
      expect(pack.tags.length).toBeGreaterThan(0)
      for (const t of pack.tags) expect(t.tag).not.toBe('')
    }
  })
})
