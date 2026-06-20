import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { IconUsers, IconCash, IconClock, IconTrophy, IconChartBar, IconUserPlus, IconTrendingUp } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, StatCard, Card, CardHeader, CardBody, SubjectIcon } from '../components/ui'
import Table from '../components/ui/Table'

interface DashboardData {
  total_users: number; new_users_month: number; total_tests: number; total_attempts: number
  total_revenue: number; month_revenue: number; pending_payments: number; avg_score: number
  daily_revenue: { date: string; revenue: number }[]
  daily_users: { date: string; count: number }[]
  subject_stats: { id: number; name: string; icon: string; test_count: number; attempt_count: number }[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => { api.get('/stats/dashboard').then(r => setData(r.data)).catch(() => {}) }, [])

  if (!data) return <div className="ui-empty"><p>Yuklanmoqda...</p></div>

  const fmtMoney = (n: number) => n.toLocaleString() + ' so\'m'

  const tooltipStyle = {
    contentStyle: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '13px' },
    labelStyle: { color: '#94a3b8' },
  }

  return (
    <div>
      <PageHeader icon={<IconChartBar size={22} />} iconColor="var(--primary-light)" iconBg="var(--primary-50)" title="Dashboard" />

      <div className="ui-stats-row">
        <StatCard icon={<IconUsers size={22} />} color="purple" label="Jami foydalanuvchilar"
          value={data.total_users.toLocaleString()}
          change={<span className="ui-stat-change--up"><IconTrendingUp size={14} /> +{data.new_users_month} bu oy</span>} />
        <StatCard icon={<IconCash size={22} />} color="green" label="Jami daromad"
          value={fmtMoney(data.total_revenue)}
          change={<span className="ui-stat-change--up"><IconTrendingUp size={14} /> {fmtMoney(data.month_revenue)} bu oy</span>} />
        <StatCard icon={<IconClock size={22} />} color="amber" label="Kutilayotgan to'lovlar"
          value={data.pending_payments} />
        <StatCard icon={<IconTrophy size={22} />} color="cyan" label="O'rtacha ball"
          value={`${data.avg_score}%`}
          change={<span>{data.total_attempts} urinish</span>} />
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <Card>
          <CardHeader title="Kunlik daromad" icon={<IconCash size={18} />} />
          <div className="ui-chart">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.daily_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.slice(8)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [fmtMoney(v), 'Daromad']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Yangi foydalanuvchilar" icon={<IconUserPlus size={18} />} />
          <div className="ui-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.daily_users}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.slice(8)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Fanlar statistikasi" icon={<IconChartBar size={18} />} />
        <CardBody flush>
          <Table
            keyField="id"
            data={data.subject_stats}
            emptyIcon={<IconChartBar size={40} />}
            emptyText="Fanlar mavjud emas"
            columns={[
              { key: 'name', header: 'Fan', render: s => <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SubjectIcon icon={s.icon} size={22} />{s.name}</span> },
              { key: 'tests', header: 'Testlar', render: s => s.test_count },
              { key: 'attempts', header: 'Ishlangan', render: s => s.attempt_count },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
