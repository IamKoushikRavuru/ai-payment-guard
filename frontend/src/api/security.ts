import { api } from './client'
import type {
  PromptScanResult,
  ResponseScanResult,
  SecurityEvent,
  SecurityEventListResponse,
  SecurityScanResponse,
} from '@/types'

export const securityApi = {
  scanFull: (data: {
    prompt: string
    proposed_transaction?: Record<string, any>
    agent_response?: string
    user_id?: string
  }) => api.post<SecurityScanResponse>('/api/v1/security/scan', data),

  scanPrompt: (prompt: string, userId = 'usr_analyst') =>
    api.post<PromptScanResult>('/api/v1/security/scan-prompt', {
      prompt,
      user_id: userId,
    }),

  scanResponse: (responseText: string) =>
    api.post<ResponseScanResult>('/api/v1/security/scan-response', {
      response_text: responseText,
    }),

  listEvents: (params?: { limit?: number; offset?: number; severity?: string }) =>
    api.get<SecurityEventListResponse>('/api/v1/security/events', params),

  getEventById: (id: string) =>
    api.get<SecurityEvent>(`/api/v1/security/events/${id}`),
}
