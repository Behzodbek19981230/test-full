import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  IconSpeakerphone, IconUsers, IconBrandTelegram, IconSend,
  IconBulb, IconMessageChatbot, IconX, IconMoodSmile, IconPhotoPlus, IconTrash,
} from '@tabler/icons-react'
import { PageHeader, Button, Input, Badge, Card, CardHeader, CardBody, EmptyState, PageLoader } from '../components/ui'
import PromptEditor from '../components/ui/PromptEditor'
import { RichEditor } from '../components/editor'
import api from '../api'
import {
  useAnnouncements, useSendAnnouncement, useChannelSettings, useSaveChannelSettings, useUploadMedia,
  type UploadedMedia,
} from '../services/announcements.service'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: 'Yuborilmoqda...', variant: 'warning' },
  sent: { label: 'Yuborildi', variant: 'success' },
  partial: { label: "Qisman yuborildi", variant: 'warning' },
  failed: { label: 'Xatolik', variant: 'danger' },
}

const targetLabel: Record<string, string> = {
  users: 'Foydalanuvchilar',
  channel: 'Kanal',
  both: 'Foydalanuvchilar + Kanal',
}

const EMOJI_SET = [
  '📢', '📣', '🔔', '🎉', '🎊', '✅', '❌', '⚠️', '❗️', '❓',
  '📌', '📚', '📖', '✏️', '🎯', '🔥', '⭐️', '🌟', '💡', '🎁',
  '🏆', '👍', '👏', '🙏', '💪', '❤️', '🚀', '📅', '⏰', '💰',
  '🎓', '✨', '🆕', '📷', '🎬',
]

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function Announcements() {
  const [message, setMessage] = useState('')
  const [sendToUsers, setSendToUsers] = useState(true)
  const [sendToChannel, setSendToChannel] = useState(false)
  const [channelInput, setChannelInput] = useState('')
  const [media, setMedia] = useState<UploadedMedia | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)

  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptResult, setPromptResult] = useState('')
  const promptGetText = useRef<() => { text: string; image: string | null }>(() => ({ text: '', image: null }))
  const insertRef = useRef<((text: string) => void) | null>(null)
  const mediaFileRef = useRef<HTMLInputElement>(null)

  const { data: settings, isLoading: settingsLoading } = useChannelSettings()
  const saveSettings = useSaveChannelSettings()
  const { data, isLoading } = useAnnouncements(1)
  const sendAnnouncement = useSendAnnouncement()
  const uploadMedia = useUploadMedia()

  const handleSend = async () => {
    if (!stripHtml(message)) {
      toast.error("Xabar matnini kiriting")
      return
    }
    if (!sendToUsers && !sendToChannel) {
      toast.error("Kamida bitta manzilni tanlang")
      return
    }
    if (sendToChannel && !settings?.channel_chat_id) {
      toast.error("Avval Telegram kanalni ulang")
      return
    }
    const target = sendToUsers && sendToChannel ? 'both' : sendToChannel ? 'channel' : 'users'
    try {
      await sendAnnouncement.mutateAsync({
        message, target,
        media_path: media?.media_path,
        media_type: media?.media_type,
      })
      toast.success("E'lon yuborildi")
      setMessage('')
      setMedia(null)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Xatolik yuz berdi')
    }
  }

  const handleSaveChannel = async () => {
    if (!channelInput.trim()) {
      toast.error("Kanal chat_id yoki @username kiriting")
      return
    }
    try {
      const res = await saveSettings.mutateAsync(channelInput.trim())
      toast.success(`Kanal ulandi: ${res.channel_title}`)
      setChannelInput('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Kanalga ulanib bo\'lmadi')
    }
  }

  const handleAiImprove = async () => {
    if (!stripHtml(message)) {
      toast.error('Avval xabar matnini yozing')
      return
    }
    setAiLoading('improve')
    try {
      const res = await api.post('/ai/assist', { action: 'announcement_improve', text: stripHtml(message) })
      setMessage((res.data.result as string).split('\n').filter(Boolean).map(l => `<p>${l}</p>`).join(''))
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'AI xatolik berdi')
    } finally {
      setAiLoading(null)
    }
  }

  const handleCustomPrompt = async () => {
    const { text, image } = promptGetText.current()
    if (!text && !image) {
      toast.error('Prompt yozing yoki rasm yuklang')
      return
    }
    setPromptResult('')
    setAiLoading('custom_prompt')
    try {
      const res = image
        ? await api.post('/ai/assist', {
            action: 'custom_prompt',
            text: text || "Rasmni tahlil qil va shu mavzuda Telegram uchun qisqa e'lon matni yoz.",
            context: '',
            image,
          })
        : await api.post('/ai/assist', { action: 'announcement_generate', text: '', context: text })
      setPromptResult(res.data.result)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'AI xatolik berdi')
    } finally {
      setAiLoading(null)
    }
  }

  const applyPromptResult = () => {
    if (!promptResult) return
    setMessage(promptResult.split('\n').filter(Boolean).map(l => `<p>${l}</p>`).join(''))
    setShowPrompt(false)
    setPromptResult('')
    toast.success("E'lon matniga qo'yildi")
  }

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadMedia.mutateAsync(file)
      setMedia(res)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Fayl yuklanmadi')
    }
  }

  const insertEmoji = (emoji: string) => {
    insertRef.current?.(emoji)
    setShowEmoji(false)
  }

  return (
    <div>
      <PageHeader
        icon={<IconSpeakerphone size={22} />} iconColor="var(--primary)" iconBg="var(--primary-50)"
        title="E'lonlar"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card>
          <CardHeader title="Yangi e'lon yuborish" icon={<IconSend size={16} />} />
          <CardBody>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, position: 'relative' }}>
              <Button variant="ghost" size="sm" onClick={handleAiImprove} disabled={!!aiLoading}>
                <IconBulb size={15} style={{ color: 'var(--success)' }} />
                {aiLoading === 'improve' ? 'Yaxshilanmoqda...' : 'AI: Yaxshilash'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPrompt(!showPrompt)} disabled={!!aiLoading}>
                <IconMessageChatbot size={15} style={{ color: '#8b5cf6' }} />
                AI: Prompt
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEmoji(!showEmoji)}>
                <IconMoodSmile size={15} style={{ color: 'var(--warning)' }} />
                Emoji
              </Button>
              <Button variant="ghost" size="sm" onClick={() => mediaFileRef.current?.click()} loading={uploadMedia.isPending}>
                <IconPhotoPlus size={15} style={{ color: 'var(--info)' }} />
                Rasm / GIF
              </Button>
              <input
                ref={mediaFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleMediaSelect}
              />

              {showEmoji && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 20,
                  display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
                  padding: 8, background: 'var(--bg-800)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: 260,
                }}>
                  {EMOJI_SET.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      style={{ fontSize: 20, padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-900)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showPrompt && (
              <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg-900)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-100)' }}>
                    <IconMessageChatbot size={16} style={{ color: '#8b5cf6' }} />
                    AI ga prompt yozing
                  </div>
                  <button type="button" onClick={() => { setShowPrompt(false); setPromptResult('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-500)', padding: 4 }}>
                    <IconX size={16} />
                  </button>
                </div>
                <PromptEditor
                  placeholder="Masalan: yozgi chegirma haqida e'lon yoz... (Ctrl+Enter yuborish)"
                  getText={promptGetText}
                  onCtrlEnter={handleCustomPrompt}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button variant="primary" size="sm" onClick={handleCustomPrompt} disabled={!!aiLoading}>
                    <IconSend size={14} />
                    {aiLoading === 'custom_prompt' ? 'Yuborilmoqda...' : 'Yuborish'}
                  </Button>
                </div>
                {promptResult && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ padding: '12px 14px', background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: 'var(--text-200)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>
                      {promptResult}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <Button variant="primary" size="sm" onClick={applyPromptResult}>
                        E'longa qo'yish
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {media && (
              <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                <img src={media.url} alt="" style={{ maxWidth: 200, maxHeight: 140, borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  title="O'chirish"
                  style={{
                    position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--danger)', color: '#fff', border: '2px solid var(--bg-800)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <IconTrash size={12} />
                </button>
              </div>
            )}

            <RichEditor
              label="Xabar matni"
              value={message}
              onChange={setMessage}
              placeholder="E'lon matnini kiriting..."
              minHeight={140}
              showImageButton={false}
              insertRef={insertRef}
            />

            <div className="ui-field" style={{ marginTop: 12 }}>
              <label className="ui-label">Qayerga yuborilsin</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendToUsers}
                    onChange={e => setSendToUsers(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Bot foydalanuvchilariga
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendToChannel}
                    onChange={e => setSendToChannel(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  Telegram kanalga
                </label>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button onClick={handleSend} loading={sendAnnouncement.isPending}>
                <IconSend size={16} /> Yuborish
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Telegram kanal" icon={<IconBrandTelegram size={16} />} />
          <CardBody>
            {settingsLoading ? (
              <PageLoader rows={2} />
            ) : settings?.channel_chat_id ? (
              <div style={{ marginBottom: 12 }}>
                <Badge variant="success">Ulangan</Badge>
                <div style={{ marginTop: 8, fontWeight: 600 }}>{settings.channel_title}</div>
                <div style={{ color: 'var(--text-500)', fontSize: 13 }}>{settings.channel_chat_id}</div>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <Badge variant="warning">Ulanmagan</Badge>
              </div>
            )}
            <Input
              label="Kanal chat_id yoki @username"
              placeholder="@mening_kanalim yoki -1001234567890"
              value={channelInput}
              onChange={e => setChannelInput(e.target.value)}
              hint="Bot kanalga admin qilib qo'shilgan bo'lishi kerak"
            />
            <div style={{ marginTop: 12 }}>
              <Button variant="secondary" onClick={handleSaveChannel} loading={saveSettings.isPending}>
                Ulash / Yangilash
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          <CardHeader title="Tarix" icon={<IconUsers size={16} />} />
          <CardBody flush>
            {isLoading ? (
              <PageLoader rows={4} />
            ) : !data?.items.length ? (
              <EmptyState icon={<IconSpeakerphone size={40} />} text="Hozircha e'lonlar yo'q" />
            ) : (
              data.items.map(b => {
                const cfg = statusConfig[b.status] || statusConfig.pending
                return (
                  <div key={b.id} className="ui-notif">
                    {b.media_url && (
                      <img src={b.media_url} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div className="ui-notif-body">
                      <div className="ui-notif-title">
                        {targetLabel[b.target]} <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="ui-notif-msg">{stripHtml(b.message)}</div>
                      <div className="ui-notif-time">
                        {new Date(b.created_at).toLocaleString('uz-UZ')}
                        {' · '}✅ {b.sent_count} {b.failed_count > 0 && `· ❌ ${b.failed_count}`}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
