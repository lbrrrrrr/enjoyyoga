const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAdminAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Include cookies in requests
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Session expired, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Admin API error: ${res.status}`);
  }
  return res.json();
}

// Interface definitions following existing pattern
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminToken {
  access_token: string;
  token_type: string;
  admin: AdminUser;
}

export interface AdminStats {
  total_registrations: number;
  total_teachers: number;
  total_classes: number;
  recent_registrations: any[];
  pending_payments: number;
  total_revenue: number;
  total_revenue_cny: number;
  total_revenue_usd: number;
}

export interface RegistrationWithSchedule {
  id: string;
  class_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  target_date: string | null;
  target_time: string | null;
  status: string;
  email_confirmation_sent: boolean;
  reminder_sent: boolean;
  preferred_language: string;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export async function adminLogin(username: string, password: string): Promise<AdminToken> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Login failed: ${res.status}`);
  }

  return res.json();
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    // Even if logout fails on server side, we still clear client side
    console.warn('Logout request failed:', error);
  }
}

export function getAdminStats(): Promise<AdminStats> {
  return fetchAdminAPI<AdminStats>('/api/admin/dashboard/stats');
}

export function getCurrentAdmin(): Promise<AdminUser> {
  return fetchAdminAPI<AdminUser>('/api/admin/me');
}

export function getAdminRegistrations(): Promise<RegistrationWithSchedule[]> {
  return fetchAdminAPI<RegistrationWithSchedule[]>('/api/admin/registrations');
}

export function getAdminRegistration(id: string): Promise<RegistrationWithSchedule> {
  return fetchAdminAPI<RegistrationWithSchedule>(`/api/admin/registrations/${id}`);
}

export function updateRegistrationStatus(id: string, status: string): Promise<RegistrationWithSchedule> {
  return fetchAdminAPI<RegistrationWithSchedule>(`/api/admin/registrations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export interface Teacher {
  id: string;
  name_en: string;
  name_zh: string;
  bio_en: string;
  bio_zh: string;
  qualifications: string;
  photo_url: string | null;
  created_at: string;
}

export function createTeacher(data: {
  name_en: string;
  name_zh: string;
  bio_en: string;
  bio_zh: string;
  qualifications: string;
  photo_url?: string | null;
}): Promise<Teacher> {
  return fetchAdminAPI<Teacher>('/api/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTeacher(
  id: string,
  data: {
    name_en: string;
    name_zh: string;
    bio_en: string;
    bio_zh: string;
    qualifications: string;
    photo_url?: string | null;
  }
): Promise<Teacher> {
  return fetchAdminAPI<Teacher>(`/api/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadTeacherPhoto(teacherId: string, file: File): Promise<{
  message: string;
  photo_url: string;
  teacher: Teacher;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/admin/teachers/${teacherId}/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Session expired, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Photo upload failed: ${res.status}`);
  }

  return res.json();
}

export interface YogaClassCreate {
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  teacher_id: string;
  yoga_type_id: string;
  schedule: string;
  duration_minutes: number;
  difficulty: string;
  capacity: number;
  location?: string | null;
  schedule_type?: string;
  is_active?: boolean;
  price?: number | null;
  price_usd?: number | null;
  currency?: string;
}

export function createClass(data: YogaClassCreate): Promise<any> {
  return fetchAdminAPI<any>('/api/admin/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateClass(id: string, data: YogaClassCreate): Promise<any> {
  return fetchAdminAPI<any>(`/api/admin/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export interface YogaTypeCreate {
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  image_url?: string | null;
}

export function createYogaType(data: YogaTypeCreate): Promise<any> {
  return fetchAdminAPI<any>('/api/admin/yoga-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateYogaType(id: string, data: YogaTypeCreate): Promise<any> {
  return fetchAdminAPI<any>(`/api/admin/yoga-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Payment interfaces and functions
export interface Payment {
  id: string;
  registration_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  reference_number: string;
  payment_type: string;
  package_id: string | null;
  admin_notes: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface PaymentStats {
  total_payments: number;
  pending_payments: number;
  confirmed_payments: number;
  cancelled_payments: number;
  total_revenue: number;
  total_revenue_cny: number;
  total_revenue_usd: number;
}

export interface PaymentSettingsAdmin {
  id: string;
  wechat_qr_code_url: string | null;
  payment_instructions_en: string | null;
  payment_instructions_zh: string | null;
  venmo_qr_code_url: string | null;
  venmo_payment_instructions_en: string | null;
  venmo_payment_instructions_zh: string | null;
  updated_at: string;
}

export interface ClassPackage {
  id: string;
  class_id: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  session_count: number;
  price: number;
  price_usd: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export function getAdminPayments(status?: string): Promise<Payment[]> {
  const params = status ? `?status=${status}` : '';
  return fetchAdminAPI<Payment[]>(`/api/admin/payments${params}`);
}

export function getPendingPayments(): Promise<Payment[]> {
  return fetchAdminAPI<Payment[]>('/api/admin/payments/pending');
}

export function getPaymentStats(): Promise<PaymentStats> {
  return fetchAdminAPI<PaymentStats>('/api/admin/payments/stats');
}

export function getPaymentDetail(paymentId: string): Promise<Payment> {
  return fetchAdminAPI<Payment>(`/api/admin/payments/${paymentId}`);
}

export function confirmPayment(paymentId: string, adminNotes?: string): Promise<Payment> {
  return fetchAdminAPI<Payment>(`/api/admin/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes }),
  });
}

export function cancelPayment(paymentId: string, adminNotes?: string): Promise<Payment> {
  return fetchAdminAPI<Payment>(`/api/admin/payments/${paymentId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ admin_notes: adminNotes }),
  });
}

export function getPaymentSettingsAdmin(): Promise<PaymentSettingsAdmin> {
  return fetchAdminAPI<PaymentSettingsAdmin>('/api/admin/payment-settings');
}

export function updatePaymentSettings(data: {
  payment_instructions_en?: string;
  payment_instructions_zh?: string;
  venmo_payment_instructions_en?: string;
  venmo_payment_instructions_zh?: string;
}): Promise<PaymentSettingsAdmin> {
  return fetchAdminAPI<PaymentSettingsAdmin>('/api/admin/payment-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadWechatQrCode(file: File): Promise<{
  message: string;
  qr_code_url: string;
  settings: PaymentSettingsAdmin;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/admin/payment-settings/qr-code`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `QR code upload failed: ${res.status}`);
  }

  return res.json();
}

export async function uploadVenmoQrCode(file: File): Promise<{
  message: string;
  qr_code_url: string;
  settings: PaymentSettingsAdmin;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/admin/payment-settings/venmo-qr-code`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Venmo QR code upload failed: ${res.status}`);
  }

  return res.json();
}

export function getPackagesForClass(classId: string): Promise<ClassPackage[]> {
  return fetchAdminAPI<ClassPackage[]>(`/api/admin/packages/${classId}`);
}

export function createPackage(data: {
  class_id: string;
  name_en: string;
  name_zh: string;
  description_en?: string;
  description_zh?: string;
  session_count: number;
  price: number;
  price_usd?: number | null;
  currency?: string;
  is_active?: boolean;
}): Promise<ClassPackage> {
  return fetchAdminAPI<ClassPackage>('/api/admin/packages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePackage(packageId: string, data: {
  name_en?: string;
  name_zh?: string;
  description_en?: string;
  description_zh?: string;
  session_count?: number;
  price?: number;
  price_usd?: number | null;
  currency?: string;
  is_active?: boolean;
}): Promise<ClassPackage> {
  return fetchAdminAPI<ClassPackage>(`/api/admin/packages/${packageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Consent admin interfaces and functions
export interface ConsentListItem {
  id: string;
  email: string;
  name: string;
  yoga_type_id: string;
  yoga_type_name_en: string | null;
  yoga_type_name_zh: string | null;
  consent_text_version: string;
  signed_at: string;
}

export interface ConsentStats {
  total: number;
  by_yoga_type: {
    yoga_type_id: string;
    name_en: string;
    name_zh: string;
    count: number;
  }[];
}

export function getAdminConsents(
  email?: string,
  yogaTypeId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<ConsentListItem[]> {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  if (yogaTypeId) params.append("yoga_type_id", yogaTypeId);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  return fetchAdminAPI<ConsentListItem[]>(`/api/admin/consent/consents?${params.toString()}`);
}

export function getAdminConsentStats(): Promise<ConsentStats> {
  return fetchAdminAPI<ConsentStats>('/api/admin/consent/stats');
}