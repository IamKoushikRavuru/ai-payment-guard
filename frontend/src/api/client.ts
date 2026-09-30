/**
 * Centralized API Client for AegisFlow Backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, public data: any, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    })

    if (!res.ok) {
      let errorData: any
      try {
        errorData = await res.json()
      } catch {
        errorData = await res.text()
      }
      throw new ApiError(
        res.status,
        errorData,
        typeof errorData === 'object' && errorData.detail
          ? errorData.detail
          : `HTTP error ${res.status}: ${res.statusText}`
      )
    }

    if (res.status === 204) {
      return {} as T
    }

    return (await res.json()) as T
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err
    }
    throw new ApiError(0, null, err.message || 'Network error: Backend server unreachable.')
  }
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    let query = ''
    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val))
        }
      }
      const qs = searchParams.toString()
      if (qs) {
        query = `?${qs}`
      }
    }
    return request<T>(`${endpoint}${query}`, { method: 'GET' })
  },
  post: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),
}
