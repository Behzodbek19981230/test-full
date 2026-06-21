import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface Admin {
  id: number
  username: string
  full_name: string
  role: string
}

interface LoginPayload {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  admin: Admin
}

interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const { data } = await api.get<Admin>('/auth/me')
      return data
    },
    retry: false,
    enabled: !!localStorage.getItem('token'),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<LoginResponse>('/auth/login', payload)
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      queryClient.setQueryData(authKeys.me, data.admin)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    localStorage.removeItem('token')
    queryClient.clear()
    window.location.href = '/login'
  }
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const { data } = await api.put('/auth/change-password', payload)
      return data
    },
  })
}
