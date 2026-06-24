import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const t = await getTranslations()

  const stats = db.cards.stats()
  const todayTx = db.transactions.todayCount()
  const userCount = db.users.list().length

  const items = [
    { label: t('dashboard.totalCards'), value: stats?.total ?? 0 },
    { label: t('dashboard.activeCards'), value: stats?.active ?? 0 },
    { label: t('dashboard.totalBalance'), value: `$${Number(stats?.totalBalance ?? 0).toFixed(2)}` },
    { label: t('dashboard.todayTransactions'), value: todayTx },
    { label: t('dashboard.totalUsers'), value: userCount },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t('dashboard.title')}</h1>
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
    </div>
  )
}
