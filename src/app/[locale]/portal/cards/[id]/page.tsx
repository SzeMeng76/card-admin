'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-600 text-white rounded-2xl p-6 space-y-6 mb-6 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest opacity-70">Virtual Card</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
            {t(`common.${card.status as 'active' | 'frozen'}`)}
          </span>
        </div>

        <p className="font-mono text-2xl tracking-widest">
          {card.card_number.match(/.{1,4}/g)?.join(' ') || card.card_number}
        </p>

        <div className="flex items-end justify-between">
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

        <div className="border-t border-white/20 pt-4">
          <p className="text-xs opacity-60 uppercase mb-1">{t('portal.balance')}</p>
          <p className="text-3xl font-bold">{cs(card.currency)}{Number(card.balance).toFixed(2)} <span className="text-base font-normal opacity-70">{card.currency}</span></p>
        </div>
      </div>

      {card.note && (
        <p className="text-sm text-zinc-500 mb-6 px-1">{card.note}</p>
      )}

      {/* Transactions */}
      <h2 className="font-semibold mb-3">{t('transactions.title')}</h2>
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {transactions.length === 0 ? (
          <p className="text-center py-8 text-zinc-400 text-sm">—</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {[t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('common.createdAt')].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-xs">{tx.type}</td>
                  <td className={`px-4 py-3 font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{cs(card.currency)}{Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{cs(card.currency)}{Number(tx.balance_after).toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{tx.note || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(tx.created_at.endsWith('Z') ? tx.created_at : tx.created_at + 'Z').toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
