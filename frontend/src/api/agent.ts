import { api } from './client'
import type {
  AgentDecisionResponse,
  SessionDetail,
  SessionSummary,
} from '@/types'

export const agentApi = {
  evaluate: (data: {
    user_prompt: string
    user_id?: string
    session_id?: string
    context_metadata?: Record<string, any>
  }) => api.post<AgentDecisionResponse>('/api/v1/agent/evaluate', data),

  listSessions: (limit = 50) =>
    api.get<SessionSummary[]>('/api/v1/sessions', { limit }),

  getSessionDetail: (sessionId: string) =>
    api.get<SessionDetail>(`/api/v1/sessions/${sessionId}`),

  resetSession: (sessionId: string) =>
    api.post<SessionDetail>(`/api/v1/sessions/${sessionId}/reset`),
}
