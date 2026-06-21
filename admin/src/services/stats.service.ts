import { useQuery } from '@tanstack/react-query'
import api from './api'

export interface DashboardData {
  total_users: number
  new_users_month: number
  total_tests: number
  total_attempts: number
  total_revenue: number
  month_revenue: number
  pending_payments: number
  avg_score: number
  daily_revenue: { date: string; revenue: number }[]
  daily_users: { date: string; count: number }[]
  subject_stats: { id: number; name: string; icon: string; test_count: number; attempt_count: number }[]
}

export const statsKeys = {
  dashboard: ['stats', 'dashboard'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: statsKeys.dashboard,
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/stats/dashboard')
      return data
    },
  })
}
