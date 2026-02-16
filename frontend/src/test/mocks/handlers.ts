import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8000'

// Mock data
const mockYogaTypes = [
  {
    id: '1',
    name_en: 'Hatha Yoga',
    name_zh: '哈他瑜伽',
    description_en: 'A gentle form of yoga focused on basic postures',
    description_zh: '专注于基本体式的温和瑜伽形式',
    image_url: '/images/hatha.jpg',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name_en: 'Vinyasa Yoga',
    name_zh: '流瑜伽',
    description_en: 'Dynamic yoga with flowing movements',
    description_zh: '充满活力的流动瑜伽',
    image_url: '/images/vinyasa.jpg',
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockTeachers = [
  {
    id: '1',
    name_en: 'Sarah Johnson',
    name_zh: '莎拉·约翰逊',
    bio_en: 'Experienced yoga instructor with 10 years of practice',
    bio_zh: '拥有10年练习经验的资深瑜伽导师',
    qualifications: 'RYT-500, Yoga Alliance Certified',
    photo_url: '/images/sarah.jpg',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name_en: 'Michael Chen',
    name_zh: '迈克尔·陈',
    bio_en: 'Mindful yoga practitioner focused on meditation',
    bio_zh: '专注于冥想的正念瑜伽练习者',
    qualifications: 'RYT-200, Meditation Teacher',
    photo_url: '/images/michael.jpg',
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockClasses = [
  {
    id: '1',
    name_en: 'Morning Hatha',
    name_zh: '晨间哈他',
    description_en: 'Gentle morning yoga to start your day',
    description_zh: '温和的晨间瑜伽，开启美好一天',
    teacher_id: '1',
    yoga_type_id: '1',
    schedule: 'MON,WED,FRI 08:00',
    duration_minutes: 60,
    difficulty: 'beginner',
    capacity: 20,
    created_at: '2024-01-01T00:00:00Z',
    teacher: mockTeachers[0],
    yoga_type: mockYogaTypes[0]
  },
  {
    id: '2',
    name_en: 'Evening Flow',
    name_zh: '晚间流瑜伽',
    description_en: 'Relaxing vinyasa flow for the evening',
    description_zh: '放松的晚间流瑜伽',
    teacher_id: '2',
    yoga_type_id: '2',
    schedule: 'TUE,THU 19:00',
    duration_minutes: 75,
    difficulty: 'intermediate',
    capacity: 15,
    created_at: '2024-01-01T00:00:00Z',
    teacher: mockTeachers[1],
    yoga_type: mockYogaTypes[1]
  }
]

const mockRegistrations = [
  {
    id: '1',
    class_id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'Looking forward to the class!',
    created_at: '2024-01-15T00:00:00Z',
    target_date: '2024-01-22',
    target_time: '08:00',
    status: 'confirmed',
    email_confirmation_sent: true,
    reminder_sent: false,
    preferred_language: 'en',
    email_notifications: true,
    sms_notifications: false
  }
]

const mockContactInquiries = [
  {
    id: '1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    subject: 'Class Scheduling Question',
    message: 'I have a question about the morning classes.',
    category: 'scheduling',
    status: 'open',
    preferred_language: 'en',
    admin_notes: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    replies: []
  }
]

const mockAdminUser = {
  id: '1',
  username: 'admin',
  email: 'admin@enjoyyoga.com',
  role: 'admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
}

const mockAvailableDates = [
  {
    date_time: '2024-01-22T08:00:00Z',
    formatted_date: '2024-01-22',
    formatted_time: '08:00',
    available_spots: 15
  },
  {
    date_time: '2024-01-24T08:00:00Z',
    formatted_date: '2024-01-24',
    formatted_time: '08:00',
    available_spots: 18
  }
]

export const handlers = [
  // Public API - Classes
  http.get(`${API_BASE}/api/classes`, () => {
    return HttpResponse.json(mockClasses)
  }),

  http.get(`${API_BASE}/api/classes/:id`, ({ params }) => {
    const { id } = params
    const yogaClass = mockClasses.find(c => c.id === id)
    if (!yogaClass) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(yogaClass)
  }),

  http.get(`${API_BASE}/api/classes/teacher/:teacherId`, ({ params }) => {
    const { teacherId } = params
    const classes = mockClasses.filter(c => c.teacher_id === teacherId)
    return HttpResponse.json(classes)
  }),

  // Public API - Teachers
  http.get(`${API_BASE}/api/teachers`, () => {
    return HttpResponse.json(mockTeachers)
  }),

  http.get(`${API_BASE}/api/teachers/:id`, ({ params }) => {
    const { id } = params
    const teacher = mockTeachers.find(t => t.id === id)
    if (!teacher) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(teacher)
  }),

  // Public API - Yoga Types
  http.get(`${API_BASE}/api/yoga-types`, () => {
    return HttpResponse.json(mockYogaTypes)
  }),

  // Public API - Registrations
  http.post(`${API_BASE}/api/registrations`, async ({ request }) => {
    const data = await request.json()
    const newRegistration = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }
    return HttpResponse.json(newRegistration, { status: 201 })
  }),

  http.post(`${API_BASE}/api/registrations/with-schedule`, async ({ request }) => {
    const data = await request.json()
    const newRegistration = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString(),
      status: 'confirmed',
      email_confirmation_sent: true,
      reminder_sent: false
    }
    return HttpResponse.json(newRegistration, { status: 201 })
  }),

  http.get(`${API_BASE}/api/registrations/classes/:classId/available-dates`, ({ params, request }) => {
    const { classId } = params
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')

    let dates = [...mockAvailableDates]
    if (limit) {
      dates = dates.slice(0, parseInt(limit))
    }

    return HttpResponse.json(dates)
  }),

  // Public API - Contact Inquiries
  http.post(`${API_BASE}/api/contact/inquiries`, async ({ request }) => {
    const data = await request.json()
    const newInquiry = {
      id: Date.now().toString(),
      ...data,
      status: 'open',
      admin_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      replies: []
    }
    return HttpResponse.json(newInquiry, { status: 201 })
  }),

  // Admin API - Authentication
  http.post(`${API_BASE}/api/admin/login`, async ({ request }) => {
    const { username, password } = await request.json()

    if (username === 'admin' && password === 'password') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        admin: mockAdminUser
      })
    }

    return new HttpResponse(
      JSON.stringify({ detail: 'Invalid credentials' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }),

  http.post(`${API_BASE}/api/admin/logout`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Admin API - Dashboard
  http.get(`${API_BASE}/api/admin/dashboard/stats`, () => {
    return HttpResponse.json({
      total_registrations: 150,
      total_teachers: 5,
      total_classes: 12,
      recent_registrations: mockRegistrations.slice(0, 5)
    })
  }),

  http.get(`${API_BASE}/api/admin/me`, () => {
    return HttpResponse.json(mockAdminUser)
  }),

  // Admin API - Registrations
  http.get(`${API_BASE}/api/admin/registrations`, () => {
    return HttpResponse.json(mockRegistrations)
  }),

  http.get(`${API_BASE}/api/admin/registrations/:id`, ({ params }) => {
    const { id } = params
    const registration = mockRegistrations.find(r => r.id === id)
    if (!registration) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(registration)
  }),

  http.put(`${API_BASE}/api/admin/registrations/:id/status`, async ({ params, request }) => {
    const { id } = params
    const { status } = await request.json()
    const registration = mockRegistrations.find(r => r.id === id)

    if (!registration) {
      return new HttpResponse(null, { status: 404 })
    }

    const updatedRegistration = { ...registration, status }
    return HttpResponse.json(updatedRegistration)
  }),

  // Admin API - Teachers
  http.post(`${API_BASE}/api/admin/teachers`, async ({ request }) => {
    const data = await request.json()
    const newTeacher = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }
    return HttpResponse.json(newTeacher, { status: 201 })
  }),

  http.put(`${API_BASE}/api/admin/teachers/:id`, async ({ params, request }) => {
    const { id } = params
    const data = await request.json()
    const updatedTeacher = {
      id,
      ...data,
      created_at: '2024-01-01T00:00:00Z'
    }
    return HttpResponse.json(updatedTeacher)
  }),

  http.post(`${API_BASE}/api/admin/teachers/:id/photo`, async ({ params }) => {
    const { id } = params
    const mockPhotoUrl = `/images/teacher-${id}-photo.jpg`

    return HttpResponse.json({
      message: 'Photo uploaded successfully',
      photo_url: mockPhotoUrl,
      teacher: {
        ...mockTeachers[0],
        id,
        photo_url: mockPhotoUrl
      }
    })
  }),

  // Admin API - Classes
  http.post(`${API_BASE}/api/admin/classes`, async ({ request }) => {
    const data = await request.json()
    const newClass = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString(),
      teacher: mockTeachers.find(t => t.id === data.teacher_id) || mockTeachers[0],
      yoga_type: mockYogaTypes.find(yt => yt.id === data.yoga_type_id) || mockYogaTypes[0]
    }
    return HttpResponse.json(newClass, { status: 201 })
  }),

  http.put(`${API_BASE}/api/admin/classes/:id`, async ({ params, request }) => {
    const { id } = params
    const data = await request.json()
    const updatedClass = {
      id,
      ...data,
      created_at: '2024-01-01T00:00:00Z',
      teacher: mockTeachers.find(t => t.id === data.teacher_id) || mockTeachers[0],
      yoga_type: mockYogaTypes.find(yt => yt.id === data.yoga_type_id) || mockYogaTypes[0]
    }
    return HttpResponse.json(updatedClass)
  }),

  // Admin API - Yoga Types
  http.post(`${API_BASE}/api/admin/yoga-types`, async ({ request }) => {
    const data = await request.json()
    const newYogaType = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }
    return HttpResponse.json(newYogaType, { status: 201 })
  }),

  http.put(`${API_BASE}/api/admin/yoga-types/:id`, async ({ params, request }) => {
    const { id } = params
    const data = await request.json()
    const updatedYogaType = {
      id,
      ...data,
      created_at: '2024-01-01T00:00:00Z'
    }
    return HttpResponse.json(updatedYogaType)
  }),

  // Admin API - Contact Inquiries
  http.get(`${API_BASE}/api/admin/contact/inquiries`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filteredInquiries = [...mockContactInquiries]

    if (status) {
      filteredInquiries = filteredInquiries.filter(i => i.status === status)
    }
    if (category) {
      filteredInquiries = filteredInquiries.filter(i => i.category === category)
    }

    const paginatedInquiries = filteredInquiries.slice(offset, offset + limit)
    return HttpResponse.json(paginatedInquiries)
  }),

  http.get(`${API_BASE}/api/admin/contact/inquiries/:id`, ({ params }) => {
    const { id } = params
    const inquiry = mockContactInquiries.find(i => i.id === id)
    if (!inquiry) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(inquiry)
  }),

  http.put(`${API_BASE}/api/admin/contact/inquiries/:id`, async ({ params, request }) => {
    const { id } = params
    const data = await request.json()
    const inquiry = mockContactInquiries.find(i => i.id === id)

    if (!inquiry) {
      return new HttpResponse(null, { status: 404 })
    }

    const updatedInquiry = {
      ...inquiry,
      ...data,
      updated_at: new Date().toISOString()
    }
    return HttpResponse.json(updatedInquiry)
  }),

  http.get(`${API_BASE}/api/admin/contact/stats`, () => {
    return HttpResponse.json({
      total_inquiries: 25,
      by_status: {
        open: 8,
        in_progress: 5,
        resolved: 10,
        closed: 2
      },
      by_category: {
        scheduling: 15,
        general: 7,
        business: 3
      }
    })
  }),

  http.post(`${API_BASE}/api/admin/contact/inquiries/:id/replies`, async ({ params, request }) => {
    const { id } = params
    const data = await request.json()

    const newReply = {
      id: Date.now().toString(),
      inquiry_id: id,
      admin_id: '1',
      subject: data.subject,
      message: data.message,
      email_status: 'sent',
      error_message: null,
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    }

    return HttpResponse.json(newReply, { status: 201 })
  }),

  // Public API - Payments
  http.get(`${API_BASE}/api/payments/status/:referenceNumber`, ({ params }) => {
    const { referenceNumber } = params
    if (referenceNumber === 'EY-20260216-NOTF') {
      return HttpResponse.json({ detail: 'Payment not found' }, { status: 404 })
    }
    const isVenmo = (referenceNumber as string).includes('VM')
    return HttpResponse.json({
      payment_id: 'pay-1',
      reference_number: referenceNumber,
      amount: isVenmo ? 15.0 : 100.0,
      currency: isVenmo ? 'USD' : 'CNY',
      status: 'pending',
      payment_method: isVenmo ? 'venmo_qr' : 'wechat_qr',
      wechat_qr_code_url: 'http://test.com/wechat_qr.png',
      payment_instructions_en: 'Pay via WeChat',
      payment_instructions_zh: '通过微信支付',
      venmo_qr_code_url: 'http://test.com/venmo_qr.png',
      venmo_payment_instructions_en: 'Pay via Venmo',
      venmo_payment_instructions_zh: '通过 Venmo 支付',
      created_at: '2024-01-15T00:00:00Z'
    })
  }),

  http.get(`${API_BASE}/api/payments/settings`, () => {
    return HttpResponse.json({
      id: 'settings-1',
      wechat_qr_code_url: 'http://test.com/wechat_qr.png',
      payment_instructions_en: 'Pay via WeChat',
      payment_instructions_zh: '通过微信支付',
      venmo_qr_code_url: 'http://test.com/venmo_qr.png',
      venmo_payment_instructions_en: 'Pay via Venmo',
      venmo_payment_instructions_zh: '通过 Venmo 支付',
      updated_at: '2024-01-15T00:00:00Z'
    })
  }),

  http.get(`${API_BASE}/api/payments/registration/:registrationId`, ({ params }) => {
    const { registrationId } = params
    if (registrationId === 'not-found') {
      return HttpResponse.json({ detail: 'Payment not found' }, { status: 404 })
    }
    return HttpResponse.json({
      payment_id: 'pay-reg-1',
      reference_number: 'EY-20260216-REG1',
      amount: 100.0,
      currency: 'CNY',
      status: 'pending',
      payment_method: 'wechat_qr',
      wechat_qr_code_url: 'http://test.com/wechat_qr.png',
      payment_instructions_en: 'Pay via WeChat',
      payment_instructions_zh: '通过微信支付',
      venmo_qr_code_url: null,
      venmo_payment_instructions_en: null,
      venmo_payment_instructions_zh: null,
      created_at: '2024-01-15T00:00:00Z'
    })
  }),

  // Admin API - Payments
  http.get(`${API_BASE}/api/admin/payments/stats`, () => {
    return HttpResponse.json({
      total_payments: 10,
      pending_payments: 3,
      confirmed_payments: 5,
      cancelled_payments: 2,
      total_revenue: 575.0,
      total_revenue_cny: 500.0,
      total_revenue_usd: 75.0
    })
  }),

  http.get(`${API_BASE}/api/admin/payments/pending`, () => {
    return HttpResponse.json([
      {
        id: 'pay-p1',
        registration_id: 'reg-1',
        amount: 100.0,
        currency: 'CNY',
        payment_method: 'wechat_qr',
        status: 'pending',
        reference_number: 'EY-20260216-P001',
        payment_type: 'single_session',
        package_id: null,
        admin_notes: null,
        confirmed_by: null,
        confirmed_at: null,
        created_at: '2024-01-15T00:00:00Z'
      },
      {
        id: 'pay-p2',
        registration_id: 'reg-2',
        amount: 15.0,
        currency: 'USD',
        payment_method: 'venmo_qr',
        status: 'pending',
        reference_number: 'EY-20260216-P002',
        payment_type: 'single_session',
        package_id: null,
        admin_notes: null,
        confirmed_by: null,
        confirmed_at: null,
        created_at: '2024-01-15T00:00:00Z'
      }
    ])
  }),

  http.get(`${API_BASE}/api/admin/payments/:paymentId`, ({ params }) => {
    const { paymentId } = params
    if (paymentId === 'not-found') {
      return HttpResponse.json({ detail: 'Payment not found' }, { status: 404 })
    }
    return HttpResponse.json({
      id: paymentId,
      registration_id: 'reg-1',
      amount: 15.0,
      currency: 'USD',
      payment_method: 'venmo_qr',
      status: 'pending',
      reference_number: 'EY-20260216-DTL1',
      payment_type: 'single_session',
      package_id: null,
      admin_notes: null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: '2024-01-15T00:00:00Z'
    })
  }),

  http.get(`${API_BASE}/api/admin/payments`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const allPayments = [
      {
        id: 'pay-1',
        registration_id: 'reg-1',
        amount: 100.0,
        currency: 'CNY',
        payment_method: 'wechat_qr',
        status: 'pending',
        reference_number: 'EY-20260216-A001',
        payment_type: 'single_session',
        package_id: null,
        admin_notes: null,
        confirmed_by: null,
        confirmed_at: null,
        created_at: '2024-01-15T00:00:00Z'
      },
      {
        id: 'pay-2',
        registration_id: 'reg-2',
        amount: 25.0,
        currency: 'USD',
        payment_method: 'venmo_qr',
        status: 'confirmed',
        reference_number: 'EY-20260216-A002',
        payment_type: 'single_session',
        package_id: null,
        admin_notes: 'Verified',
        confirmed_by: '1',
        confirmed_at: '2024-01-16T00:00:00Z',
        created_at: '2024-01-15T00:00:00Z'
      }
    ]

    if (status) {
      return HttpResponse.json(allPayments.filter(p => p.status === status))
    }
    return HttpResponse.json(allPayments)
  }),

  http.post(`${API_BASE}/api/admin/payments/:paymentId/confirm`, async ({ params, request }) => {
    const { paymentId } = params
    const data = await request.json()
    return HttpResponse.json({
      id: paymentId,
      registration_id: 'reg-1',
      amount: 100.0,
      currency: 'CNY',
      payment_method: 'wechat_qr',
      status: 'confirmed',
      reference_number: 'EY-20260216-CONF',
      payment_type: 'single_session',
      package_id: null,
      admin_notes: (data as any).admin_notes || null,
      confirmed_by: '1',
      confirmed_at: new Date().toISOString(),
      created_at: '2024-01-15T00:00:00Z'
    })
  }),

  http.post(`${API_BASE}/api/admin/payments/:paymentId/cancel`, async ({ params, request }) => {
    const { paymentId } = params
    const data = await request.json()
    return HttpResponse.json({
      id: paymentId,
      registration_id: 'reg-1',
      amount: 15.0,
      currency: 'USD',
      payment_method: 'venmo_qr',
      status: 'cancelled',
      reference_number: 'EY-20260216-CANC',
      payment_type: 'single_session',
      package_id: null,
      admin_notes: (data as any).admin_notes || null,
      confirmed_by: null,
      confirmed_at: null,
      created_at: '2024-01-15T00:00:00Z'
    })
  }),

  // Admin API - Payment Settings
  http.get(`${API_BASE}/api/admin/payment-settings`, () => {
    return HttpResponse.json({
      id: 'settings-1',
      wechat_qr_code_url: 'http://test.com/wechat_qr.png',
      payment_instructions_en: 'Pay via WeChat',
      payment_instructions_zh: '通过微信支付',
      venmo_qr_code_url: 'http://test.com/venmo_qr.png',
      venmo_payment_instructions_en: 'Pay via Venmo',
      venmo_payment_instructions_zh: '通过 Venmo 支付',
      updated_at: '2024-01-15T00:00:00Z'
    })
  }),

  http.put(`${API_BASE}/api/admin/payment-settings`, async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      id: 'settings-1',
      wechat_qr_code_url: 'http://test.com/wechat_qr.png',
      payment_instructions_en: (data as any).payment_instructions_en || 'Pay via WeChat',
      payment_instructions_zh: (data as any).payment_instructions_zh || '通过微信支付',
      venmo_qr_code_url: 'http://test.com/venmo_qr.png',
      venmo_payment_instructions_en: (data as any).venmo_payment_instructions_en || 'Pay via Venmo',
      venmo_payment_instructions_zh: (data as any).venmo_payment_instructions_zh || '通过 Venmo 支付',
      updated_at: new Date().toISOString()
    })
  }),

  http.post(`${API_BASE}/api/admin/payment-settings/qr-code`, () => {
    return HttpResponse.json({
      message: 'QR code uploaded successfully',
      qr_code_url: 'http://test.com/wechat_qr_new.png',
      settings: {
        id: 'settings-1',
        wechat_qr_code_url: 'http://test.com/wechat_qr_new.png',
        payment_instructions_en: 'Pay via WeChat',
        payment_instructions_zh: '通过微信支付',
        venmo_qr_code_url: null,
        venmo_payment_instructions_en: null,
        venmo_payment_instructions_zh: null,
        updated_at: new Date().toISOString()
      }
    })
  }),

  http.post(`${API_BASE}/api/admin/payment-settings/venmo-qr-code`, () => {
    return HttpResponse.json({
      message: 'Venmo QR code uploaded successfully',
      qr_code_url: 'http://test.com/venmo_qr_new.png',
      settings: {
        id: 'settings-1',
        wechat_qr_code_url: null,
        payment_instructions_en: null,
        payment_instructions_zh: null,
        venmo_qr_code_url: 'http://test.com/venmo_qr_new.png',
        venmo_payment_instructions_en: null,
        venmo_payment_instructions_zh: null,
        updated_at: new Date().toISOString()
      }
    })
  }),

  // Admin API - Packages
  http.get(`${API_BASE}/api/admin/packages/:classId`, ({ params }) => {
    return HttpResponse.json([
      {
        id: 'pkg-1',
        class_id: params.classId,
        name_en: '5 Sessions',
        name_zh: '5节课',
        description_en: '5 session package',
        description_zh: '5节课套餐',
        session_count: 5,
        price: 400.0,
        price_usd: 60.0,
        currency: 'CNY',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.post(`${API_BASE}/api/admin/packages`, async ({ request }) => {
    const data = await request.json()
    return HttpResponse.json({
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }, { status: 201 })
  }),

  http.put(`${API_BASE}/api/admin/packages/:packageId`, async ({ params, request }) => {
    const { packageId } = params
    const data = await request.json()
    return HttpResponse.json({
      id: packageId,
      class_id: 'class-1',
      name_en: '5 Sessions',
      name_zh: '5节课',
      description_en: '',
      description_zh: '',
      session_count: 5,
      price: 400.0,
      price_usd: null,
      currency: 'CNY',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      ...data
    })
  })
]