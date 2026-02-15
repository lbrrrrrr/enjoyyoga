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
