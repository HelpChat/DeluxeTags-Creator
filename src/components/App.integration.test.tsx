import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  })

  it('does not expose unsupported advanced resource-pack fields', () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    expect(screen.queryByText('Advanced (resource pack)')).not.toBeInTheDocument()
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

  it('hides page placeholders when editing a tag (Item 5)', () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    // each field toolbar has a placeholder button now; open the first one before asserting on chips
    fireEvent.click(screen.getAllByRole('button', { name: 'Insert a placeholder' })[0])
    // a general placeholder is present, but the page-only ones are hidden on a tag
    expect(screen.getByText('Player')).toBeInTheDocument()
    expect(screen.queryByText('Next page')).not.toBeInTheDocument()
    expect(screen.queryByText('Current page')).not.toBeInTheDocument()
  })

  it('shows the Tags / Categories view switcher (Item 3)', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Tags' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument()
  })

  it('confirms before deleting a tag, and deletes on confirm (Item 8)', async () => {
    const { container } = render(<App />)
    // need more than one tag, since the last tag cannot be deleted
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    fireEvent.click(screen.getByTitle(/Duplicate tag/))
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)

    fireEvent.click(screen.getByTitle('Delete tag'))
    // the confirm dialog appears rather than deleting immediately
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Delete tag?')).toBeInTheDocument()
    expect(container.querySelector('[data-id="example"]')).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(container.querySelector('[data-id="example"]')).toBeNull())
  })

  it('cancels a tag deletion without removing it (Item 8)', async () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    fireEvent.click(screen.getByTitle(/Duplicate tag/))
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)

    fireEvent.click(screen.getByTitle('Delete tag'))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Delete tag?')).not.toBeInTheDocument())
    expect(container.querySelector('[data-id="example"]')).toBeTruthy()
  })

  it('confirms before a bulk delete and removes on confirm (Item 8)', async () => {
    const { container } = render(<App />)
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    fireEvent.click(screen.getByTitle(/Duplicate tag/)) // example + example_copy
    // a single click marks the copy, enabling the bulk island Delete
    fireEvent.click(container.querySelector('[data-id="example_copy"]') as HTMLElement)

    fireEvent.click(screen.getByRole('button', { name: 'Delete' })) // bulk island (not the dialog yet)
    const dialog = await screen.findByRole('alertdialog')
    expect(container.querySelector('[data-id="example_copy"]')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(container.querySelector('[data-id="example_copy"]')).toBeNull())
  })

  it('assigns a static item slot by clicking the grid (interactive slots)', () => {
    const { container } = render(<App />)
    const guiSlots = () =>
      (window as unknown as { DeluxeTagsBuilder: { getState(): { config: { gui: Record<string, { slots?: string[] }> } } } })
        .DeluxeTagsBuilder.getState().config.gui.exit_item.slots
    // select the exit button, then enter grid slot-picking mode
    fireEvent.click(container.querySelector('[data-id="exit_item"]') as HTMLElement)
    fireEvent.click(screen.getByRole('button', { name: 'Pick on grid' }))
    // slot 46 is empty in the default button row; clicking it assigns the item there
    const empty = container.querySelector('[data-slot="46"][data-empty="true"]') as HTMLElement
    expect(empty).toBeTruthy()
    fireEvent.click(empty)
    expect(guiSlots()).toContain('46')
    // clicking the now-assigned slot removes it again
    fireEvent.click(container.querySelector('[data-slot="46"]') as HTMLElement)
    expect(guiSlots()).not.toContain('46')
  })

  it('toggles placeholder resolution from the nav Placeholders switch', () => {
    render(<App />)
    const getState = () =>
      (window as unknown as { DeluxeTagsBuilder: { getState(): { preview: { resolvePlaceholders: boolean } } } }).DeluxeTagsBuilder.getState()
    expect(getState().preview.resolvePlaceholders).not.toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Placeholders' }))
    expect(getState().preview.resolvePlaceholders).toBe(false)
  })

  it('changes the preview category from the custom dropdown', () => {
    render(<App />)
    const getState = () =>
      (window as unknown as { DeluxeTagsBuilder: { getState(): { preview: { category: string } } } }).DeluxeTagsBuilder.getState()
    fireEvent.click(screen.getByRole('button', { name: 'Preview category' }))
    fireEvent.click(screen.getByRole('option', { name: 'general' }))
    expect(getState().preview.category).toBe('general')
  })

  it('toggles a styled field between parsed and raw source editing', () => {
    const { container } = render(<App />)
    const getRaw = () =>
      (window as unknown as { DeluxeTagsBuilder: { getState(): { config: { deluxetags: Record<string, { tag: string }> } } } })
        .DeluxeTagsBuilder.getState().config.deluxetags.example.tag
    fireEvent.click(container.querySelector('[data-id="example"]') as HTMLElement)
    const section = screen.getByText('Tag Text').closest('.ctx-section') as HTMLElement
    fireEvent.click(within(section).getByRole('button', { name: 'Raw' }))
    const rawInput = section.querySelector('.raw-editor') as HTMLInputElement
    expect(rawInput).toBeTruthy()
    // the raw box shows the literal source (tags/codes), not the rendered text
    expect(/[<&]/.test(rawInput.value)).toBe(true)
    fireEvent.change(rawInput, { target: { value: '<red>Hi</red>' } })
    expect(getRaw()).toBe('<red>Hi</red>')
    fireEvent.click(within(section).getByRole('button', { name: 'Parsed' }))
    expect(section.querySelector('.raw-editor')).toBeFalsy()
    expect(section.querySelector('.styled-editor')).toBeTruthy()
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
