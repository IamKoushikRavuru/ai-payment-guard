import { api } from './client'
import type { SystemStatus } from '@/types'

export const systemApi = {
  getHealth: () =>
    api.get<{ status: string; service: string; version: string }>('/health'),

  getStatus: () =>
    api.get<SystemStatus>('/api/v1/system/status'),
}
