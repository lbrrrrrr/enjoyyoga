import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})

// Mock IntersectionObserver (often needed for modern UI components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver (often needed for modern UI components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia (often needed for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock window.alert, confirm, prompt
global.alert = () => {}
global.confirm = () => true
global.prompt = () => ''