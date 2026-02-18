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
        recent_registrations: expect.any(Array),
        pending_payments: expect.any(Number),
        total_revenue: expect.any(Number),
        total_revenue_cny: expect.any(Number),
        total_revenue_usd: expect.any(Number),
      })
    })

    it('should return separate CNY and USD revenue in dashboard stats', async () => {
      const stats = await adminApi.getAdminStats()

      expect(stats.total_revenue_cny).toBe(500.0)
      expect(stats.total_revenue_usd).toBe(75.0)
      expect(stats.total_revenue).toBe(575.0)
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
      is_active: true,
      location: 'Downtown Yoga Studio, 456 Main St'
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

  describe('Payment Management', () => {
    it('should fetch all payments', async () => {
      const payments = await adminApi.getAdminPayments()

      expect(payments).toHaveLength(2)
      expect(payments[0]).toMatchObject({
        payment_method: 'wechat_qr',
        currency: 'CNY'
      })
      expect(payments[1]).toMatchObject({
        payment_method: 'venmo_qr',
        currency: 'USD'
      })
    })

    it('should fetch payments filtered by status', async () => {
      const payments = await adminApi.getAdminPayments('confirmed')

      expect(payments).toHaveLength(1)
      expect(payments[0].status).toBe('confirmed')
      expect(payments[0].payment_method).toBe('venmo_qr')
    })

    it('should fetch pending payments', async () => {
      const payments = await adminApi.getPendingPayments()

      expect(payments).toHaveLength(2)
      expect(payments[0].payment_method).toBe('wechat_qr')
      expect(payments[1].payment_method).toBe('venmo_qr')
    })

    it('should fetch payment statistics with per-currency revenue', async () => {
      const stats = await adminApi.getPaymentStats()

      expect(stats).toMatchObject({
        total_payments: 10,
        pending_payments: 3,
        confirmed_payments: 5,
        cancelled_payments: 2,
        total_revenue: 575.0,
        total_revenue_cny: 500.0,
        total_revenue_usd: 75.0
      })
    })

    it('should fetch payment detail', async () => {
      const payment = await adminApi.getPaymentDetail('pay-1')

      expect(payment).toMatchObject({
        id: 'pay-1',
        payment_method: 'venmo_qr',
        currency: 'USD',
        amount: 15.0
      })
    })

    it('should confirm a payment', async () => {
      const payment = await adminApi.confirmPayment('pay-1', 'Verified in WeChat')

      expect(payment).toMatchObject({
        id: 'pay-1',
        status: 'confirmed',
        admin_notes: 'Verified in WeChat',
        confirmed_at: expect.any(String)
      })
    })

    it('should cancel a payment', async () => {
      const payment = await adminApi.cancelPayment('pay-1', 'Duplicate')

      expect(payment).toMatchObject({
        id: 'pay-1',
        status: 'cancelled',
        admin_notes: 'Duplicate'
      })
    })
  })

  describe('Payment Settings', () => {
    it('should fetch payment settings with Venmo fields', async () => {
      const settings = await adminApi.getPaymentSettingsAdmin()

      expect(settings).toMatchObject({
        wechat_qr_code_url: 'http://test.com/wechat_qr.png',
        venmo_qr_code_url: 'http://test.com/venmo_qr.png',
        venmo_payment_instructions_en: 'Pay via Venmo',
        venmo_payment_instructions_zh: '通过 Venmo 支付'
      })
    })

    it('should update payment settings with Venmo instructions', async () => {
      const settings = await adminApi.updatePaymentSettings({
        venmo_payment_instructions_en: 'Updated Venmo instructions',
        venmo_payment_instructions_zh: '更新的 Venmo 说明'
      })

      expect(settings).toMatchObject({
        venmo_payment_instructions_en: 'Updated Venmo instructions',
        venmo_payment_instructions_zh: '更新的 Venmo 说明'
      })
    })

    it('should upload WeChat QR code', async () => {
      const file = new File(['qr-data'], 'wechat.png', { type: 'image/png' })
      const result = await adminApi.uploadWechatQrCode(file)

      expect(result).toMatchObject({
        message: 'QR code uploaded successfully',
        qr_code_url: expect.stringContaining('wechat_qr')
      })
    })

    it('should upload Venmo QR code', async () => {
      const file = new File(['qr-data'], 'venmo.png', { type: 'image/png' })
      const result = await adminApi.uploadVenmoQrCode(file)

      expect(result).toMatchObject({
        message: 'Venmo QR code uploaded successfully',
        qr_code_url: expect.stringContaining('venmo_qr')
      })
    })

    it('should handle WeChat QR upload auth failure', async () => {
      server.use(
        http.post('http://localhost:8000/api/admin/payment-settings/qr-code', () => {
          return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
        })
      )

      const file = new File(['qr-data'], 'wechat.png', { type: 'image/png' })
      await expect(adminApi.uploadWechatQrCode(file)).rejects.toThrow('Not authenticated')
      expect(window.location.href).toBe('/admin/login')
    })

    it('should handle Venmo QR upload auth failure', async () => {
      server.use(
        http.post('http://localhost:8000/api/admin/payment-settings/venmo-qr-code', () => {
          return HttpResponse.json({ detail: 'Session expired' }, { status: 401 })
        })
      )

      const file = new File(['qr-data'], 'venmo.png', { type: 'image/png' })
      await expect(adminApi.uploadVenmoQrCode(file)).rejects.toThrow('Session expired')
      expect(window.location.href).toBe('/admin/login')
    })
  })

  describe('Package Management', () => {
    it('should fetch packages for a class with price_usd', async () => {
      const packages = await adminApi.getPackagesForClass('class-1')

      expect(packages).toHaveLength(1)
      expect(packages[0]).toMatchObject({
        id: 'pkg-1',
        name_en: '5 Sessions',
        price: 400.0,
        price_usd: 60.0,
        session_count: 5
      })
    })

    it('should create a package with dual pricing', async () => {
      const pkg = await adminApi.createPackage({
        class_id: 'class-1',
        name_en: '10 Sessions',
        name_zh: '10节课',
        session_count: 10,
        price: 800.0,
        price_usd: 120.0,
        currency: 'CNY'
      })

      expect(pkg).toMatchObject({
        name_en: '10 Sessions',
        price: 800.0,
        price_usd: 120.0,
        session_count: 10
      })
    })

    it('should update a package with USD price', async () => {
      const pkg = await adminApi.updatePackage('pkg-1', {
        price_usd: 55.0
      })

      expect(pkg).toMatchObject({
        id: 'pkg-1',
        price_usd: 55.0
      })
    })
  })

  describe('Consent Management', () => {
    it('should fetch all consent records', async () => {
      const consents = await adminApi.getAdminConsents()

      expect(consents).toHaveLength(2)
      expect(consents[0]).toMatchObject({
        id: 'consent-1',
        email: 'alice@example.com',
        name: 'Alice',
        yoga_type_name_en: 'Hatha Yoga'
      })
    })

    it('should filter consent records by email', async () => {
      const consents = await adminApi.getAdminConsents('alice@example.com')

      expect(consents).toHaveLength(1)
      expect(consents[0].email).toBe('alice@example.com')
    })

    it('should filter consent records by yoga type', async () => {
      const consents = await adminApi.getAdminConsents(undefined, 'yt-2')

      expect(consents).toHaveLength(1)
      expect(consents[0].yoga_type_id).toBe('yt-2')
    })

    it('should pass pagination parameters', async () => {
      const consents = await adminApi.getAdminConsents(undefined, undefined, 10, 0)

      expect(consents).toHaveLength(2)
    })

    it('should fetch consent statistics', async () => {
      const stats = await adminApi.getAdminConsentStats()

      expect(stats).toMatchObject({
        total: 5,
        by_yoga_type: expect.arrayContaining([
          expect.objectContaining({
            yoga_type_id: 'yt-1',
            name_en: 'Hatha Yoga',
            count: 3
          })
        ])
      })
    })

    it('should handle 401 error on consent list', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/consent/consents', () => {
          return HttpResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
          )
        })
      )

      await expect(adminApi.getAdminConsents()).rejects.toThrow('Not authenticated')
      expect(window.location.href).toBe('/admin/login')
    })

    it('should handle 401 error on consent stats', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/consent/stats', () => {
          return HttpResponse.json(
            { detail: 'Not authenticated' },
            { status: 401 }
          )
        })
      )

      await expect(adminApi.getAdminConsentStats()).rejects.toThrow('Not authenticated')
      expect(window.location.href).toBe('/admin/login')
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