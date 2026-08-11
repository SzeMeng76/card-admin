'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { cs } from '@/lib/currency'

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
  currency: string
  created_at: string
  expires_at: string | null
  billing_address: string | null
  provider?: string
  provider_card_id?: string | null
}

interface User {
  id: number
  username: string
}

interface BitnobCardTx {
  id: string
  type: string
  status: string
  display_amount: number
  currency: string
  fee_amount: string
  description: string
  created_at: string
}

export default function CardsPage() {
  const t = useTranslations()
  const [cards, setCards] = useState<Card[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterOwnerId, setFilterOwnerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showIssue, setShowIssue] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState('')
  const [editModal, setEditModal] = useState<Card | null>(null)
  const [balanceModal, setBalanceModal] = useState<Card | null>(null)
  const [balanceType, setBalanceType] = useState<'topup' | 'deduct'>('topup')
  const [txModal, setTxModal] = useState<Card | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')
  const [txList, setTxList] = useState<BitnobCardTx[]>([])

  const [form, setForm] = useState({ cardNumber: '', ownerId: '', balance: '0', note: '', expiresAt: '', cvc: '', cardholder: '', currency: 'USD', billingAddress: '' })
  const [editForm, setEditForm] = useState({ cvc: '', cardholder: '', expiresAt: '', note: '', ownerId: '', currency: 'USD', billingAddress: '' })
  const [balanceForm, setBalanceForm] = useState({ amount: '', note: '', createdAt: '' })
  const [issueForm, setIssueForm] = useState({
    ownerId: '',
    name: '',
    amount: '',
    customerType: 'individual',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dialCode: '',
    dateOfBirth: '',
    idType: 'passport',
    idNumber: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  async function load() {
    setLoading(true)
    try {
      const [c, u] = await Promise.all([
        fetch('/api/cards').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ])
      setCards(c)
      setUsers(u)
    } finally {
      setLoading(false)
    }
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
        currency: form.currency,
        billingAddress: form.billingAddress || null,
      }),
    })
    setShowAdd(false)
    setForm({ cardNumber: '', ownerId: '', balance: '0', note: '', expiresAt: '', cvc: '', cardholder: '', currency: 'USD', billingAddress: '' })
    load()
  }

  async function issueCard(e: React.FormEvent) {
    e.preventDefault()
    setIssuing(true)
    setIssueError('')
    try {
      const res = await fetch('/api/cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: issueForm.name,
          amount: Number(issueForm.amount),
          currency: 'USD',
          ownerId: issueForm.ownerId ? Number(issueForm.ownerId) : null,
          customer: {
            customer_type: issueForm.customerType,
            first_name: issueForm.firstName,
            last_name: issueForm.lastName,
            email: issueForm.email,
            phone_number: issueForm.phoneNumber,
            dial_code: issueForm.dialCode,
            date_of_birth: issueForm.dateOfBirth,
            id_type: issueForm.idType,
            id_number: issueForm.idNumber,
            line1: issueForm.line1,
            city: issueForm.city,
            state: issueForm.state,
            postal_code: issueForm.postalCode,
            country: issueForm.country,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setIssueError(data.error || t('cards.issueFailed'))
        return
      }
      setShowIssue(false)
      setIssueForm({
        ownerId: '', name: '', amount: '', customerType: 'individual',
        firstName: '', lastName: '', email: '', phoneNumber: '', dialCode: '',
        dateOfBirth: '', idType: 'passport', idNumber: '', line1: '', city: '', state: '', postalCode: '', country: '',
      })
      load()
    } catch {
      setIssueError(t('cards.issueFailed'))
    } finally {
      setIssuing(false)
    }
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
      currency: card.currency || 'USD',
      billingAddress: card.billing_address || '',
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
        currency: editForm.currency,
        billingAddress: editForm.billingAddress || null,
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
        ...(balanceForm.createdAt ? { createdAt: balanceForm.createdAt } : {}),
      }),
    })
    setBalanceModal(null)
    setBalanceForm({ amount: '', note: '', createdAt: '' })
    load()
  }

  async function viewTransactions(card: Card) {
    setTxModal(card)
    setTxLoading(true)
    setTxError('')
    setTxList([])
    try {
      const res = await fetch(`/api/bitnob/cards/${card.provider_card_id}/transactions?limit=50`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setTxError(data.error || t('cards.txLoadFailed'))
        return
      }
      const data = await res.json()
      setTxList(data.transactions)
    } catch {
      setTxError(t('cards.txLoadFailed'))
    } finally {
      setTxLoading(false)
    }
  }

  const filtered = cards.filter(c => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term ||
      c.card_number.toLowerCase().includes(term) ||
      (c.owner_name || '').toLowerCase().includes(term)
    const matchesOwner = !filterOwnerId ||
      (filterOwnerId === 'none' ? c.owner_id === null : String(c.owner_id) === filterOwnerId)
    return matchesSearch && matchesOwner
  })

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{t('cards.title')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(true)} className="w-full sm:w-auto">{t('cards.addCard')}</Button>
          <Button onClick={() => setShowIssue(true)} variant="outline" className="w-full sm:w-auto">{t('cards.issueViaBitnob')}</Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder={t('cards.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <select
          className="flex h-10 w-full sm:w-auto rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          value={filterOwnerId}
          onChange={e => setFilterOwnerId(e.target.value)}
        >
          <option value="">{t('cards.allOwners')}</option>
          <option value="none">{t('cards.noOwner')}</option>
          {users.filter(u => (u as any).role !== 'admin').map(u => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>

      {/* Add Card Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-1">
                <Label>{t('cards.billingAddress')}</Label>
                <Input value={form.billingAddress} onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))} placeholder="e.g. 3401 N. Miami Ave. Ste 230, Miami FL 33127" />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.currency')}</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="HKD">HKD (HK$)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue via Bitnob Modal */}
      {showIssue && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-4">{t('cards.issueViaBitnob')}</h2>
            <form onSubmit={issueCard} className="space-y-3">
              {issueError && (
                <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{issueError}</div>
              )}
              <div className="space-y-1">
                <Label>{t('cards.owner')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={issueForm.ownerId}
                  onChange={e => setIssueForm(f => ({ ...f, ownerId: e.target.value }))}
                >
                  <option value="">{t('cards.noOwner')}</option>
                  {users.filter(u => (u as any).role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('cards.cardholderName')}</Label>
                <Input value={issueForm.name} onChange={e => setIssueForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.fundingAmount')}</Label>
                <Input type="number" min="1" step="0.01" value={issueForm.amount} onChange={e => setIssueForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>

              <div className="pt-2 border-t border-zinc-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.customerType')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={issueForm.customerType} onChange={e => setIssueForm(f => ({ ...f, customerType: e.target.value }))}>
                    <option value="individual">{t('cards.individual')}</option>
                    <option value="business">{t('cards.business')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.idType')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={issueForm.idType} onChange={e => setIssueForm(f => ({ ...f, idType: e.target.value }))}>
                    <option value="passport">{t('cards.passport')}</option>
                    <option value="national_id">{t('cards.nationalId')}</option>
                    <option value="drivers_license">{t('cards.driversLicense')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.firstName')}</Label>
                  <Input value={issueForm.firstName} onChange={e => setIssueForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.lastName')}</Label>
                  <Input value={issueForm.lastName} onChange={e => setIssueForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('cards.email')}</Label>
                <Input type="email" value={issueForm.email} onChange={e => setIssueForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.dialCode')}</Label>
                  <Input placeholder="+234" value={issueForm.dialCode} onChange={e => setIssueForm(f => ({ ...f, dialCode: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.phoneNumber')}</Label>
                  <Input value={issueForm.phoneNumber} onChange={e => setIssueForm(f => ({ ...f, phoneNumber: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('cards.dateOfBirth')}</Label>
                <Input type="date" value={issueForm.dateOfBirth} onChange={e => setIssueForm(f => ({ ...f, dateOfBirth: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.idNumber')}</Label>
                <Input value={issueForm.idNumber} onChange={e => setIssueForm(f => ({ ...f, idNumber: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.addressLine1')}</Label>
                <Input value={issueForm.line1} onChange={e => setIssueForm(f => ({ ...f, line1: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.city')}</Label>
                  <Input value={issueForm.city} onChange={e => setIssueForm(f => ({ ...f, city: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.state')}</Label>
                  <Input value={issueForm.state} onChange={e => setIssueForm(f => ({ ...f, state: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.postalCode')}</Label>
                  <Input value={issueForm.postalCode} onChange={e => setIssueForm(f => ({ ...f, postalCode: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.country')}</Label>
                  <Input placeholder="USA" maxLength={3} value={issueForm.country} onChange={e => setIssueForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} required />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={issuing}>{issuing ? t('cards.issuing') : t('cards.issueCard')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowIssue(false); setIssueError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Modal */}
      {balanceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-1">{balanceModal.card_number}</h2>
            <p className="text-sm text-zinc-500 mb-4">{t('cards.balance')}: {cs(balanceModal.currency)}{Number(balanceModal.balance).toFixed(2)}</p>
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
              <div className="space-y-1">
                <Label>交易时间（可选）</Label>
                <Input type="datetime-local" value={balanceForm.createdAt} onChange={e => setBalanceForm(f => ({ ...f, createdAt: e.target.value }))} />
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-1">
                <Label>{t('cards.billingAddress')}</Label>
                <Input value={editForm.billingAddress} onChange={e => setEditForm(f => ({ ...f, billingAddress: e.target.value }))} placeholder="e.g. 3401 N. Miami Ave. Ste 230, Miami FL 33127" />
              </div>
              <div className="space-y-1">
                <Label>{t('cards.currency')}</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={editForm.currency} onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="HKD">HKD (HK$)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setEditModal(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">
          {t('common.loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">
          {t('cards.noResults')}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {[t('cards.cardNumber'), t('cards.owner'), t('cards.balance'), t('common.status'), t('cards.expiresAt'), t('cards.billingAddress'), t('common.note'), t('common.actions')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(card => (
                  <tr key={card.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs">{card.card_number}</td>
                    <td className="px-4 py-3 text-zinc-600">{card.owner_name || <span className="text-zinc-400">{t('cards.noOwner')}</span>}</td>
                    <td className="px-4 py-3 font-medium">{cs(card.currency)}{Number(card.balance).toFixed(2)} <span className="text-zinc-400 text-xs font-normal">{card.currency}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${card.status === 'active' ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-100' : 'bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-100'}`}>
                        {t(`common.${card.status as 'active' | 'frozen'}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{card.expires_at ? (() => { const p = card.expires_at.slice(0,7).split('-'); return `${p[1]}/${p[0]}` })() : '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-[160px] truncate" title={card.billing_address || ''}>{card.billing_address || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{card.note || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setBalanceModal(card); setBalanceType('topup') }}>{t('cards.topup')}</Button>
                        {card.provider === 'bitnob' && card.provider_card_id && (
                          <Button size="sm" variant="outline" onClick={() => viewTransactions(card)}>{t('cards.viewTx')}</Button>
                        )}
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
          </div>

          {/* Mobile stacked cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map(card => (
              <div key={card.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs">{card.card_number}</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${card.status === 'active' ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-100' : 'bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-100'}`}>
                    {t(`common.${card.status as 'active' | 'frozen'}`)}
                  </span>
                </div>
                <div className="text-lg font-medium mb-2">
                  {cs(card.currency)}{Number(card.balance).toFixed(2)} <span className="text-zinc-400 text-xs font-normal">{card.currency}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-xs text-zinc-500 mb-3">
                  <div>{t('cards.owner')}: <span className="text-zinc-700">{card.owner_name || t('cards.noOwner')}</span></div>
                  <div>{t('cards.expiresAt')}: <span className="text-zinc-700">{card.expires_at ? (() => { const p = card.expires_at!.slice(0,7).split('-'); return `${p[1]}/${p[0]}` })() : '—'}</span></div>
                  {card.billing_address && <div className="col-span-2 truncate">{t('cards.billingAddress')}: <span className="text-zinc-700">{card.billing_address}</span></div>}
                  {card.note && <div className="col-span-2">{t('common.note')}: <span className="text-zinc-700">{card.note}</span></div>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setBalanceModal(card); setBalanceType('topup') }}>{t('cards.topup')}</Button>
                  {card.provider === 'bitnob' && card.provider_card_id && (
                    <Button size="sm" variant="outline" onClick={() => viewTransactions(card)}>{t('cards.viewTx')}</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(card)}>{t('common.edit')}</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(card)}>
                    {card.status === 'active' ? t('cards.freeze') : t('cards.unfreeze')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCard(card.id)}>{t('common.delete')}</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bitnob Card Transactions Modal */}
      {txModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-1">{t('cards.viewTx')} — <span className="font-mono text-sm">{txModal.card_number}</span></h2>
            <p className="text-sm text-zinc-500 mb-4">{txModal.cardholder}</p>
            {txLoading ? (
              <div className="py-12 text-center text-zinc-400 text-sm">{t('common.loading')}</div>
            ) : txError ? (
              <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{txError}</div>
            ) : txList.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-sm">{t('wallet.noTransactions')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      {[t('wallet.txType'), t('wallet.txAmount'), t('common.status'), t('common.note'), t('common.createdAt')].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {txList.map(tx => (
                      <tr key={tx.id} className="hover:bg-zinc-50">
                        <td className="px-3 py-2 text-zinc-600 text-xs capitalize">{tx.type}</td>
                        <td className="px-3 py-2 font-medium text-xs">{cs(tx.currency)}{tx.display_amount}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            tx.status === 'completed'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-100'
                              : tx.status === 'failed'
                                ? 'bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border-red-100'
                                : 'bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700 border-amber-100'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-400 text-xs">{tx.description || '—'}</td>
                        <td className="px-3 py-2 text-zinc-400 text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTxModal(null)}>{t('common.cancel')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
