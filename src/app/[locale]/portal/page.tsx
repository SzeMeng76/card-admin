import { getTranslations } from 'next-intl/server'
import { CreditCard, CheckCircle2, Wallet, Activity, TrendingUp } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { db, fmtAmountByCurrency } from '@/lib/db'
import { cn } from '@/lib/utils'
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
    { label: t('portal.myCardCount'), value: cards.length, icon: CreditCard, text: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('portal.activeCards'), value: activeCards, icon: CheckCircle2, text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('portal.totalBalance'), value: balanceStr, icon: Wallet, text: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('portal.txCount'), value: allTx.length, icon: TrendingUp, text: 'text-rose-600', bg: 'bg-rose-50' },
    { label: t('portal.todayAmount'), value: `${todayCount} ${t('portal.txUnit')} / ${todayAmtStr}`, icon: Activity, text: 'text-sky-600', bg: 'bg-sky-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{t('portal.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-100 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5"
            >
              <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3', s.bg)}>
                <Icon className={cn('w-5 h-5', s.text)} />
              </div>
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-zinc-900 truncate">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Cards list (client) */}
      <PortalCards />
    </div>
  )
}
