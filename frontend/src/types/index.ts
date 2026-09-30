/**
 * AegisFlow Centralized TypeScript Type Definitions.
 * Strictly synchronized with backend Pydantic schemas.
 */

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ActionType = 'ALLOW' | 'FLAG' | 'BLOCK' | 'REDACT_AND_ALLOW'
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'BLOCKED' | 'REJECTED'
export type AgentDecision = 'APPROVE' | 'FLAG' | 'REJECT' | 'BLOCKED'

export interface Transaction {
  id: string
  user_id: string
  source_currency: string
  destination_currency: string
  amount: number
  exchange_rate: number
  destination_amount: number
  destination_country: string
  route: string
  status: TransactionStatus
  risk_score: number
  decision_reason?: string | null
  execution_latency_ms: number
  created_at: string
}

export interface TransactionListResponse {
  total: number
  items: Transaction[]
}

export interface TransactionCreateRequest {
  user_id: string
  source_currency: string
  destination_currency: string
  amount: number
  destination_country: string
  route?: string
  user_prompt?: string
}

export interface SecurityEvent {
  id: string
  transaction_id?: string | null
  agent_id: string
  event_type: string
  severity: SeverityLevel
  risk_score: number
  confidence: number
  source: string
  description: string
  action: ActionType
  action_taken?: string
  payload_snippet?: string | null
  created_at: string
  timestamp?: string
  details?: Record<string, any>
}

export interface SecurityEventListResponse {
  total: number
  items: SecurityEvent[]
  events?: SecurityEvent[]
}

export interface Alert {
  id: string
  security_event_id: string
  severity: SeverityLevel
  title: string
  description: string
  message?: string
  alert_type?: string
  agent_id?: string
  is_resolved: boolean
  resolved_at?: string | null
  resolved_by?: string | null
  created_at: string
  timestamp?: string
}

export interface AlertListResponse {
  total: number
  active_count: number
  items: Alert[]
  alerts?: Alert[]
}

export interface AlertResolveRequest {
  resolved_by?: string
  resolution_notes?: string
}

export interface RiskSignal {
  detector: string
  is_threat: boolean
  risk_score: number
  severity: SeverityLevel
  confidence: number
  technique?: string | null
  targeted_control?: string | null
  explanation: string
  metadata?: Record<string, any>
}

export interface UnifiedRiskAssessment {
  risk_score: number
  risk_level: SeverityLevel
  recommended_action: ActionType
  signals: RiskSignal[]
  masked_output?: string | null
  summary_explanation: string
}

export interface SecurityScanResponse {
  timestamp: string
  unified_assessment: UnifiedRiskAssessment
  security_event_ids: string[]
}

export interface PromptScanResult {
  prompt: string
  is_threat: boolean
  risk_score: number
  risk_level: SeverityLevel
  recommended_action: ActionType
  signals: RiskSignal[]
}

export interface ResponseScanFinding {
  card_scheme?: string
  masked_pan?: string
  raw_match?: string
}

export interface ResponseScanResult {
  sensitive_data_detected: boolean
  has_dlp_violations?: boolean
  data_types: string[]
  action: string
  original_length: number
  masked_response: string
  redacted_text?: string
  severity: SeverityLevel
  details: string[] | Record<string, any>
  findings?: ResponseScanFinding[]
}

export interface AgentDecisionResponse {
  transaction_id: string
  session_id?: string | null
  turn_index?: number | null
  source_currency: string
  destination_currency: string
  amount: number
  exchange_rate: number
  destination_country: string
  route: string
  decision: AgentDecision
  reason: string
  agent_risk_score: number
  raw_response: string
  tool_calls?: Array<{ tool: string; args: any; result: any }> | null
  execution_latency_ms: number
}

export interface ConversationTurn {
  turn_index: number
  user_prompt: string
  agent_response: string
  risk_score: number
  recommended_action: string
  timestamp: string
}

export interface SessionSummary {
  session_id: string
  user_id: string
  total_turns?: number
  turns_count?: number
  total_violations?: number
  violations_count?: number
  session_locked?: boolean
  is_locked?: boolean
  lock_reason?: string | null
  avg_risk_score: number
  created_at: string
}

export interface SessionDetail {
  session_id: string
  user_id: string
  total_turns?: number
  turns_count?: number
  total_violations?: number
  violations_count?: number
  session_locked?: boolean
  is_locked?: boolean
  lock_reason?: string | null
  avg_risk_score: number
  created_at: string
  turns: ConversationTurn[]
}

export interface OverviewSummary {
  total_transactions: number
  approved_transactions: number
  flagged_transactions: number
  blocked_transactions: number
  blocked_requests?: number
  active_alerts: number
  critical_alerts: number
  average_risk_score: number
  data_leakage_events_count: number
  agent_health_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  drift_score: number
  system_uptime_seconds: number
}

export interface ThreatFeedItem {
  timestamp: string
  event_id: string
  threat_type: string
  severity: SeverityLevel
  confidence: number
  risk_score?: number
  action: string
  explanation: string
  source: string
}

export interface DriftFeatureReport {
  feature_name: string
  baseline_value: number
  current_window_value: number
  drift_metric: string
  drift_score: number
  is_drifted: boolean
}

export interface DriftAnalyticsResponse {
  drift_detected: boolean
  overall_drift_score: number
  ks_statistic?: number
  p_value?: number
  wasserstein_distance?: number
  sample_size_current?: number
  drift_status?: string
  recommendation?: string
  severity: SeverityLevel
  affected_features: string[]
  features_detail: DriftFeatureReport[]
  sample_window_size: number
  analyzed_at: string
}

export interface AgentBehaviorMetric {
  metric_name: string
  baseline_mean: number
  baseline_std: number
  current_value: number
  deviation_z_score: number
  status: 'NORMAL' | 'WARNING' | 'DRIFT_DETECTED'
}

export interface AgentBehaviorStats {
  agent_id: string
  total_decisions?: number
  total_evaluated_requests?: number
  approval_rate?: number
  rejection_rate?: number
  approvals_count?: number
  rejections_count?: number
  avg_latency_ms?: number
  latency_ms_avg?: number
  latency_ms_p95?: number
  amount_min?: number
  amount_avg?: number
  amount_median?: number
  amount_p95?: number
  amount_p99?: number
  amount_max?: number
  currency_distribution?: Record<string, number>
  avg_risk_score?: number
  metrics: AgentBehaviorMetric[]
}

export interface ModelStatusItem {
  model_name: string
  version: string
  dataset_name: string
  status: string
  metrics: Record<string, any>
  threshold: number
  trained_at: string
}

export interface SystemStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  version: string
  environment: string
  database_connected: boolean
  ai_provider_status: string
  models_loaded: number
  uptime_seconds: number
}

export type SystemHealth = SystemStatus

export interface SimulationRunResult {
  simulation_id: string
  scenario_type: string
  total_scenarios: number
  approved_count: number
  flagged_count: number
  blocked_count: number
  alerts_triggered_approx: number
  execution_duration_ms: number
  samples_preview: Array<{
    transaction_id: string
    scenario_type: string
    category: string
    amount: number
    currency_pair: string
    risk_score: number
    action: string
    status: string
  }>
}

export interface WebSocketEventMessage {
  type: string
  event_id?: string
  timestamp?: string
  transaction_id?: string
  event_type?: string
  severity?: SeverityLevel
  risk_score?: number
  confidence?: number
  source?: string
  description?: string
  action?: ActionType
  alert_id?: string
  message?: string
}
