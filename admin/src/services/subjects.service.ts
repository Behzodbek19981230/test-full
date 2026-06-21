import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface Subject {
  id: number
  name: string
  description: string
  icon: string
  price_per_question: number
  is_active: boolean
  topic_count: number
  question_count: number
}

interface SubjectPayload {
  name: string
  description?: string
  icon?: string
  price_per_question: number
  is_active?: boolean
}

export const subjectKeys = {
  all: ['subjects'] as const,
  detail: (id: number) => ['subjects', id] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.all,
    queryFn: async () => {
      const { data } = await api.get<Subject[]>('/subjects/all')
      return data
    },
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubjectPayload) => {
      const { data } = await api.post('/subjects', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: SubjectPayload & { id: number }) => {
      const { data } = await api.put(`/subjects/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectKeys.all }),
  })
}
