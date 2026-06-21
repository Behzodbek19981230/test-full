import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './api'

export interface Topic {
  id: number
  subject_id: number
  name: string
  description: string
  question_count: number
  is_active: boolean
}

export interface Question {
  id: number
  topic_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

interface TopicPayload {
  name: string
  description?: string
  subject_id: number
}

interface QuestionPayload {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
}

export const topicKeys = {
  all: (subjectId: number) => ['topics', subjectId] as const,
  detail: (id: number) => ['topics', 'detail', id] as const,
  questions: (topicId: number) => ['topics', topicId, 'questions'] as const,
}

export function useTopics(subjectId: number) {
  return useQuery({
    queryKey: topicKeys.all(subjectId),
    queryFn: async () => {
      const { data } = await api.get<Topic[]>(`/topics/all?subject_id=${subjectId}`)
      return data
    },
    enabled: !!subjectId,
  })
}

export function useQuestions(topicId: number) {
  return useQuery({
    queryKey: topicKeys.questions(topicId),
    queryFn: async () => {
      const { data } = await api.get(`/topics/${topicId}`)
      return data.questions as Question[]
    },
    enabled: !!topicId,
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TopicPayload) => {
      const { data } = await api.post('/topics', payload)
      return data
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: topicKeys.all(vars.subject_id) }),
  })
}

export function useUpdateTopic(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: number; name: string; description?: string }) => {
      const { data } = await api.put(`/topics/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.all(subjectId) }),
  })
}

export function useDeleteTopic(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/topics/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.all(subjectId) }),
  })
}

export function useCreateQuestion(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: QuestionPayload) => {
      const { data } = await api.post(`/topics/${topicId}/questions`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.questions(topicId) }),
  })
}

export function useUpdateQuestion(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: QuestionPayload & { id: number }) => {
      const { data } = await api.put(`/topics/questions/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.questions(topicId) }),
  })
}

export function useDeleteQuestion(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/topics/questions/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.questions(topicId) }),
  })
}
