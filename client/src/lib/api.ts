import type { Status, Tier } from './commissions'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Carries the HTTP status so callers can tell "wrong code" (400) from "slow down" (429).
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }
  const payload = (response.headers.get('content-type') || '').includes('application/json')
    ? await response.json()
    : { message: await response.text() }
  if (!response.ok) throw new ApiError(response.status, payload.message || 'Request failed.')
  return payload as T
}

export type PublicStatus = {
  id: string
  title: string
  status: Status
  updatedAt: string
  cancellationReason: string | null
  payment: { priceCents: number; deadline: string; ref: string; kofiUrl: string } | null
}

export type CommissionInput = {
  title: string
  description: string
  tier: Tier
  email: string
  code: string
  files: File[]
}

export function requestVerificationCode(email: string): Promise<{ message: string }> {
  return request('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

// `idempotencyKey` must stay the same across retries of one submission, so a request that
// succeeded but whose response was lost returns the same tracking ID instead of a duplicate.
export function submitCommission(input: CommissionInput, idempotencyKey: string): Promise<{ trackingId: string; ref: string }> {
  const form = new FormData()
  form.append('title', input.title)
  form.append('description', input.description)
  form.append('tier', input.tier)
  form.append('email', input.email)
  form.append('code', input.code)
  for (const file of input.files) form.append('files', file)
  return request('/api/commissions', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: form,
  })
}

export function getCommissionStatus(trackingId: string): Promise<PublicStatus> {
  return request(`/api/commissions/${encodeURIComponent(trackingId)}`)
}

export function getDownloadLinks(trackingId: string): Promise<{ files: { name: string; url: string }[] }> {
  return request(`/api/commissions/${encodeURIComponent(trackingId)}/download`)
}

// ── admin (every call carries the logged-in admin's supabase access token) ───────

export type AdminCommission = {
  id: string
  ref: string
  email: string
  title: string
  description: string
  tier: Tier
  status: Status
  priceCents: number | null
  paymentDeadline: string | null
  paidAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  overdue: boolean
  fileCount?: number
}

export type AdminFile = { id: string; name: string; url: string | null; uploadedAt: string }
export type AdminFiles = { reference: AdminFile[]; final: AdminFile[] }
export type AdminCommissionDetail = AdminCommission & { files: AdminFiles }

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  // loaded on demand so the supabase client only ships to people who open the admin console
  const { accessToken } = await import('./supabase')
  const token = await accessToken()
  if (!token) throw new ApiError(401, 'Sign in to use the admin console.')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return request<T>(`/api/admin${path}`, { ...init, headers })
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

export const admin = {
  list: () => adminRequest<{ commissions: AdminCommission[] }>('/commissions'),
  get: (id: string) => adminRequest<AdminCommissionDetail>(`/commissions/${id}`),
  approve: (id: string, priceCents: number) => adminRequest<AdminCommission>(`/commissions/${id}/approve`, json('PATCH', { priceCents })),
  reject: (id: string, reason: string) => adminRequest<AdminCommission>(`/commissions/${id}/reject`, json('PATCH', { reason })),
  markPaid: (id: string) => adminRequest<AdminCommission>(`/commissions/${id}/mark-paid`, json('PATCH')),
  expire: (id: string) => adminRequest<AdminCommission>(`/commissions/${id}/expire`, json('PATCH')),
  complete: (id: string) => adminRequest<AdminCommission>(`/commissions/${id}/complete`, json('PATCH')),
  // one file per request keeps each upload small for the server (see server/src/middleware/upload.js)
  uploadFinal: (id: string, file: File) => {
    const form = new FormData()
    form.append('files', file)
    return adminRequest<{ files: AdminFiles }>(`/commissions/${id}/files`, { method: 'POST', body: form })
  },
  deleteFinal: (id: string, fileId: string) => adminRequest<{ files: AdminFiles }>(`/commissions/${id}/files/${fileId}`, { method: 'DELETE' }),
}
