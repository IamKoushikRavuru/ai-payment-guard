import { api } from './client'
import type {
  AgentBehaviorStats,
  DriftAnalyticsResponse,
  ModelStatusItem,
  OverviewSummary,
  ThreatFeedItem,
} from '@/types'

export const analyticsApi = {
  getOverviewSummary: () =>
    api.get<OverviewSummary>('/api/v1/analytics/summary'),

  getThreatFeed: (limit = 20) =>
    api.get<ThreatFeedItem[]>('/api/v1/analytics/risk', { limit }),

  getDriftAnalytics: () =>
    api.get<DriftAnalyticsResponse>('/api/v1/analytics/drift'),

  getAgentBehavior: () =>
    api.get<AgentBehaviorStats>('/api/v1/analytics/agent-behavior'),

  getModelsStatus: () =>
    api.get<ModelStatusItem[]>('/api/v1/models/status'),
}
