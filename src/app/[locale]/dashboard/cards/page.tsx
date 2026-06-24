'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

interface Card {
  id: number
  card_number: string
  owner_id: number | null
  owner_name: string | null
  balance: number
  status: string
  note: string
  cvc: string | null
  cardholder: string | null
  created_at: string
  expires_at: string | null
}

interface User {
  id: number
  username: string
}

export default function CardsPage() {
  const t = useTranslations()
  const [cards, setCards] = useState<Card[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editModal, setEditModal] = useState<Card | null>(null)
  const [balanceModal, setBalanceModal] = useState<Card | null>(null)
  const [balanceType, setBalanceType] = useState<'topup' | 'deduct'>('topup')

  const [form, setForm] = useState({ cardNumber: '', ownerId: '', balance: '0', note: '', expiresAt: '', cvc: '', cardholder: '' })
  const [editForm, setEditForm] = useState({ cvc: '', cardholder: '', expiresAt: '', note: '', ownerId: '' })
  const [balanceForm, setBalanceForm] = useState({ amount: '', note: '' })

  async function load() {
    const [c, u] = await Promise.all([
      fetch('/api/cards').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ])
    setCards(c)
    setUsers(u)
  }

  useEffect(() => { load() }, [])

  async function addCard(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber: form.cardNumber,
        ownerId: form.ownerId ? Number(form.ownerId) : null,
        balance: Number(form.balance),
        note: form.note,
        expiresAt: form.expiresAt || null,
        cvc: form.cvc || null,
        cardholder: form.cardholder || null,
      }),
    })
    setShowAdd(false)
    setForm({ cardNumber: '', ownerId: '', balance: '0', note: '', expiresAt: '', cvc: '', cardholder: '' })
    load()
  }

  async function toggleStatus(card: Card) {
    await fetch('/api/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: card.id, status: card.status === 'active' ? 'frozen' : 'active' }),
    })
    load()
  }

  function openEdit(card: Card) {
    setEditForm({
      cvc: card.cvc || '',
      cardholder: card.cardholder || '',
      expiresAt: card.expires_at ? card.expires_at.split('T')[0].slice(0, 7) : '',
      note: card.note || '',
      ownerId: card.owner_id ? String(card.owner_id) : '',
    })
    setEditModal(card)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editModal) return
    await fetch('/api/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editModal.id,
        cvc: editForm.cvc || null,
        cardholder: editForm.cardholder || null,
        expiresAt: editForm.expiresAt || null,
        note: editForm.note,
        ownerId: editForm.ownerId ? Number(editForm.ownerId) : null,
      }),
    })
    setEditModal(null)
    load()
  }

  async function deleteCard(id: number) {
    if (!confirm(t('cards.confirmDelete'))) return
    await fetch('/api/cards', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function updateBalance(e: React.FormEvent) {
    e.preventDefault()
    if (!balanceModal) return
    await fetch('/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: balanceModal.id,
        type: balanceType,
        amount: Number(balanceForm.amount),
        note: balanceForm.note,
      }),
    })
    setBalanceModal(null)
    setBalanceForm({ amount: '', note: '' })
    load()
  }

  const filtered = cards.filter(c =>
    c.card_number.includes(search) ||
    (c.owner_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('cards.title')}</h1>
        <Button onClick={() => setShowAdd(true)}>{t('cards.addCard')}</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder={t('common.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Add Card Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold mb-4">{t('cards.addCard')}</h2>
            <form onSubmit={addCard} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('cards.cardNumber')}</Label>
                <Input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.owner')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={form.ownerId}
                  onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}
                >
                  <option value="">{t('cards.noOwner')}</option>
                  {users.filter(u => (u as any).role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('cards.initialBalance')}</Label>
                <Input type="number" min="0" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('common.note')}</Label>
                <Input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.expiresAt')}</Label>
                <Input type="month" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.cvc')}</Label>
                <Input value={form.cvc} maxLength={4} onChange={e => setForm(f => ({ ...f, cvc: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.cardholder')}</Label>
                <Input value={form.cardholder} onChange={e => setForm(f => ({ ...f, cardholder: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-1">{balanceModal.card_number}</h2>
            <p className="text-sm text-zinc-500 mb-4">{t('cards.balance')}: ¥{Number(balanceModal.balance).toFixed(2)}</p>
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant={balanceType === 'topup' ? 'default' : 'outline'} onClick={() => setBalanceType('topup')}>{t('cards.topup')}</Button>
              <Button size="sm" variant={balanceType === 'deduct' ? 'destructive' : 'outline'} onClick={() => setBalanceType('deduct')}>{t('cards.deduct')}</Button>
            </div>
            <form onSubmit={updateBalance} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('cards.amount')}</Label>
                <Input type="number" min="0.01" step="0.01" value={balanceForm.amount} onChange={e => setBalanceForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.note')}</Label>
                <Input value={balanceForm.note} onChange={e => setBalanceForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.confirm')}</Button>
                <Button type="button" variant="outline" onClick={() => setBalanceModal(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Card Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold mb-1">{t('common.edit')} — <span className="font-mono text-sm">{editModal.card_number}</span></h2>
            <form onSubmit={saveEdit} className="space-y-3 mt-4">
              <div className="space-y-1">
                <Label>{t('cards.cardholder')}</Label>
                <Input value={editForm.cardholder} onChange={e => setEditForm(f => ({ ...f, cardholder: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.cvc')}</Label>
                <Input value={editForm.cvc} maxLength={4} onChange={e => setEditForm(f => ({ ...f, cvc: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.expiresAt')}</Label>
                <Input type="month" value={editForm.expiresAt} onChange={e => setEditForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.owner')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={editForm.ownerId}
                  onChange={e => setEditForm(f => ({ ...f, ownerId: e.target.value }))}
                >
                  <option value="">{t('cards.noOwner')}</option>
                  {users.filter(u => (u as any).role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
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
              {[t('cards.cardNumber'), t('cards.owner'), t('cards.balance'), t('common.status'), t('cards.expiresAt'), t('common.note'), t('common.actions')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map(card => (
              <tr key={card.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs">{card.card_number}</td>
                <td className="px-4 py-3 text-zinc-600">{card.owner_name || <span className="text-zinc-400">{t('cards.noOwner')}</span>}</td>
                <td className="px-4 py-3 font-medium">¥{Number(card.balance).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${card.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {t(`common.${card.status as 'active' | 'frozen'}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{card.expires_at ? card.expires_at.split('T')[0] : '—'}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{card.note || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setBalanceModal(card); setBalanceType('topup') }}>{t('cards.topup')}</Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(card)}>{t('common.edit')}</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(card)}>
                      {card.status === 'active' ? t('cards.freeze') : t('cards.unfreeze')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCard(card.id)}>{t('common.delete')}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-zinc-400 text-sm">{t('common.loading')}</p>
        )}
      </div>
    </div>
  )
}
