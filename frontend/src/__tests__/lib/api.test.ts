import { describe, it, expect, beforeEach, vi } from 'vitest'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import * as api from '@/lib/api'

// Mock localStorage for admin token
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('API Client', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue('mock-admin-token')
  })

  describe('Classes API', () => {
    it('should fetch all classes', async () => {
      const classes = await api.getClasses()

      expect(classes).toHaveLength(2)
      expect(classes[0]).toMatchObject({
        id: '1',
        name_en: 'Morning Hatha',
        name_zh: '晨间哈他',
        teacher_id: '1',
        yoga_type_id: '1'
      })
    })

    it('should fetch a specific class', async () => {
      const yogaClass = await api.getClass('1')

      expect(yogaClass).toMatchObject({
        id: '1',
        name_en: 'Morning Hatha',
        teacher: expect.objectContaining({
          name_en: 'Sarah Johnson'
        }),
        yoga_type: expect.objectContaining({
          name_en: 'Hatha Yoga'
        })
      })
    })

    it('should handle class not found', async () => {
      await expect(api.getClass('999')).rejects.toThrow('API error: 404')
    })

    it('should fetch classes by teacher', async () => {
      const classes = await api.getClassesByTeacher('1')

      expect(classes).toHaveLength(1)
      expect(classes[0].teacher_id).toBe('1')
    })
  })

  describe('Teachers API', () => {
    it('should fetch all teachers', async () => {
      const teachers = await api.getTeachers()

      expect(teachers).toHaveLength(2)
      expect(teachers[0]).toMatchObject({
        id: '1',
        name_en: 'Sarah Johnson',
        name_zh: '莎拉·约翰逊'
      })
    })

    it('should fetch a specific teacher', async () => {
      const teacher = await api.getTeacher('1')

      expect(teacher).toMatchObject({
        id: '1',
        name_en: 'Sarah Johnson',
        qualifications: 'RYT-500, Yoga Alliance Certified'
      })
    })

    it('should handle teacher not found', async () => {
      await expect(api.getTeacher('999')).rejects.toThrow('API error: 404')
    })
  })

  describe('Yoga Types API', () => {
    it('should fetch all yoga types', async () => {
      const yogaTypes = await api.getYogaTypes()

      expect(yogaTypes).toHaveLength(2)
      expect(yogaTypes[0]).toMatchObject({
        id: '1',
        name_en: 'Hatha Yoga',
        name_zh: '哈他瑜伽'
      })
    })
  })

  describe('Registration API', () => {
    it('should create a basic registration', async () => {
      const registrationData = {
        class_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        message: 'Test message'
      }

      const registration = await api.createRegistration(registrationData)

      expect(registration).toMatchObject({
        ...registrationData,
        id: expect.any(String)
      })
    })

    it('should create a registration with schedule', async () => {
      const registrationData = {
        class_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        target_date: '2024-01-22',
        target_time: '08:00',
        preferred_language: 'en',
        email_notifications: true
      }

      const registration = await api.createRegistrationWithSchedule(registrationData)

      expect(registration).toMatchObject({
        ...registrationData,
        id: expect.any(String),
        status: 'confirmed',
        email_confirmation_sent: true
      })
    })

    it('should handle registration errors', async () => {
      server.use(
        http.post('http://localhost:8000/api/registrations', () => {
          return HttpResponse.json(
            { detail: 'Class is full' },
            { status: 400 }
          )
        })
      )

      const registrationData = {
        class_id: '1',
        name: 'Test User',
        email: 'test@example.com'
      }

      await expect(api.createRegistration(registrationData)).rejects.toThrow('API error: 400')
    })

    it('should fetch available dates for a class', async () => {
      const availableDates = await api.getAvailableDates('1', '2024-01-22', 5)

      expect(availableDates).toHaveLength(2)
      expect(availableDates[0]).toMatchObject({
        formatted_date: '2024-01-22',
        formatted_time: '08:00',
        available_spots: expect.any(Number)
      })
    })

    it('should build correct query parameters for available dates', async () => {
      let capturedUrl = ''
      server.use(
        http.get('http://localhost:8000/api/registrations/classes/:classId/available-dates', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json([])
        })
      )

      await api.getAvailableDates('1', '2024-01-22', 10)

      expect(capturedUrl).toContain('from_date=2024-01-22')
      expect(capturedUrl).toContain('limit=10')
    })
  })

  describe('Contact Inquiry API', () => {
    it('should create a contact inquiry', async () => {
      const inquiryData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        subject: 'Question about classes',
        message: 'I have a question about your yoga classes',
        category: 'general',
        preferred_language: 'en'
      }

      const inquiry = await api.createContactInquiry(inquiryData)

      expect(inquiry).toMatchObject({
        ...inquiryData,
        id: expect.any(String),
        status: 'open'
      })
    })

    it('should handle contact inquiry errors', async () => {
      server.use(
        http.post('http://localhost:8000/api/contact/inquiries', () => {
          return HttpResponse.json(
            { detail: 'Invalid email format' },
            { status: 400 }
          )
        })
      )

      const inquiryData = {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Test message',
        category: 'general'
      }

      await expect(api.createContactInquiry(inquiryData)).rejects.toThrow('Invalid email format')
    })
  })

  describe('Admin Contact Inquiry API', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue('mock-admin-token')
    })

    it('should fetch contact inquiries with filters', async () => {
      const inquiries = await api.getContactInquiries('open', 'scheduling', 20, 0)

      expect(inquiries).toHaveLength(1)
      expect(inquiries[0]).toMatchObject({
        id: '1',
        status: 'open',
        category: 'scheduling'
      })
    })

    it('should fetch a specific contact inquiry', async () => {
      const inquiry = await api.getContactInquiry('1')

      expect(inquiry).toMatchObject({
        id: '1',
        name: 'Jane Smith',
        email: 'jane@example.com',
        replies: expect.any(Array)
      })
    })

    it('should update a contact inquiry', async () => {
      const updateData = {
        status: 'in_progress',
        admin_notes: 'Following up with customer'
      }

      const inquiry = await api.updateContactInquiry('1', updateData)

      expect(inquiry).toMatchObject({
        id: '1',
        ...updateData
      })
    })

    it('should fetch contact inquiry statistics', async () => {
      const stats = await api.getContactInquiryStats()

      expect(stats).toMatchObject({
        total_inquiries: expect.any(Number),
        by_status: expect.any(Object),
        by_category: expect.any(Object)
      })
      expect(stats.by_status).toHaveProperty('open')
      expect(stats.by_category).toHaveProperty('scheduling')
    })

    it('should create an inquiry reply', async () => {
      const replyData = {
        subject: 'Re: Question about classes',
        message: 'Thank you for your inquiry. Here is the information you requested.'
      }

      const reply = await api.createInquiryReply('1', replyData)

      expect(reply).toMatchObject({
        ...replyData,
        id: expect.any(String),
        inquiry_id: '1',
        email_status: 'sent'
      })
    })

    it('should handle unauthorized requests for admin endpoints', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      server.use(
        http.get('http://localhost:8000/api/admin/contact/inquiries', () => {
          return HttpResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
          )
        })
      )

      await expect(api.getContactInquiries()).rejects.toThrow('API error: 401')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('http://localhost:8000/api/classes', () => {
          return HttpResponse.error()
        })
      )

      await expect(api.getClasses()).rejects.toThrow()
    })

    it('should handle JSON parsing errors', async () => {
      server.use(
        http.get('http://localhost:8000/api/classes', () => {
          return new HttpResponse('Invalid JSON', { status: 200 })
        })
      )

      await expect(api.getClasses()).rejects.toThrow()
    })

    it('should handle server errors with status codes', async () => {
      server.use(
        http.get('http://localhost:8000/api/classes', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      await expect(api.getClasses()).rejects.toThrow('API error: 500')
    })
  })

  describe('Request Headers and Authentication', () => {
    it('should include admin token in authorization header for admin endpoints', async () => {
      let capturedHeaders: Record<string, string> = {}

      server.use(
        http.get('http://localhost:8000/api/admin/contact/inquiries', ({ request }) => {
          request.headers.forEach((value, key) => {
            capturedHeaders[key.toLowerCase()] = value
          })
          return HttpResponse.json([])
        })
      )

      await api.getContactInquiries()

      expect(capturedHeaders.authorization).toBe('Bearer mock-admin-token')
      expect(capturedHeaders['content-type']).toBe('application/json')
    })

    it('should include correct content-type for POST requests', async () => {
      let capturedHeaders: Record<string, string> = {}

      server.use(
        http.post('http://localhost:8000/api/registrations', ({ request }) => {
          request.headers.forEach((value, key) => {
            capturedHeaders[key.toLowerCase()] = value
          })
          return HttpResponse.json({})
        })
      )

      await api.createRegistration({
        class_id: '1',
        name: 'Test',
        email: 'test@example.com'
      })

      expect(capturedHeaders['content-type']).toBe('application/json')
    })
  })
})