/**
 * Authentication utilities for testing
 */

export const mockAdminSession = {
  id: '1',
  username: 'admin',
  email: 'admin@enjoyyoga.com',
  role: 'admin'
}

export const mockAdminToken = 'mock-jwt-token'

/**
 * Mock localStorage for admin token storage
 */
export function setMockAdminToken() {
  const mockStorage = {
    getItem: (key: string) => {
      if (key === 'admin_token') {
        return mockAdminToken
      }
      return null
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  }

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  })
}

/**
 * Mock document.cookie for admin session
 */
export function setMockAdminCookie() {
  const adminUserCookie = btoa(JSON.stringify(mockAdminSession))

  Object.defineProperty(document, 'cookie', {
    value: `admin_user=${adminUserCookie}; Path=/; HttpOnly; Secure; SameSite=Strict`,
    writable: true
  })
}

/**
 * Clear mock authentication
 */
export function clearMockAuth() {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    },
    writable: true
  })

  Object.defineProperty(document, 'cookie', {
    value: '',
    writable: true
  })
}