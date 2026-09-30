import { api } from './client'
import type {
  Transaction,
  TransactionCreateRequest,
  TransactionListResponse,
} from '@/types'

export const transactionsApi = {
  create: (data: TransactionCreateRequest) =>
    api.post<Transaction>('/api/v1/transactions', data),

  list: (params?: { limit?: number; offset?: number }) =>
    api.get<TransactionListResponse>('/api/v1/transactions', params),

  getById: (id: string) =>
    api.get<Transaction>(`/api/v1/transactions/${id}`),
}
