import { getTranslations } from 'next-intl/server'
import { CreditCard, CheckCircle2, Wallet, Activity, Users } from 'lucide-react'
import { db, fmtAmountByCurrency } from '@/lib/db'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const t = await getTranslations()

  const stats = db.cards.stats()
  const balanceStr = fmtAmountByCurrency(db.cards.balanceByCurrency())
  const todayTx = db.transactions.todayCount()
  const todayAmtStr = fmtAmountByCurrency(db.transactions.todayAmountByCurrency())
  const userCount = db.users.list().length

  const items = [
    { label: t('dashboard.totalCards'), value: stats?.total ?? 0, icon: CreditCard, color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('dashboard.activeCards'), value: stats?.active ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('dashboard.totalBalance'), value: balanceStr, icon: Wallet, color: 'from-amber-500 to-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('dashboard.todayTransactions'), value: `${todayTx} ${t('dashboard.txUnit')}`, sub: todayAmtStr, icon: Activity, color: 'from-rose-500 to-rose-600', text: 'text-rose-600', bg: 'bg-rose-50' },
    { label: t('dashboard.totalUsers'), value: userCount, icon: Users, color: 'from-sky-500 to-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {items.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-100 bg-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5"
            >
              <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3', item.bg)}>
                <Icon className={cn('w-5 h-5', item.text)} />
              </div>
              <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
              <p className="text-2xl font-bold text-zinc-900 truncate">{item.value}</p>
              {item.sub && <p className="text-xs text-zinc-400 truncate mt-0.5">{item.sub}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
