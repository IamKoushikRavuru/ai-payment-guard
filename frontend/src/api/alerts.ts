import { api } from './client'
import type { Alert, AlertListResponse, AlertResolveRequest } from '@/types'

export const alertsApi = {
  list: (params?: { limit?: number; offset?: number; is_resolved?: boolean }) =>
    api.get<AlertListResponse>('/api/v1/alerts', params),

  resolve: (id: string, data: AlertResolveRequest) =>
    api.post<Alert>(`/api/v1/alerts/${id}/resolve`, data),
}
