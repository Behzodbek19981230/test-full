import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

export interface Broadcast {
  id: number
  message: string
  target: 'users' | 'channel' | 'both'
  status: 'pending' | 'sent' | 'partial' | 'failed'
  media_url: string | null
  media_type: 'photo' | 'animation' | null
  sent_count: number
  failed_count: number
  created_at: string
}

export interface UploadedMedia {
  media_path: string
  media_type: 'photo' | 'animation'
  url: string
}

interface BroadcastsResponse {
  items: Broadcast[]
  total: number
}

export interface ChannelSettings {
  channel_chat_id: string | null
  channel_title: string | null
}

export function useAnnouncements(page: number) {
  return useQuery({
    queryKey: ['announcements', page],
    queryFn: async () => {
      const { data } = await api.get<BroadcastsResponse>('/announcements', { params: { page, per_page: 20 } })
      return data
    },
  })
}

export function useSendAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { message: string; target: string; media_path?: string; media_type?: string }) => {
      const { data } = await api.post<Broadcast>('/announcements', body)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<UploadedMedia>('/announcements/upload-media', formData)
      return data
    },
  })
}

export function useChannelSettings() {
  return useQuery({
    queryKey: ['announcements', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<ChannelSettings>('/announcements/settings')
      return data
    },
  })
}

export function useSaveChannelSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (channel_chat_id: string) => {
      const { data } = await api.put<ChannelSettings>('/announcements/settings', { channel_chat_id })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements', 'settings'] }),
  })
}
