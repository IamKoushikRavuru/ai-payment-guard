import { api } from './client'
import type { SimulationRunResult } from '@/types'

export const simulationApi = {
  run: (data: {
    scenario_type?: 'mixed' | 'normal' | 'adversarial' | 'red_team'
    count?: number
    random_seed?: number
  }) => api.post<SimulationRunResult>('/api/v1/simulation/run', data),
}
