'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

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

interface Card {
  id: number
  card_number: string
}

export default function TransactionsPage() {
  const t = useTranslations()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editModal, setEditModal] = useState<Transaction | null>(null)
  const [form, setForm] = useState({ cardId: '', type: 'manual', amount: '', note: '' })
  const [editForm, setEditForm] = useState({ type: 'manual', amount: '', note: '' })

  async function load() {
    const [tx, c] = await Promise.all([
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/cards').then(r => r.json()),
    ])
    setTransactions(tx)
    setCards(c)
  }

  useEffect(() => { load() }, [])

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: Number(form.cardId),
        type: form.type,
        amount: Number(form.amount),
        note: form.note,
      }),
    })
    setShowAdd(false)
    setForm({ cardId: '', type: 'manual', amount: '', note: '' })
    load()
  }

  function openEdit(tx: Transaction) {
    setEditForm({
      type: tx.type,
      amount: String(Math.abs(tx.amount)),
      note: tx.note || '',
    })
    setEditModal(tx)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editModal) return
    await fetch('/api/transactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editModal.id, type: editForm.type, amount: Number(editForm.amount), note: editForm.note }),
    })
    setEditModal(null)
    load()
  }

  async function deleteTx(id: number) {
    if (!confirm(t('transactions.confirmDelete'))) return
    await fetch('/api/transactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  function exportCsv() {
    const headers = [t('transactions.cardNumber'), t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('transactions.operator'), t('common.createdAt')]
    const rows = transactions.map(tx => [
      tx.card_number, tx.type, tx.amount, tx.balance_after, tx.note || '', tx.created_by_name || '', tx.created_at
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${Date.now()}.csv`
    a.click()
  }

  const typeColors: Record<string, string> = {
    topup: 'bg-green-50 text-green-700',
    deduct: 'bg-red-50 text-red-700',
    manual: 'bg-blue-50 text-blue-700',
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      topup: t('transactions.topup'),
      deduct: t('transactions.deduct'),
      manual: t('transactions.manual'),
    }
    return map[type] || type
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('transactions.title')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(true)}>{t('transactions.addRecord')}</Button>
          <Button variant="outline" onClick={exportCsv}>{t('common.export')}</Button>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-4">{t('transactions.addRecord')}</h2>
            <form onSubmit={addTransaction} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('cards.cardNumber')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={form.cardId}
                  onChange={e => setForm(f => ({ ...f, cardId: e.target.value }))}
                  required
                >
                  <option value="">— {t('cards.cardNumber')} —</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.card_number}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('transactions.type')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="manual">{t('transactions.manual')}</option>
                  <option value="topup">{t('transactions.topup')}</option>
                  <option value="deduct">{t('transactions.deduct')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('transactions.amount')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t('common.note')}</Label>
                <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-4">{t('common.edit')} — <span className="font-mono text-xs">{editModal.card_number}</span></h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('transactions.type')}</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="manual">{t('transactions.manual')}</option>
                  <option value="topup">{t('transactions.topup')}</option>
                  <option value="deduct">{t('transactions.deduct')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('transactions.amount')}</Label>
                <Input type="number" min="0.01" step="0.01" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.note')}</Label>
                <Input value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setEditModal(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {[t('transactions.cardNumber'), t('transactions.type'), t('transactions.amount'), t('transactions.balanceAfter'), t('common.note'), t('transactions.operator'), t('common.createdAt'), t('common.actions')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs">{tx.card_number}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[tx.type] || 'bg-zinc-100 text-zinc-600'}`}>
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
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tx)}>{t('common.edit')}</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteTx(tx.id)}>{t('common.delete')}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <p className="text-center py-8 text-zinc-400 text-sm">—</p>}
      </div>
    </div>
  )
}
