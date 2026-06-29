import { formatTextSegments, normalizeImportedConfig } from './index'

const mini = normalizeImportedConfig({ use_minimessage: true })

describe('gradient and rainbow rendering (Phase 4)', () => {
  it('still renders a two hex stop gradient', () => {
    const seg = formatTextSegments('<gradient:#ff0000:#0000ff>AB</gradient>', mini)
    expect(seg).toHaveLength(2)
    expect(seg[0].style.color).toMatch(/^#/)
    expect(seg[0].style.color).not.toBe(seg[1].style.color)
  })

  it('renders a named-color gradient', () => {
    const seg = formatTextSegments('<gradient:red:blue>AB</gradient>', mini)
    expect(seg).toHaveLength(2)
    expect(seg[0].style.color).toMatch(/^#/)
    expect(seg[1].style.color).toMatch(/^#/)
  })

  it('renders a gradient with three stops', () => {
    const seg = formatTextSegments('<gradient:red:green:blue>ABC</gradient>', mini)
    expect(seg).toHaveLength(3)
    expect(seg[0].style.color).not.toBe(seg[2].style.color)
  })

  it('renders a rainbow with distinct per-character colors', () => {
    const seg = formatTextSegments('<rainbow>AB</rainbow>', mini)
    expect(seg).toHaveLength(2)
    expect(seg[0].style.color).toMatch(/^#/)
    expect(seg[0].style.color).not.toBe(seg[1].style.color)
  })
})
