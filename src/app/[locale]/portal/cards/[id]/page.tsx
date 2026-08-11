'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Wifi, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cs } from '@/lib/currency'

interface CardData {
  id: number
  card_number: string
  balance: number
  status: string
  expires_at: string | null
  cvc: string | null
  cardholder: string | null
  currency: string
  note: string
  billing_address: string | null
}

interface Transaction {
  id: number
  type: string
  amount: number
  balance_after: number
  note: string
  created_at: string
}

export default function CardDetailPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const id = params.id as string

  const [card, setCard] = useState<CardData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then((cards: CardData[]) => {
      const found = cards.find(c => c.id === Number(id))
      setCard(found || null)
    })
    fetch(`/api/transactions?cardId=${id}`).then(r => r.json()).then(setTransactions)
  }, [id])

  function formatExpiry(val: string | null) {
    if (!val) return '—'
    const parts = val.split('-')
    if (parts.length >= 2) return `${parts[1]}/${parts[0].slice(2)}`
    return val
  }

  if (!card) return <div className="text-zinc-400 py-8 text-center">{t('common.loading')}</div>

  return (
    <div className="max-w-lg mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/${locale}/portal`)}>
        ← {t('common.back')}
      </Button>

      {/* Card visual */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-zinc-900 text-white rounded-2xl p-6 space-y-6 mb-6 shadow-xl overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 opacity-90" />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
            {t(`common.${card.status as 'active' | 'frozen'}`)}
          </span>
        </div>

        <p className="relative font-mono text-2xl tracking-widest">
          {card.card_number.match(/.{1,4}/g)?.join(' ') || card.card_number}
        </p>

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs opacity-60 uppercase mb-1">{t('portal.cardholder')}</p>
            <p className="font-medium">{card.cardholder || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-xs opacity-60 uppercase mb-1">{t('portal.expires')}</p>
            <p className="font-mono">{formatExpiry(card.expires_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60 uppercase mb-1">CVC</p>
            <p className="font-mono text-lg">{card.cvc || '—'}</p>
          </div>
        </div>

        <Wifi className="relative w-6 h-6 opacity-50 rotate-90 -mt-2" />

        <div className="relative border-t border-white/20 pt-4">
          <p className="text-xs opacity-60 uppercase mb-1">{t('portal.balance')}</p>
          <p className="text-3xl font-bold">{cs(card.currency)}{Number(card.balance).toFixed(2)} <span className="text-base font-normal opacity-70">{card.currency}</span></p>
        </div>

        {card.billing_address && (
          <div className="relative border-t border-white/20 pt-4">
            <p className="text-xs opacity-60 uppercase mb-1">{t('portal.billingAddress')}</p>
            <p className="text-sm">{card.billing_address}</p>
          </div>
        )}
      </div>

      {card.note && (
        <p className="text-sm text-zinc-500 mb-6 px-1">{card.note}</p>
      )}

      {/* Transactions */}
      <h2 className="font-semibold mb-3 text-zinc-900">{t('transactions.title')}</h2>
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md py-12 text-center text-zinc-400 text-sm">—</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md divide-y divide-zinc-100 overflow-hidden">
          {transactions.map(tx => {
            const isPositive = tx.amount > 0
            const Icon = tx.type === 'topup' ? ArrowDownRight : tx.type === 'deduct' ? ArrowUpRight : RefreshCw
            const iconBg = isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            return (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {tx.type === 'topup' ? t('transactions.topup') : tx.type === 'deduct' ? t('transactions.deduct') : t('transactions.manual')}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {tx.note || new Date(tx.created_at.endsWith('Z') ? tx.created_at : tx.created_at + 'Z').toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? '+' : ''}{cs(card.currency)}{Number(tx.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-400">{cs(card.currency)}{Number(tx.balance_after).toFixed(2)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
