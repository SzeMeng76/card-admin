'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

interface BitnobCard {
  id: string
  name: string
  masked_pan: string
  status: string
  created_status: string
  display_amount: number
  balance_currency: string
  card_brand: string
  available_actions: string[]
  owner_id: number | null
  owner_name: string | null
  failure_reason?: string
  created_at: string
}

interface CardTx {
  id: string
  type: string
  status: string
  display_amount: number
  currency: string
  description: string
  created_at: string
}

interface User {
  id: number
  username: string
}

const ISSUE_FORM_DEFAULT = {
  ownerId: '', name: '', amount: '', customerType: 'individual',
  firstName: '', lastName: '', email: '', phoneNumber: '', dialCode: '',
  dateOfBirth: '', idType: 'passport', idNumber: '',
  line1: '', city: '', state: '', postalCode: '', country: '',
}

export default function BitnobCardsPage() {
  const t = useTranslations()
  const [cards, setCards] = useState<BitnobCard[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showIssue, setShowIssue] = useState(false)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState('')
  const [issueForm, setIssueForm] = useState(ISSUE_FORM_DEFAULT)

  const [fundModal, setFundModal] = useState<BitnobCard | null>(null)
  const [fundAction, setFundAction] = useState<'fund' | 'withdraw'>('fund')
  const [fundAmount, setFundAmount] = useState('')
  const [funding, setFunding] = useState(false)
  const [fundError, setFundError] = useState('')

  const [txModal, setTxModal] = useState<BitnobCard | null>(null)
  const [txList, setTxList] = useState<CardTx[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txError, setTxError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [cardsRes, usersRes] = await Promise.all([
        fetch('/api/bitnob/cards'),
        fetch('/api/users'),
      ])
      if (!cardsRes.ok) {
        const d = await cardsRes.json().catch(() => ({}))
        setError(d.error || 'Failed to load cards')
        return
      }
      const data = await cardsRes.json()
      setCards(data.cards)
      setUsers(await usersRes.json())
    } catch {
      setError('Failed to load cards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
        const d = await res.json().catch(() => ({}))
        setIssueError(d.error || t('cards.issueFailed'))
        return
      }
      setShowIssue(false)
      setIssueForm(ISSUE_FORM_DEFAULT)
      load()
    } catch {
      setIssueError(t('cards.issueFailed'))
    } finally {
      setIssuing(false)
    }
  }

  async function toggleStatus(card: BitnobCard) {
    const action = card.status === 'active' ? 'freeze' : 'unfreeze'
    const res = await fetch(`/api/bitnob/cards/${card.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed to update card status')
      return
    }
    load()
  }

  async function submitFund(e: React.FormEvent) {
    e.preventDefault()
    if (!fundModal) return
    setFunding(true)
    setFundError('')
    try {
      const res = await fetch(`/api/bitnob/cards/${fundModal.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: fundAction, amount: Number(fundAmount) }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setFundError(d.error || 'Failed')
        return
      }
      setFundModal(null)
      setFundAmount('')
      load()
    } catch {
      setFundError('Failed')
    } finally {
      setFunding(false)
    }
  }

  async function viewTx(card: BitnobCard) {
    setTxModal(card)
    setTxLoading(true)
    setTxError('')
    setTxList([])
    try {
      const res = await fetch(`/api/bitnob/cards/${card.id}/transactions?limit=50`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setTxError(d.error || t('cards.txLoadFailed'))
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

  const activeCards = cards.filter(c => c.created_status === 'completed')
  const failedCards = cards.filter(c => c.created_status === 'failed')

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{t('bitnobCards.title')}</h1>
        <Button onClick={() => setShowIssue(true)} className="w-full sm:w-auto">{t('cards.issueViaBitnob')}</Button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>}

      {/* Issue Card Modal */}
      {showIssue && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-4">{t('cards.issueViaBitnob')}</h2>
            <form onSubmit={issueCard} className="space-y-3">
              {issueError && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{issueError}</div>}
              <div className="space-y-1">
                <Label>{t('cards.owner')}</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={issueForm.ownerId} onChange={e => setIssueForm(f => ({ ...f, ownerId: e.target.value }))}>
                  <option value="">{t('cards.noOwner')}</option>
                  {users.filter((u: any) => u.role !== 'admin').map((u: any) => <option key={u.id} value={u.id}>{u.username}</option>)}
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
                <div className="space-y-1"><Label>{t('cards.firstName')}</Label><Input value={issueForm.firstName} onChange={e => setIssueForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.lastName')}</Label><Input value={issueForm.lastName} onChange={e => setIssueForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>{t('cards.email')}</Label><Input type="email" value={issueForm.email} onChange={e => setIssueForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.dialCode')}</Label><Input placeholder="+60" value={issueForm.dialCode} onChange={e => setIssueForm(f => ({ ...f, dialCode: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.phoneNumber')}</Label><Input value={issueForm.phoneNumber} onChange={e => setIssueForm(f => ({ ...f, phoneNumber: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>{t('cards.dateOfBirth')}</Label><Input type="date" value={issueForm.dateOfBirth} onChange={e => setIssueForm(f => ({ ...f, dateOfBirth: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>{t('cards.idNumber')}</Label><Input value={issueForm.idNumber} onChange={e => setIssueForm(f => ({ ...f, idNumber: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>{t('cards.addressLine1')}</Label><Input value={issueForm.line1} onChange={e => setIssueForm(f => ({ ...f, line1: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.city')}</Label><Input value={issueForm.city} onChange={e => setIssueForm(f => ({ ...f, city: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.state')}</Label><Input value={issueForm.state} onChange={e => setIssueForm(f => ({ ...f, state: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.postalCode')}</Label><Input value={issueForm.postalCode} onChange={e => setIssueForm(f => ({ ...f, postalCode: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.country')}</Label><Input placeholder="MYS" maxLength={3} value={issueForm.country} onChange={e => setIssueForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} required /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={issuing}>{issuing ? t('cards.issuing') : t('cards.issueCard')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowIssue(false); setIssueError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund Modal */}
      {fundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-semibold mb-1">{fundModal.name}</h2>
            <p className="text-sm text-zinc-500 mb-4 font-mono">{fundModal.masked_pan} — ${fundModal.display_amount} {fundModal.balance_currency}</p>
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant={fundAction === 'fund' ? 'default' : 'outline'} onClick={() => setFundAction('fund')}>{t('cards.topup')}</Button>
              <Button size="sm" variant={fundAction === 'withdraw' ? 'destructive' : 'outline'} onClick={() => setFundAction('withdraw')}>{t('cards.deduct')}</Button>
            </div>
            {fundError && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2 mb-3">{fundError}</div>}
            <form onSubmit={submitFund} className="space-y-3">
              <div className="space-y-1"><Label>{t('cards.amount')} (USD)</Label><Input type="number" min="0.01" step="0.01" value={fundAmount} onChange={e => setFundAmount(e.target.value)} required /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={funding}>{funding ? '...' : t('common.confirm')}</Button>
                <Button type="button" variant="outline" onClick={() => { setFundModal(null); setFundAmount(''); setFundError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {txModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-1">{t('cards.viewTx')} — <span className="font-mono text-sm">{txModal.masked_pan}</span></h2>
            <p className="text-sm text-zinc-500 mb-4">{txModal.name}</p>
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
                        <td className="px-3 py-2 font-medium text-xs">${tx.display_amount} {tx.currency}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${tx.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : tx.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{tx.status}</span>
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

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('common.loading')}</div>
      ) : (
        <>
          {activeCards.length === 0 && failedCards.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('cards.noResults')}</div>
          ) : (
            <>
              {activeCards.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-zinc-500 mb-3">{t('bitnobCards.activeCards')} ({activeCards.length})</h2>
                  <div className="hidden sm:block bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                          {[t('cards.cardNumber'), t('cards.cardholder'), t('cards.balance'), t('common.status'), t('cards.owner'), t('common.actions')].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {activeCards.map(card => (
                          <tr key={card.id} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 font-mono text-xs">{card.masked_pan || '—'}</td>
                            <td className="px-4 py-3 text-zinc-600 text-xs">{card.name}</td>
                            <td className="px-4 py-3 font-medium text-xs">${card.display_amount} {card.balance_currency}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${card.status === 'active' ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-100' : 'bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border-red-100'}`}>
                                {card.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">{card.owner_name || <span className="text-zinc-300">{t('cards.noOwner')}</span>}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {card.available_actions.includes('FUND') && (
                                  <Button size="sm" variant="outline" onClick={() => { setFundModal(card); setFundAction('fund') }}>{t('cards.topup')}</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => viewTx(card)}>{t('cards.viewTx')}</Button>
                                {(card.available_actions.includes('FREEZE') || card.available_actions.includes('UNFREEZE') || card.status === 'frozen') && (
                                  <Button size="sm" variant="outline" onClick={() => toggleStatus(card)}>
                                    {card.status === 'active' ? t('cards.freeze') : t('cards.unfreeze')}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="sm:hidden space-y-3 mb-6">
                    {activeCards.map(card => (
                      <div key={card.id} className="bg-white rounded-2xl shadow-md p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-mono text-xs">{card.masked_pan || '—'}</p>
                            <p className="text-sm font-medium mt-0.5">{card.name}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${card.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{card.status}</span>
                        </div>
                        <p className="text-lg font-bold mb-2">${card.display_amount} <span className="text-zinc-400 text-xs font-normal">{card.balance_currency}</span></p>
                        <p className="text-xs text-zinc-500 mb-3">{t('cards.owner')}: <span className="text-zinc-700">{card.owner_name || t('cards.noOwner')}</span></p>
                        <div className="flex flex-wrap gap-1">
                          {card.available_actions.includes('FUND') && <Button size="sm" variant="outline" onClick={() => { setFundModal(card); setFundAction('fund') }}>{t('cards.topup')}</Button>}
                          <Button size="sm" variant="outline" onClick={() => viewTx(card)}>{t('cards.viewTx')}</Button>
                          {(card.available_actions.includes('FREEZE') || card.status === 'frozen') && (
                            <Button size="sm" variant="outline" onClick={() => toggleStatus(card)}>{card.status === 'active' ? t('cards.freeze') : t('cards.unfreeze')}</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {failedCards.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-zinc-500 mb-3">{t('bitnobCards.failedCards')} ({failedCards.length})</h2>
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                          {[t('cards.cardholder'), t('common.createdAt'), t('bitnobCards.failureReason')].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {failedCards.map(card => (
                          <tr key={card.id} className="hover:bg-zinc-50 opacity-60">
                            <td className="px-4 py-3 text-zinc-600 text-xs">{card.name}</td>
                            <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{new Date(card.created_at).toLocaleString()}</td>
                            <td className="px-4 py-3 text-red-500 text-xs">{card.failure_reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
