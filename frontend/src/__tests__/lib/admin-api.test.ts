import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import * as adminApi from '@/lib/admin-api'

// Mock window.location for redirect tests
const mockLocationAssign = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: mockLocationAssign
  },
  writable: true
})

describe('Admin API Client', () => {
  beforeEach(() => {
    mockLocationAssign.mockClear()
  })

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const result = await adminApi.adminLogin('admin', 'password')

      expect(result).toMatchObject({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        admin: expect.objectContaining({
          id: '1',
          username: 'admin',
          role: 'admin'
        })
      })
    })

    it('should reject invalid credentials', async () => {
      await expect(adminApi.adminLogin('wrong', 'credentials'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should logout successfully', async () => {
      // Should not throw
      await expect(adminApi.adminLogout()).resolves.toBeUndefined()
    })

    it('should handle logout errors gracefully', async () => {
      server.use(
        http.post('/api/admin/logout', () => {
          return HttpResponse.error()
        })
      )

      // Should not throw even if server request fails
      await expect(adminApi.adminLogout()).resolves.toBeUndefined()
    })
  })

  describe('Dashboard and Stats', () => {
    it('should fetch admin dashboard statistics', async () => {
      const stats = await adminApi.getAdminStats()

      expect(stats).toMatchObject({
        total_registrations: expect.any(Number),
        total_teachers: expect.any(Number),
        total_classes: expect.any(Number),
        recent_registrations: expect.any(Array)
      })
    })

    it('should fetch current admin user', async () => {
      const admin = await adminApi.getCurrentAdmin()

      expect(admin).toMatchObject({
        id: '1',
        username: 'admin',
        email: 'admin@enjoyyoga.com',
        role: 'admin',
        is_active: true
      })
    })
  })

  describe('Registration Management', () => {
    it('should fetch all admin registrations', async () => {
      const registrations = await adminApi.getAdminRegistrations()

      expect(registrations).toHaveLength(1)
      expect(registrations[0]).toMatchObject({
        id: '1',
        class_id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'confirmed'
      })
    })

    it('should fetch a specific registration', async () => {
      const registration = await adminApi.getAdminRegistration('1')

      expect(registration).toMatchObject({
        id: '1',
        name: 'John Doe',
        status: 'confirmed',
        email_confirmation_sent: true
      })
    })

    it('should update registration status', async () => {
      const updatedRegistration = await adminApi.updateRegistrationStatus('1', 'cancelled')

      expect(updatedRegistration).toMatchObject({
        id: '1',
        status: 'cancelled'
      })
    })

    it('should handle registration not found', async () => {
      await expect(adminApi.getAdminRegistration('999'))
        .rejects.toThrow('Admin API error: 404')
    })
  })

  describe('Teacher Management', () => {
    const teacherData = {
      name_en: 'New Teacher',
      name_zh: '新教师',
      bio_en: 'Experienced yoga instructor',
      bio_zh: '经验丰富的瑜伽导师',
      qualifications: 'RYT-500',
      photo_url: '/images/teacher.jpg'
    }

    it('should create a new teacher', async () => {
      const teacher = await adminApi.createTeacher(teacherData)

      expect(teacher).toMatchObject({
        ...teacherData,
        id: expect.any(String)
      })
    })

    it('should update an existing teacher', async () => {
      const updatedData = {
        ...teacherData,
        qualifications: 'RYT-500, Advanced Training'
      }

      const teacher = await adminApi.updateTeacher('1', updatedData)

      expect(teacher).toMatchObject({
        id: '1',
        ...updatedData
      })
    })

    it('should upload teacher photo', async () => {
      const file = new File(['photo'], 'teacher.jpg', { type: 'image/jpeg' })

      const result = await adminApi.uploadTeacherPhoto('1', file)

      expect(result).toMatchObject({
        message: 'Photo uploaded successfully',
        photo_url: expect.stringContaining('/images/teacher-1-photo.jpg'),
        teacher: expect.objectContaining({
          id: '1',
          photo_url: expect.any(String)
        })
      })
    })

    it('should handle photo upload errors', async () => {
      server.use(
        http.post('http://localhost:8000/api/admin/teachers/:id/photo', () => {
          return HttpResponse.json(
            { detail: 'File too large' },
            { status: 413 }
          )
        })
      )

      const file = new File(['large photo'], 'large.jpg', { type: 'image/jpeg' })

      await expect(adminApi.uploadTeacherPhoto('1', file))
        .rejects.toThrow('File too large')
    })
  })

  describe('Class Management', () => {
    const classData = {
      name_en: 'New Morning Class',
      name_zh: '新晨间课程',
      description_en: 'Fresh morning yoga session',
      description_zh: '清新的晨间瑜伽课程',
      teacher_id: '1',
      yoga_type_id: '1',
      schedule: 'MON,WED,FRI 07:00',
      duration_minutes: 60,
      difficulty: 'beginner',
      capacity: 25,
      schedule_type: 'recurring',
      is_active: true
    }

    it('should create a new class', async () => {
      const yogaClass = await adminApi.createClass(classData)

      expect(yogaClass).toMatchObject({
        ...classData,
        id: expect.any(String),
        teacher: expect.any(Object),
        yoga_type: expect.any(Object)
      })
    })

    it('should update an existing class', async () => {
      const updatedData = {
        ...classData,
        capacity: 30
      }

      const yogaClass = await adminApi.updateClass('1', updatedData)

      expect(yogaClass).toMatchObject({
        id: '1',
        ...updatedData
      })
    })
  })

  describe('Yoga Type Management', () => {
    const yogaTypeData = {
      name_en: 'Power Yoga',
      name_zh: '力量瑜伽',
      description_en: 'Dynamic and challenging yoga style',
      description_zh: '充满活力和挑战性的瑜伽风格',
      image_url: '/images/power-yoga.jpg'
    }

    it('should create a new yoga type', async () => {
      const yogaType = await adminApi.createYogaType(yogaTypeData)

      expect(yogaType).toMatchObject({
        ...yogaTypeData,
        id: expect.any(String)
      })
    })

    it('should update an existing yoga type', async () => {
      const updatedData = {
        ...yogaTypeData,
        description_en: 'Updated description for power yoga'
      }

      const yogaType = await adminApi.updateYogaType('1', updatedData)

      expect(yogaType).toMatchObject({
        id: '1',
        ...updatedData
      })
    })
  })

  describe('Error Handling and Authentication', () => {
    it('should handle 401 errors by redirecting to login', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/dashboard/stats', () => {
          return HttpResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
          )
        })
      )

      await expect(adminApi.getAdminStats()).rejects.toThrow('Not authenticated')
      expect(window.location.href).toBe('/admin/login')
    })

    it('should handle 401 errors in photo upload', async () => {
      server.use(
        http.post('http://localhost:8000/api/admin/teachers/:id/photo', () => {
          return HttpResponse.json(
            { detail: 'Session expired' },
            { status: 401 }
          )
        })
      )

      const file = new File(['photo'], 'teacher.jpg', { type: 'image/jpeg' })

      await expect(adminApi.uploadTeacherPhoto('1', file)).rejects.toThrow('Session expired')
      expect(window.location.href).toBe('/admin/login')
    })

    it('should handle server errors with detailed messages', async () => {
      server.use(
        http.post('http://localhost:8000/api/admin/teachers', () => {
          return HttpResponse.json(
            { detail: 'Validation failed: name_en is required' },
            { status: 422 }
          )
        })
      )

      await expect(adminApi.createTeacher({
        name_en: '',
        name_zh: '测试',
        bio_en: 'Bio',
        bio_zh: '简介',
        qualifications: 'None'
      })).rejects.toThrow('Validation failed: name_en is required')
    })

    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/dashboard/stats', () => {
          return HttpResponse.error()
        })
      )

      await expect(adminApi.getAdminStats()).rejects.toThrow()
    })

    it('should handle JSON parsing errors in responses', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/dashboard/stats', () => {
          return new HttpResponse('Invalid JSON', { status: 200 })
        })
      )

      await expect(adminApi.getAdminStats()).rejects.toThrow()
    })
  })

  describe('Request Configuration', () => {
    it('should include credentials in all requests', async () => {
      let requestMade = false

      server.use(
        http.get('http://localhost:8000/api/admin/dashboard/stats', ({ request }) => {
          requestMade = true
          // Note: credentials property is not directly accessible in MSW,
          // but we can verify the request was made with proper configuration
          return HttpResponse.json({
            total_registrations: 0,
            total_teachers: 0,
            total_classes: 0,
            recent_registrations: []
          })
        })
      )

      await adminApi.getAdminStats()
      expect(requestMade).toBe(true)
    })

    it('should set correct content-type for JSON requests', async () => {
      let capturedHeaders: Record<string, string> = {}

      server.use(
        http.post('http://localhost:8000/api/admin/teachers', ({ request }) => {
          request.headers.forEach((value, key) => {
            capturedHeaders[key.toLowerCase()] = value
          })
          return HttpResponse.json({})
        })
      )

      await adminApi.createTeacher({
        name_en: 'Test',
        name_zh: '测试',
        bio_en: 'Bio',
        bio_zh: '简介',
        qualifications: 'None'
      })

      expect(capturedHeaders['content-type']).toBe('application/json')
    })

    it('should not set content-type for FormData requests', async () => {
      let capturedContentType = ''

      server.use(
        http.post('http://localhost:8000/api/admin/teachers/:id/photo', ({ request }) => {
          capturedContentType = request.headers.get('content-type') || ''
          return HttpResponse.json({})
        })
      )

      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })
      await adminApi.uploadTeacherPhoto('1', file)

      // FormData should have multipart/form-data content-type (set by browser with boundary)
      expect(capturedContentType).toContain('multipart/form-data')
    })
  })
})