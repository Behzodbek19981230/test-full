import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { IconUsers, IconCash, IconClock, IconTrophy, IconChartBar, IconUserPlus, IconTrendingUp } from '@tabler/icons-react'
import api from '../api'
import { PageHeader, StatCard, Card, CardHeader, CardBody, SubjectIcon, Button } from '../components/ui'
import Table from '../components/ui/Table'

interface DashboardData {
  total_users: number; new_users_month: number; total_tests: number; total_attempts: number
  total_revenue: number; month_revenue: number; pending_payments: number; avg_score: number
  daily_revenue: { date: string; revenue: number }[]
  daily_users: { date: string; count: number }[]
  subject_stats: { id: number; name: string; icon: string; test_count: number; attempt_count: number }[]
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    padding: '10px 14px',
  },
  labelStyle: { color: '#94a3b8', fontSize: '11px', marginBottom: 4 },
  cursor: { fill: 'rgba(26,127,138,0.04)' },
}

const tooltipStyleLine = {
  ...tooltipStyle,
  cursor: { stroke: 'rgba(0,0,0,0.06)', strokeWidth: 1 },
}

type Period = '7d' | '30d'

function sliceByPeriod<T>(data: T[], period: Period): T[] {
  if (period === '7d') return data.slice(-7)
  return data
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [revenuePeriod, setRevenuePeriod] = useState<Period>('7d')
  const [usersPeriod, setUsersPeriod] = useState<Period>('7d')

  useEffect(() => { api.get('/stats/dashboard').then(r => setData(r.data)).catch(() => {}) }, [])

  if (!data) return <div className="ui-empty"><p>Yuklanmoqda...</p></div>

  const fmtMoney = (n: number) => n.toLocaleString() + ' so\'m'

  const revenueData = sliceByPeriod(data.daily_revenue, revenuePeriod)
  const usersData = sliceByPeriod(data.daily_users, usersPeriod)

  const periodTabs = (active: Period, onChange: (p: Period) => void) => (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button variant={active === '7d' ? 'primary' : 'ghost'} size="sm" onClick={() => onChange('7d')}>Hafta</Button>
      <Button variant={active === '30d' ? 'primary' : 'ghost'} size="sm" onClick={() => onChange('30d')}>Oy</Button>
    </div>
  )

  return (
    <div>
      <PageHeader icon={<IconChartBar size={22} />} iconColor="var(--primary)" iconBg="var(--primary-50)" title="Dashboard" />

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
        {/* Revenue — Bar chart */}
        <Card>
          <CardHeader title="Kunlik daromad" icon={<IconCash size={18} />} action={periodTabs(revenuePeriod, setRevenuePeriod)} />
          <div className="ui-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
                <defs>
                  <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a7f8a" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#1a7f8a" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => v.slice(8)}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: number) => [fmtMoney(v), 'Daromad']}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#gradBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Users — Area chart */}
        <Card>
          <CardHeader title="Yangi foydalanuvchilar" icon={<IconUserPlus size={18} />} action={periodTabs(usersPeriod, setUsersPeriod)} />
          <div className="ui-chart">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={usersData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4842a" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#d4842a" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => v.slice(8)}
                  dy={8}
                />
                <YAxis hide />
                <Tooltip {...tooltipStyleLine} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#d4842a"
                  strokeWidth={2.5}
                  fill="url(#gradUsers)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#d4842a', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
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
