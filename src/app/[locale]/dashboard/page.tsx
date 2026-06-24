import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function getStats() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stats`, {
    cache: 'no-store',
    headers: { cookie: '' },
  })
  return res.ok ? res.json() : null
}

export default async function DashboardPage() {
  const t = await getTranslations()

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t('dashboard.title')}</h1>
      <StatsCards t={t} />
    </div>
  )
}

async function StatsCards({ t }: { t: any }) {
  const stats = await getStats()

  const items = [
    { label: t('dashboard.totalCards'), value: stats?.totalCards ?? '—' },
    { label: t('dashboard.activeCards'), value: stats?.activeCards ?? '—' },
    { label: t('dashboard.totalBalance'), value: stats ? `¥${Number(stats.totalBalance).toFixed(2)}` : '—' },
    { label: t('dashboard.todayTransactions'), value: stats?.todayTransactions ?? '—' },
    { label: t('dashboard.totalUsers'), value: stats?.totalUsers ?? '—' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map(item => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-zinc-500 font-normal">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
