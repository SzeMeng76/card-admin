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

const ADD_CUSTOMER_FORM_DEFAULT = {
  customerType: 'individual',
  firstName: '', lastName: '', email: '', phoneNumber: '', dialCode: '',
  dateOfBirth: '', idType: 'passport', idNumber: '',
  line1: '', city: '', state: '', postalCode: '', country: '',
  occupation: '', employmentStatus: 'employed', accountPurpose: '',
  annualSalary: '', expectedMonthlyVolume: '', placeOfBirth: '',
  idFrontImage: '',
}

const ID_TYPES_NO_IMAGE = new Set(['bvn', 'nin'])

const KYC_STATUS_LABEL_KEYS: Record<string, string> = {
  none: 'bitnobCustomers.kycNone',
  initiated: 'bitnobCustomers.kycInitiated',
  pending: 'bitnobCustomers.kycPending',
  approved: 'bitnobCustomers.kycApproved',
  rejected: 'bitnobCustomers.kycRejected',
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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

  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [addingCustomer, setAddingCustomer] = useState(false)
  const [addCustomerError, setAddCustomerError] = useState('')
  const [addCustomerForm, setAddCustomerForm] = useState(ADD_CUSTOMER_FORM_DEFAULT)

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

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()
    setAddingCustomer(true)
    setAddCustomerError('')
    try {
      const res = await fetch('/api/bitnob/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            customer_type: addCustomerForm.customerType,
            first_name: addCustomerForm.firstName,
            last_name: addCustomerForm.lastName,
            email: addCustomerForm.email,
            phone_number: addCustomerForm.phoneNumber,
            dial_code: addCustomerForm.dialCode,
            date_of_birth: addCustomerForm.dateOfBirth,
            id_type: addCustomerForm.idType,
            id_number: addCustomerForm.idNumber,
            line1: addCustomerForm.line1,
            city: addCustomerForm.city,
            state: addCustomerForm.state,
            postal_code: addCustomerForm.postalCode,
            country: addCustomerForm.country,
          },
          occupation: addCustomerForm.occupation,
          employmentStatus: addCustomerForm.employmentStatus,
          accountPurpose: addCustomerForm.accountPurpose,
          annualSalary: addCustomerForm.annualSalary,
          expectedMonthlyVolume: addCustomerForm.expectedMonthlyVolume,
          placeOfBirth: addCustomerForm.placeOfBirth || undefined,
          idFrontImage: ID_TYPES_NO_IMAGE.has(addCustomerForm.idType) ? undefined : (addCustomerForm.idFrontImage || undefined),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setAddCustomerError(d.error || t('bitnobCustomers.addFailed'))
        return
      }
      setShowAddCustomer(false)
      setAddCustomerForm(ADD_CUSTOMER_FORM_DEFAULT)
      load()
    } catch {
      setAddCustomerError(t('bitnobCustomers.addFailed'))
    } finally {
      setAddingCustomer(false)
    }
  }

  function kycStatusLabel(status: string) {
    const key = KYC_STATUS_LABEL_KEYS[status]
    return key ? t(key) : (status || t('bitnobCustomers.kycUnknown'))
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={t('bitnobCustomers.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button onClick={() => setShowAddCustomer(true)} className="w-full sm:w-auto">{t('bitnobCustomers.addCustomer')}</Button>
        </div>
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
                <Input type="number" min="3" max="2500" step="0.01" value={issueForm.amount} onChange={e => setIssueForm(f => ({ ...f, amount: e.target.value }))} required />
                <p className="text-xs text-zinc-400">{t('cards.fundingAmountHint')}</p>
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

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-4">{t('bitnobCustomers.addCustomer')}</h2>
            <form onSubmit={addCustomer} className="space-y-3">
              {addCustomerError && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{addCustomerError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('cards.customerType')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={addCustomerForm.customerType} onChange={e => setAddCustomerForm(f => ({ ...f, customerType: e.target.value }))}>
                    <option value="individual">{t('cards.individual')}</option>
                    <option value="business">{t('cards.business')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t('cards.idType')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={addCustomerForm.idType} onChange={e => setAddCustomerForm(f => ({ ...f, idType: e.target.value }))}>
                    <option value="passport">{t('cards.passport')}</option>
                    <option value="national_id">{t('cards.nationalId')}</option>
                    <option value="drivers_license">{t('cards.driversLicense')}</option>
                    <option value="bvn">{t('cards.bvn')}</option>
                    <option value="nin">{t('cards.nin')}</option>
                    <option value="vnin">{t('cards.vnin')}</option>
                    <option value="voters_card">{t('cards.votersCard')}</option>
                    <option value="ghana_card">{t('cards.ghanaCard')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.firstName')}</Label><Input value={addCustomerForm.firstName} onChange={e => setAddCustomerForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.lastName')}</Label><Input value={addCustomerForm.lastName} onChange={e => setAddCustomerForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>{t('cards.email')}</Label><Input type="email" value={addCustomerForm.email} onChange={e => setAddCustomerForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.dialCode')}</Label><Input placeholder="+60" value={addCustomerForm.dialCode} onChange={e => setAddCustomerForm(f => ({ ...f, dialCode: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.phoneNumber')}</Label><Input value={addCustomerForm.phoneNumber} onChange={e => setAddCustomerForm(f => ({ ...f, phoneNumber: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>{t('cards.dateOfBirth')}</Label><Input type="date" value={addCustomerForm.dateOfBirth} onChange={e => setAddCustomerForm(f => ({ ...f, dateOfBirth: e.target.value }))} required /></div>
              <div className="space-y-1"><Label>{t('cards.idNumber')}</Label><Input value={addCustomerForm.idNumber} onChange={e => setAddCustomerForm(f => ({ ...f, idNumber: e.target.value }))} required /></div>
              {!ID_TYPES_NO_IMAGE.has(addCustomerForm.idType) && (
                <div className="space-y-1">
                  <Label>{t('cards.idFrontImage')}</Label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const dataUri = await fileToDataUri(file)
                      setAddCustomerForm(f => ({ ...f, idFrontImage: dataUri }))
                    }}
                    required
                  />
                </div>
              )}
              <div className="space-y-1"><Label>{t('cards.addressLine1')}</Label><Input value={addCustomerForm.line1} onChange={e => setAddCustomerForm(f => ({ ...f, line1: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.city')}</Label><Input value={addCustomerForm.city} onChange={e => setAddCustomerForm(f => ({ ...f, city: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.state')}</Label><Input value={addCustomerForm.state} onChange={e => setAddCustomerForm(f => ({ ...f, state: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.postalCode')}</Label><Input value={addCustomerForm.postalCode} onChange={e => setAddCustomerForm(f => ({ ...f, postalCode: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.country')}</Label><Input placeholder="MYS" maxLength={3} value={addCustomerForm.country} onChange={e => setAddCustomerForm(f => ({ ...f, country: e.target.value.toUpperCase() }))} required /></div>
              </div>
              <div className="pt-2 border-t border-zinc-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.occupation')}</Label><Input value={addCustomerForm.occupation} onChange={e => setAddCustomerForm(f => ({ ...f, occupation: e.target.value }))} required /></div>
                <div className="space-y-1">
                  <Label>{t('cards.employmentStatus')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={addCustomerForm.employmentStatus} onChange={e => setAddCustomerForm(f => ({ ...f, employmentStatus: e.target.value }))}>
                    <option value="employed">{t('cards.employed')}</option>
                    <option value="self_employed">{t('cards.selfEmployed')}</option>
                    <option value="unemployed">{t('cards.unemployed')}</option>
                    <option value="retired">{t('cards.retired')}</option>
                    <option value="student">{t('cards.student')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1"><Label>{t('cards.accountPurpose')}</Label><Input value={addCustomerForm.accountPurpose} onChange={e => setAddCustomerForm(f => ({ ...f, accountPurpose: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>{t('cards.annualSalary')}</Label><Input type="number" min="0" value={addCustomerForm.annualSalary} onChange={e => setAddCustomerForm(f => ({ ...f, annualSalary: e.target.value }))} required /></div>
                <div className="space-y-1"><Label>{t('cards.expectedMonthlyVolume')}</Label><Input type="number" min="0" value={addCustomerForm.expectedMonthlyVolume} onChange={e => setAddCustomerForm(f => ({ ...f, expectedMonthlyVolume: e.target.value }))} required /></div>
              </div>
              <div className="space-y-1"><Label>{t('cards.placeOfBirth')}</Label><Input value={addCustomerForm.placeOfBirth} onChange={e => setAddCustomerForm(f => ({ ...f, placeOfBirth: e.target.value }))} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={addingCustomer}>{addingCustomer ? t('bitnobCustomers.adding') : t('bitnobCustomers.addCustomer')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowAddCustomer(false); setAddCustomerError('') }}>{t('common.cancel')}</Button>
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
                        {kycStatusLabel(customer.kyc_status)}
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
                    {kycStatusLabel(customer.kyc_status)}
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
