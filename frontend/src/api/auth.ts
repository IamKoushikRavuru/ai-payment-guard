import { api } from './client'

export interface UserResponse {
  id: string
  username: string
  email: string
  full_name?: string | null
  role: string
  status: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string
  role?: string
}

export interface LoginRequest {
  username_or_email: string
  password: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/api/v1/auth/login', data),

  getMe: () =>
    api.get<UserResponse>('/api/v1/auth/me'),

  logout: () =>
    api.post<{ status: string; message: string }>('/api/v1/auth/logout'),

  listUsers: () =>
    api.get<UserResponse[]>('/api/v1/auth/users'),
}
