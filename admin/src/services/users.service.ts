import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface User {
  id: number
  telegram_id: number
  username: string
  full_name: string
  phone: string
  role: string
  is_active: boolean
  created_at: string
}

interface UsersResponse {
  users: User[]
  total: number
}

interface UsersParams {
  page: number
  per_page?: number
  search?: string
}

export const userKeys = {
  all: (params: UsersParams) => ['users', params] as const,
}

export function useUsers(params: UsersParams) {
  return useQuery({
    queryKey: userKeys.all(params),
    queryFn: async () => {
      const { data } = await api.get<UsersResponse>('/users', {
        params: { page: params.page, per_page: params.per_page || 20, search: params.search },
      })
      return data
    },
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/users/${id}/toggle-active`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
