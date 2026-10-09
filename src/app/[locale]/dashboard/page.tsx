import { getTranslations } from 'next-intl/server'
import { CreditCard, CheckCircle2, Wallet, TrendingUp, Activity, Users } from 'lucide-react'
import { db, fmtAmountByCurrency, balanceLines } from '@/lib/db'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const t = await getTranslations()

  const stats = db.cards.stats()
  const balanceLinesList = balanceLines(db.cards.balanceByCurrency())
  const maxBalanceLines = balanceLines(db.cards.maxBalanceByCurrency().map(r => ({ currency: r.currency, total: r.max })))
  const todayTx = db.transactions.todayCount()
  const todayAmtStr = fmtAmountByCurrency(db.transactions.todayAmountByCurrency())
  const userCount = db.users.list().length

  const items = [
    { label: t('dashboard.totalCards'), value: stats?.total ?? 0, icon: CreditCard, color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('dashboard.activeCards'), value: stats?.active ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('dashboard.totalBalance'), lines: balanceLinesList, icon: Wallet, color: 'from-amber-500 to-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('dashboard.maxBalance'), lines: maxBalanceLines, icon: TrendingUp, color: 'from-violet-500 to-violet-600', text: 'text-violet-600', bg: 'bg-violet-50' },
    { label: t('dashboard.todayTransactions'), value: `${todayTx} ${t('dashboard.txUnit')}`, sub: todayAmtStr, icon: Activity, color: 'from-rose-500 to-rose-600', text: 'text-rose-600', bg: 'bg-rose-50' },
    { label: t('dashboard.totalUsers'), value: userCount, icon: Users, color: 'from-sky-500 to-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map(item => {
          const Icon = item.icon
          const lines = 'lines' in item ? (item.lines as string[]) : null
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-100 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5"
            >
              <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3', item.bg)}>
                <Icon className={cn('w-5 h-5', item.text)} />
              </div>
              <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
              {lines ? (
                lines.length === 0 ? (
                  <p className="text-2xl font-bold text-zinc-900">—</p>
                ) : (
                  <div className="space-y-0.5">
                    {lines.map(line => (
                      <p key={line} className="text-lg font-bold text-zinc-900 leading-tight break-all">{line}</p>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-2xl font-bold text-zinc-900">{item.value}</p>
              )}
              {'sub' in item && item.sub && <p className="text-xs text-zinc-400 truncate mt-0.5">{item.sub}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
