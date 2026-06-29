import { fireEvent, render, screen } from '@testing-library/react'
import { App } from '../App'

describe('App integration', () => {
  it('shows the hint until a slot is selected', () => {
    render(<App />)
    expect(screen.getByText('Click a slot to edit')).toBeInTheDocument()
  })

  it('opens the tag editor when the example tag slot is clicked', () => {
    const { container } = render(<App />)
    const slot = container.querySelector('[data-id="example"]') as HTMLElement
    expect(slot).toBeTruthy()
    fireEvent.click(slot)
    expect(screen.getByText('Tag Text')).toBeInTheDocument()
    expect(screen.getByDisplayValue('deluxetags.tag.example')).toBeInTheDocument()
  })

  it('opens the chooser on an empty slot and adds a tag from it', () => {
    const { container } = render(<App />)
    const empty = container.querySelector('[data-empty="true"]') as HTMLElement
    expect(empty).toBeTruthy()
    fireEvent.click(empty)
    // Phase 6: the empty slot now opens the chooser instead of silently adding a tag.
    expect(screen.getByText('What goes here?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Add a Tag/ }))
    expect(screen.getByDisplayValue('deluxetags.tag.tag')).toBeInTheDocument()
  })

  it('opens and closes the settings modal', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Settings'))
    expect(screen.getByText('Use MiniMessage')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Use MiniMessage')).not.toBeInTheDocument()
  })

  it('opens the import modal', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Import YAML'))
    expect(screen.getByText('Import config.yml')).toBeInTheDocument()
  })

  it('exposes the Phase 6 editor controls on a tag', () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    expect(screen.getByText('Data Value')).toBeInTheDocument()
    expect(screen.getByText('Preview Lock')).toBeInTheDocument()
    expect(screen.getByText('Advanced (resource pack)')).toBeInTheDocument()
  })

  it('exposes the Phase 6 settings (custom permissions, version, locked tags)', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Settings'))
    expect(screen.getByText('Custom (per tag)')).toBeInTheDocument()
    expect(screen.getByText('Show locked tags')).toBeInTheDocument()
    expect(screen.getByText('Minecraft version (textures)')).toBeInTheDocument()
  })

  it('duplicates a tag from the clone button (Phase 7)', () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    fireEvent.click(screen.getByTitle(/Duplicate tag/))
    expect(container.querySelector('[data-id="example_copy"]')).toBeTruthy()
  })

  it('duplicates a tag with the Ctrl+D shortcut (Phase 7)', () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    fireEvent.keyDown(document, { key: 'd', ctrlKey: true })
    expect(container.querySelector('[data-id="example_copy"]')).toBeTruthy()
  })

  it('adds a preset pack from the Tag Generator (Phase 4)', () => {
    render(<App />)
    const builder = () => (window as unknown as { DeluxeTagsBuilder: { getState(): { config: { deluxetags: object } } } }).DeluxeTagsBuilder
    const tagCount = () => Object.keys(builder().getState().config.deluxetags).length
    expect(tagCount()).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(screen.getByText('Tag Generator')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Preset packs' }))
    fireEvent.click(screen.getAllByRole('button', { name: /Add 4 tags/ })[0])
    expect(tagCount()).toBe(5)
  })
})
