import { getTranslations } from 'next-intl/server'
import { getSession } from '@/lib/auth'
import { db, fmtAmountByCurrency } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PortalCards from './PortalCards'

export default async function PortalPage() {
  const t = await getTranslations()
  const session = await getSession()
  if (!session) return null

  const cards = db.cards.listByOwner(session.id)
  const activeCards = cards.filter(c => c.status === 'active').length
  const allTx = db.transactions.listByOwner(session.id)
  const todayCount = db.transactions.todayCountByOwner(session.id)

  // Group balance by currency
  const balanceByCurrency: Record<string, number> = {}
  for (const c of cards) {
    const cur = c.currency || 'USD'
    balanceByCurrency[cur] = (balanceByCurrency[cur] || 0) + c.balance
  }
  const balanceStr = fmtAmountByCurrency(Object.entries(balanceByCurrency).map(([currency, total]) => ({ currency, total })))
  const todayAmtStr = fmtAmountByCurrency(db.transactions.todayAmountByCurrencyByOwner(session.id))

  const stats = [
    { label: t('portal.myCardCount'), value: cards.length },
    { label: t('portal.activeCards'), value: activeCards },
    { label: t('portal.totalBalance'), value: balanceStr },
    { label: t('portal.txCount'), value: allTx.length },
    { label: t('portal.todayAmount'), value: `${todayCount} 笔 / ${todayAmtStr}` },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t('portal.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500 font-normal">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards list (client) */}
      <PortalCards />
    </div>
  )
}
