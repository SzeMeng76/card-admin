'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface Transaction {
  id: number
  card_number: string
  type: string
  amount: number
  balance_after: number
  note: string
  created_at: string
}

export default function PortalTransactionsPage() {
  const t = useTranslations()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then(setTransactions)
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t('transactions.title')}</h1>
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {[t('transactions.cardNumber'), t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('common.createdAt')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs">{tx.card_number}</td>
                <td className="px-4 py-3 text-xs">{tx.type}</td>
                <td className={`px-4 py-3 font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}¥{Number(tx.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">¥{Number(tx.balance_after).toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{tx.note || '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-center py-8 text-zinc-400 text-sm">—</p>}
      </div>
    </div>
  )
}
