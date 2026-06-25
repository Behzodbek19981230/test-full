import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  IconMessageCircle, IconSend, IconAlertTriangle,
  IconArrowLeft, IconRefresh, IconMessage, IconRobot, IconUser,
} from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, EmptyState, PageLoader } from '../components/ui'
import './Chats.css'

interface Session {
  id: number
  session_key: string
  status: string
  is_escalated: boolean
  created_at: string
  updated_at: string
  last_message: string
  last_role: string
  unread_count: number
  message_count: number
}

interface Message {
  id: number
  role: string
  text: string
  created_at: string
}

export default function Chats() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'escalated'>('all')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadSessions = () => {
    api.get(`/chat/sessions?status=${filter}&per_page=50`)
      .then(r => setSessions(r.data.sessions))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSessions() }, [filter])

  useEffect(() => {
    if (!selected) return
    const interval = setInterval(() => {
      api.get(`/chat/sessions/${selected}`).then(r => setMessages(r.data.messages))
    }, 5000)
    return () => clearInterval(interval)
  }, [selected])

  const openSession = (id: number) => {
    setSelected(id)
    api.get(`/chat/sessions/${id}`).then(r => {
      setMessages(r.data.messages)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    try {
      await api.post(`/chat/sessions/${selected}/reply`, { text: reply })
      setReply('')
      const r = await api.get(`/chat/sessions/${selected}`)
      setMessages(r.data.messages)
      loadSessions()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      inputRef.current?.focus()
    } catch {
      toast.error('Xabar yuborilmadi')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }) + ' ' + time
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return 'Bugun'
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Kecha'
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
  }

  const unreadSessions = sessions.filter(s => s.unread_count > 0).length
  const escalatedSessions = sessions.filter(s => s.is_escalated).length

  if (loading) return <PageLoader rows={6} />

  // ——— Chat detail view ———
  if (selected) {
    const currentSession = sessions.find(s => s.id === selected)

    let lastDate = ''
    const groupedMessages = messages.map(m => {
      const date = formatDate(m.created_at)
      const showDate = date !== lastDate
      lastDate = date
      return { ...m, showDate, dateLabel: date }
    })

    return (
      <div className="chat-detail">
        <div className="chat-detail__header">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); loadSessions() }}>
            <IconArrowLeft size={16} /> Orqaga
          </Button>
          <div className="chat-detail__title">
            <IconMessageCircle size={20} />
            <span>Chat #{selected}</span>
            {currentSession?.is_escalated && <Badge variant="warning">Murojaat</Badge>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => openSession(selected)} title="Yangilash">
            <IconRefresh size={16} />
          </Button>
        </div>

        <Card>
          <CardBody style={{ padding: 0 }}>
            <div className="chat-messages">
              {groupedMessages.map(m => (
                <div key={m.id}>
                  {m.showDate && (
                    <div className="chat-date-divider">
                      <span>{m.dateLabel}</span>
                    </div>
                  )}
                  <div className={`chat-msg chat-msg--${m.role}`}>
                    <div className="chat-msg__avatar">
                      {m.role === 'user' && <IconUser size={16} />}
                      {m.role === 'bot' && <IconRobot size={16} />}
                      {m.role === 'admin' && <IconUser size={16} />}
                    </div>
                    <div className={`chat-msg__bubble chat-msg__bubble--${m.role}`}>
                      <div className="chat-msg__sender">
                        {m.role === 'user' && 'Foydalanuvchi'}
                        {m.role === 'bot' && 'AI Bot'}
                        {m.role === 'admin' && 'Admin'}
                      </div>
                      <div className="chat-msg__text">
                        {m.text.split('\n').map((line, i) => (
                          <span key={i}>{line}{i < m.text.split('\n').length - 1 && <br />}</span>
                        ))}
                      </div>
                      <div className="chat-msg__time">{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="chat-reply">
              <textarea
                ref={inputRef}
                className="chat-reply__input"
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Javob yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
                rows={2}
                disabled={sending}
              />
              <div className="chat-reply__actions">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  loading={sending}
                >
                  <IconSend size={16} /> Yuborish
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  // ——— Sessions list ———
  return (
    <div>
      <PageHeader
        icon={<IconMessageCircle size={22} />}
        iconColor="var(--primary)"
        iconBg="var(--primary-50)"
        title="Chat xabarlar"
        badge={unreadSessions > 0 ? <Badge variant="warning">{unreadSessions} yangi</Badge> : undefined}
        actions={
          <div className="chat-filters">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              <IconMessage size={15} /> Barchasi ({sessions.length})
            </Button>
            <Button
              variant={filter === 'escalated' ? 'warning' : 'ghost'}
              size="sm"
              onClick={() => setFilter('escalated')}
            >
              <IconAlertTriangle size={15} /> Murojaatlar ({escalatedSessions})
            </Button>
          </div>
        }
      />

      <Card>
        <CardBody style={{ padding: 0 }}>
          {sessions.length === 0 ? (
            <EmptyState
              icon={<IconMessageCircle size={48} />}
              title="Chat xabarlar yo'q"
              description={filter === 'escalated'
                ? "Hozircha murojaatlar yo'q"
                : "Foydalanuvchilar hali murojaat qilmagan"}
            />
          ) : (
            <div className="chat-list">
              {sessions.map(s => (
                <button
                  key={s.id}
                  className={`chat-item ${s.unread_count > 0 ? 'chat-item--unread' : ''}`}
                  onClick={() => openSession(s.id)}
                >
                  <div className={`chat-item__icon ${s.is_escalated ? 'chat-item__icon--escalated' : ''}`}>
                    {s.is_escalated ? <IconAlertTriangle size={20} /> : <IconMessageCircle size={20} />}
                  </div>

                  <div className="chat-item__body">
                    <div className="chat-item__top">
                      <span className="chat-item__name">Chat #{s.id}</span>
                      {s.is_escalated && <Badge variant="warning">Murojaat</Badge>}
                      {s.unread_count > 0 && <Badge variant="danger">{s.unread_count}</Badge>}
                    </div>
                    <div className="chat-item__preview">
                      {s.last_role === 'admin' && <span className="chat-item__prefix">Siz: </span>}
                      {s.last_role === 'bot' && <span className="chat-item__prefix">Bot: </span>}
                      {s.last_message || 'Xabar yo\'q'}
                    </div>
                  </div>

                  <div className="chat-item__meta">
                    <span className="chat-item__time">{formatTime(s.updated_at)}</span>
                    <span className="chat-item__count">{s.message_count} xabar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
