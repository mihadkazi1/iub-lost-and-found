import type { BoardStats, CampusItem, ItemDraft, LoginResponse, Student } from './types'

const TOKEN_KEY = 'iub-lost-found-token'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function normalizeItem(item: CampusItem): CampusItem {
  if (!item.image_url || /^https?:\/\//i.test(item.image_url)) return item
  return { ...item, image_url: `${API_BASE_URL}${item.image_url}` }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'Something went wrong. Please try again.'
    throw new Error(detail)
  }
  return data as T
}

export function signIn(
  studentId: string,
  fullName: string,
  phoneNumber: string,
  whatsappNumber: string,
  extraContactInfo: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber || null,
      extra_contact_info: extraContactInfo || null,
    }),
  })
}

export function getMe(): Promise<Student> {
  return request<Student>('/api/auth/me')
}

export async function signOut(): Promise<void> {
  try {
    await request<void>('/api/auth/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

export function getStats(): Promise<BoardStats> {
  return request<BoardStats>('/api/stats')
}

export function getItems(filters: { q?: string; category?: string; reportType?: string; status?: string }): Promise<CampusItem[]> {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.category && filters.category !== 'All items') params.set('category', filters.category)
  if (filters.reportType && filters.reportType !== 'all') params.set('report_type', filters.reportType)
  if (filters.status) params.set('status', filters.status)
  const query = params.toString()
  return request<CampusItem[]>(`/api/items${query ? `?${query}` : ''}`).then((items) => items.map(normalizeItem))
}

export function getItem(id: number): Promise<CampusItem> {
  return request<CampusItem>(`/api/items/${id}`).then(normalizeItem)
}

export function createItem(draft: ItemDraft): Promise<CampusItem> {
  return request<CampusItem>('/api/items', {
    method: 'POST',
    body: JSON.stringify({ ...draft, incident_date: draft.incident_date || null }),
  }).then(normalizeItem)
}

export function updateItem(id: number, draft: ItemDraft): Promise<CampusItem> {
  return request<CampusItem>(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...draft, incident_date: draft.incident_date || null }),
  }).then(normalizeItem)
}

export function updateStatus(id: number, status: 'open' | 'resolved'): Promise<CampusItem> {
  return request<CampusItem>(`/api/items/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }).then(normalizeItem)
}

export function getContact(id: number): Promise<{
  reporter_name: string
  phone_number: string | null
  whatsapp_number: string | null
  extra_contact_info: string | null
  contact_info: string
}> {
  return request<{
    reporter_name: string
    phone_number: string | null
    whatsapp_number: string | null
    extra_contact_info: string | null
    contact_info: string
  }>(`/api/items/${id}/contact`)
}

export function deleteItem(id: number): Promise<void> {
  return request<void>(`/api/items/${id}`, { method: 'DELETE' })
}
