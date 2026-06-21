import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface Subject {
  id: number
  name: string
  icon: string
  description: string
  price_per_question: number
  topic_count: number
  question_count: number
}

export interface PublicStats {
  total_users: number
  total_questions: number
  total_attempts: number
  total_subjects: number
}

export const publicKeys = {
  subjects: ['subjects'] as const,
  stats: ['stats', 'public'] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: publicKeys.subjects,
    queryFn: () => api.get<Subject[]>('/subjects'),
  })
}

export function usePublicStats() {
  return useQuery({
    queryKey: publicKeys.stats,
    queryFn: () => api.get<PublicStats>('/stats/public'),
  })
}
