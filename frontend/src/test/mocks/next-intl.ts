import { vi } from 'vitest'

/**
 * Mock next-intl hooks for testing
 */

export const mockUseTranslations = (messages: Record<string, any>) => {
  return vi.fn((key: string, params?: any) => {
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    if (typeof value === 'string' && params) {
      // Simple parameter replacement for testing
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] || match
      })
    }

    return typeof value === 'string' ? value : key
  })
}

export const mockUseLocale = (locale: 'en' | 'zh' = 'en') => {
  return vi.fn(() => locale)
}

export const mockUseFormatter = () => {
  return vi.fn(() => ({
    dateTime: (date: Date | string) => {
      const d = new Date(date)
      return d.toLocaleDateString()
    },
    number: (num: number) => num.toString(),
    relativeTime: (date: Date | string) => {
      return 'relative time'
    }
  }))
}

export const mockUseMessages = (messages: Record<string, any>) => {
  return vi.fn(() => messages)
}

/**
 * Mock the entire next-intl module
 */
export function mockNextIntl(locale: 'en' | 'zh' = 'en', messages: Record<string, any> = {}) {
  vi.mock('next-intl', () => ({
    useTranslations: mockUseTranslations(messages),
    useLocale: mockUseLocale(locale),
    useFormatter: mockUseFormatter(),
    useMessages: mockUseMessages(messages),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children
  }))
}

/**
 * Mock useRouter from next-intl/routing
 */
export const mockIntlRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  locale: 'en'
}

export function mockNextIntlRouting() {
  vi.mock('next-intl/routing', () => ({
    useRouter: () => mockIntlRouter,
    usePathname: () => '/',
    routing: {
      locales: ['en', 'zh'],
      defaultLocale: 'en'
    }
  }))
}