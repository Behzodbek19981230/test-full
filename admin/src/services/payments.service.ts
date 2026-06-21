import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface Payment {
  id: number
  user: { full_name: string; username: string; telegram_id: number }
  subject_name: string
  question_count: number
  mode: string
  amount: number
  screenshot_file_id: string
  status: string
  admin_note: string
  created_at: string
}

interface PaymentsResponse {
  payments: Payment[]
  total: number
}

interface PaymentsParams {
  status: string
  page: number
  per_page?: number
}

export const paymentKeys = {
  all: (params: PaymentsParams) => ['payments', params] as const,
}

export function usePayments(params: PaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.all(params),
    queryFn: async () => {
      const { data } = await api.get<PaymentsResponse>('/payments', {
        params: { status: params.status, page: params.page, per_page: params.per_page || 20 },
      })
      return data
    },
  })
}

export function useApprovePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      await api.put(`/payments/${id}/approve`, { note })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}

export function useRejectPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      await api.put(`/payments/${id}/reject`, { note })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  })
}
