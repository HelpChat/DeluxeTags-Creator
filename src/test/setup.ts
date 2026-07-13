import '@testing-library/jest-dom'
import { afterEach } from 'vitest'

// The app now autosaves to localStorage; clear it between tests so persisted
// state from one test never leaks into the next.
afterEach(() => {
  localStorage.clear()
})
