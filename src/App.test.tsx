import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App scaffold', () => {
  it('renders the scaffold shell with the nav label', () => {
    render(<App />)
    expect(screen.getByText('Config Builder')).toBeInTheDocument()
  })
})
