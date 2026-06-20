import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { IconBell, IconCreditCard, IconClipboardCheck, IconSettings, IconInfoCircle, IconChecks } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, Button, Badge, Card, CardBody, EmptyState } from '../components/ui'

interface Notification {
  id: number; title: string; message: string; type: string; is_read: boolean; created_at: string
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  payment: { icon: <IconCreditCard size={20} />, color: 'var(--warning)', bg: 'var(--warning-50)' },
  test: { icon: <IconClipboardCheck size={20} />, color: 'var(--success)', bg: 'var(--success-50)' },
  system: { icon: <IconSettings size={20} />, color: 'var(--info)', bg: 'var(--info-50)' },
  info: { icon: <IconInfoCircle size={20} />, color: 'var(--primary-light)', bg: 'var(--primary-50)' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const load = () => {
    api.get('/notifications?per_page=50').then(r => {
      setNotifications(r.data.notifications); setUnread(r.data.unread_count)
    })
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: number) => { await api.put(`/notifications/${id}/read`); load() }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    toast.success('Barcha bildirishnomalar o\'qildi')
    load()
  }

  return (
    <div>
      <PageHeader
        icon={<IconBell size={22} />} iconColor="var(--primary-light)" iconBg="var(--primary-50)" title="Bildirishnomalar"
        badge={unread > 0 ? <Badge variant="warning">{unread} yangi</Badge> : undefined}
        actions={unread > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}><IconChecks size={16} /> Barchasini o'qilgan</Button> : undefined}
      />

      <Card>
        <CardBody flush>
          {notifications.length === 0 ? (
            <EmptyState icon={<IconBell size={40} />} text="Bildirishnomalar yo'q" />
          ) : (
            notifications.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.info
              return (
                <div key={n.id} className={`ui-notif ${!n.is_read ? 'ui-notif--unread' : ''}`}
                     onClick={() => !n.is_read && markRead(n.id)}>
                  <div className="ui-notif-icon" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
                  <div className="ui-notif-body">
                    <div className="ui-notif-title">{n.title}</div>
                    <div className="ui-notif-msg">{n.message}</div>
                    <div className="ui-notif-time">{new Date(n.created_at).toLocaleString('uz-UZ')}</div>
                  </div>
                  {!n.is_read && <div className="ui-notif-dot" />}
                </div>
              )
            })
          )}
        </CardBody>
      </Card>
    </div>
  )
}
