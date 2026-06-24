'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface Transaction {
  id: number
  card_number: string
  type: string
  amount: number
  balance_after: number
  note: string
  created_by_name: string
  created_at: string
}

export default function TransactionsPage() {
  const t = useTranslations()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then(setTransactions)
  }, [])

  function exportCsv() {
    const headers = [t('transactions.cardNumber'), t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('transactions.operator'), t('common.createdAt')]
    const rows = transactions.map(tx => [
      tx.card_number, tx.type, tx.amount, tx.balance_after, tx.note || '', tx.created_by_name || '', tx.created_at
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${Date.now()}.csv`
    a.click()
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { topup: t('transactions.topup'), deduct: t('transactions.deduct'), manual: t('transactions.manual') }
    return map[type] || type
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('transactions.title')}</h1>
        <Button variant="outline" onClick={exportCsv}>{t('common.export')}</Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {[t('transactions.cardNumber'), t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('transactions.operator'), t('common.createdAt')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs">{tx.card_number}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tx.amount > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {typeLabel(tx.type)}
                  </span>
                </td>
                <td className={`px-4 py-3 font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}¥{Number(tx.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">¥{Number(tx.balance_after).toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{tx.note || '—'}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{tx.created_by_name || '—'}</td>
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
