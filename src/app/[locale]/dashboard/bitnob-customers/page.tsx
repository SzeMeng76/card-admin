'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

interface BitnobCustomer {
  id: string
  customer_type: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  dial_code: string
  id_type: string
  id_number: string
  city: string
  country: string
  is_active: boolean
  kyc_status: string
  created_at: string
}

interface User {
  id: number
  username: string
}

const ISSUE_FORM_DEFAULT = {
  ownerId: '', name: '', amount: '', contactlessPayment: true,
}

export default function BitnobCustomersPage() {
  const t = useTranslations()
  const [customers, setCustomers] = useState<BitnobCustomer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [issueTarget, setIssueTarget] = useState<BitnobCustomer | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState('')
  const [issueForm, setIssueForm] = useState(ISSUE_FORM_DEFAULT)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [customersRes, usersRes] = await Promise.all([
        fetch('/api/bitnob/customers'),
        fetch('/api/users'),
      ])
      if (!customersRes.ok) {
        const d = await customersRes.json().catch(() => ({}))
        setError(d.error || t('bitnobCustomers.loadFailed'))
        return
      }
      const data = await customersRes.json()
      setCustomers(data.customers)
      setUsers(await usersRes.json())
    } catch {
      setError(t('bitnobCustomers.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openIssue(customer: BitnobCustomer) {
    setIssueTarget(customer)
    setIssueForm({ ...ISSUE_FORM_DEFAULT, name: `${customer.first_name} ${customer.last_name}`.trim() })
    setIssueError('')
  }

  async function issueCard(e: React.FormEvent) {
    e.preventDefault()
    if (!issueTarget) return
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
          contactlessPayment: issueForm.contactlessPayment,
          customerId: issueTarget.id,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setIssueError(d.error || t('cards.issueFailed'))
        return
      }
      setIssueTarget(null)
      setIssueForm(ISSUE_FORM_DEFAULT)
    } catch {
      setIssueError(t('cards.issueFailed'))
    } finally {
      setIssuing(false)
    }
  }

  const filtered = customers.filter(c => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{t('bitnobCustomers.title')}</h1>
        <Input
          placeholder={t('bitnobCustomers.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>}

      {/* Issue Card Modal */}
      {issueTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl my-8">
            <h2 className="font-semibold mb-1">{t('cards.issueCard')}</h2>
            <p className="text-sm text-zinc-500 mb-4">{issueTarget.first_name} {issueTarget.last_name} — {issueTarget.email}</p>
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
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="contactlessPaymentExisting"
                  checked={issueForm.contactlessPayment}
                  onChange={e => setIssueForm(f => ({ ...f, contactlessPayment: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="contactlessPaymentExisting" className="cursor-pointer font-normal">{t('cards.contactlessPayment')}</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={issuing}>{issuing ? t('cards.issuing') : t('cards.issueCard')}</Button>
                <Button type="button" variant="outline" onClick={() => { setIssueTarget(null); setIssueError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('cards.noResults')}</div>
      ) : (
        <>
          <div className="hidden sm:block bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  {[t('bitnobCustomers.name'), t('cards.email'), t('bitnobCustomers.idInfo'), t('bitnobCustomers.kycStatus'), t('bitnobCustomers.activeStatus'), t('common.createdAt'), t('common.actions')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-700 text-xs">{customer.first_name} {customer.last_name}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{customer.email}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs uppercase">{customer.id_type} · {customer.country}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${customer.kyc_status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : customer.kyc_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'}`}>
                        {customer.kyc_status || t('bitnobCustomers.kycUnknown')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${customer.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        {customer.is_active ? t('common.active') : t('bitnobCustomers.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{new Date(customer.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openIssue(customer)}>{t('bitnobCustomers.issueForCustomer')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {filtered.map(customer => (
              <div key={customer.id} className="bg-white rounded-2xl shadow-md p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{customer.first_name} {customer.last_name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{customer.email}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${customer.kyc_status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : customer.kyc_status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'}`}>
                    {customer.kyc_status || t('bitnobCustomers.kycUnknown')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${customer.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {customer.is_active ? t('common.active') : t('bitnobCustomers.inactive')}
                  </span>
                  <p className="text-xs text-zinc-500 uppercase">{customer.id_type} · {customer.country}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openIssue(customer)}>{t('bitnobCustomers.issueForCustomer')}</Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
