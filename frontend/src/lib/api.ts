const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export interface YogaType {
  id: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  image_url: string | null;
  created_at: string;
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

export interface YogaClass {
  id: string;
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
  created_at: string;
  teacher: Teacher;
  yoga_type: YogaType;
}

export interface Registration {
  id: string;
  class_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

export interface RegistrationWithSchedule extends Registration {
  target_date: string | null;
  target_time: string | null;
  status: string;
}

export interface AvailableDate {
  date_time: string;
  formatted_date: string;
  formatted_time: string;
  available_spots: number;
}

export function getClasses() {
  return fetchAPI<YogaClass[]>("/api/classes");
}

export function getClass(id: string) {
  return fetchAPI<YogaClass>(`/api/classes/${id}`);
}

export function getClassesByTeacher(teacherId: string) {
  return fetchAPI<YogaClass[]>(`/api/classes/teacher/${teacherId}`);
}

export function getTeachers() {
  return fetchAPI<Teacher[]>("/api/teachers");
}

export function getTeacher(id: string) {
  return fetchAPI<Teacher>(`/api/teachers/${id}`);
}

export function getYogaTypes() {
  return fetchAPI<YogaType[]>("/api/yoga-types");
}

export async function createRegistration(data: {
  class_id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}): Promise<Registration> {
  const res = await fetch(`${API_BASE}/api/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function createRegistrationWithSchedule(data: {
  class_id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  target_date?: string;
  target_time?: string;
  preferred_language?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
}): Promise<RegistrationWithSchedule> {
  const res = await fetch(`${API_BASE}/api/registrations/with-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getAvailableDates(
  classId: string,
  fromDate?: string,
  limit?: number
): Promise<AvailableDate[]> {
  const params = new URLSearchParams();
  if (fromDate) params.append('from_date', fromDate);
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = `/api/registrations/classes/${classId}/available-dates${queryString ? `?${queryString}` : ''}`;

  return fetchAPI<AvailableDate[]>(url);
}

// Contact Inquiry interfaces and functions
export interface InquiryReply {
  id: string;
  inquiry_id: string;
  admin_id: string;
  subject: string;
  message: string;
  email_status: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  category: string;
  status: string;
  preferred_language: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  replies?: InquiryReply[];
}

export interface ContactInquirySummary {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  status: string;
  preferred_language: string;
  created_at: string;
}

export async function createContactInquiry(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  preferred_language?: string;
}): Promise<ContactInquiry> {
  const res = await fetch(`${API_BASE}/api/contact/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// Admin functions for managing contact inquiries
export async function getContactInquiries(
  status?: string,
  category?: string,
  limit: number = 50,
  offset: number = 0
): Promise<ContactInquirySummary[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (category) params.append('category', category);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const queryString = params.toString();
  const url = `/api/admin/contact/inquiries${queryString ? `?${queryString}` : ''}`;

  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function getContactInquiry(inquiryId: string): Promise<ContactInquiry> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/admin/contact/inquiries/${inquiryId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function updateContactInquiry(
  inquiryId: string,
  data: { status?: string; admin_notes?: string }
): Promise<ContactInquiry> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/admin/contact/inquiries/${inquiryId}`, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getContactInquiryStats(): Promise<{
  total_inquiries: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
}> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/admin/contact/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function createInquiryReply(
  inquiryId: string,
  data: {
    subject: string;
    message: string;
  }
): Promise<InquiryReply> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}/api/admin/contact/inquiries/${inquiryId}/replies`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${res.status}`);
  }
  return res.json();
}
