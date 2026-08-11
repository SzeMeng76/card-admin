'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

interface Account {
  account_id: string
  account_number: string
  currency: string
  ledger_balance: string
  available_balance: string
  ledger_balance_formatted: string
  available_balance_formatted: string
}

interface Address {
  id: string
  chain: string
  address: string
  status: string
  label: string | null
  created_at?: string
}

interface Transaction {
  transaction_id: string
  currency: string
  type: string
  state: string
  reference: string
  created_at: string
  amount_formatted: string
  fee_formatted: string
  side: 'Credit' | 'Debit'
}

const CHAINS = ['bitcoin', 'ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'solana', 'stellar', 'tron', 'plasma']

export default function WalletPage() {
  const t = useTranslations()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [chain, setChain] = useState('bitcoin')
  const [label, setLabel] = useState('')
  const [copied, setCopied] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [balRes, addrRes, txRes] = await Promise.all([
        fetch('/api/bitnob/balances'),
        fetch('/api/bitnob/addresses'),
        fetch('/api/bitnob/transactions?limit=20'),
      ])
      const failed = [balRes, addrRes, txRes].find(r => !r.ok)
      if (failed) {
        const data = await failed.json().catch(() => ({}))
        setError(data.error || t('wallet.loadFailed'))
        return
      }
      setAccounts(await balRes.json())
      setAddresses(await addrRes.json())
      setTransactions((await txRes.json()).transactions)
    } catch {
      setError(t('wallet.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function generateAddress(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/bitnob/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, label: label || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setGenError(data.error || t('wallet.generateFailed'))
        return
      }
      setShowGenerate(false)
      setLabel('')
      load()
    } catch {
      setGenError(t('wallet.generateFailed'))
    } finally {
      setGenerating(false)
    }
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr)
    setCopied(addr)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{t('wallet.title')}</h1>
        <Button onClick={() => setShowGenerate(true)} className="w-full sm:w-auto">{t('wallet.generateAddress')}</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{error}</div>
      )}

      {/* Generate Address Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold mb-4">{t('wallet.generateAddress')}</h2>
            <form onSubmit={generateAddress} className="space-y-3">
              {genError && (
                <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">{genError}</div>
              )}
              <div className="space-y-1">
                <Label>{t('wallet.chain')}</Label>
                <select className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={chain} onChange={e => setChain(e.target.value)}>
                  {CHAINS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t('wallet.label')}</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder={t('wallet.labelPlaceholder')} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={generating}>{generating ? t('cards.issuing') : t('common.confirm')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowGenerate(false); setGenError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('common.loading')}</div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-zinc-500 mb-3">{t('wallet.balances')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {accounts.map(a => (
              <div key={a.account_id} className="rounded-2xl border border-zinc-100 bg-white shadow-md p-5">
                <p className="text-xs text-zinc-500 mb-1">{a.currency}</p>
                <p className="text-xl font-bold text-zinc-900">{a.available_balance_formatted}</p>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-semibold text-zinc-500 mb-3">{t('wallet.depositAddresses')}</h2>
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('wallet.noAddresses')}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    {[t('wallet.chain'), t('wallet.address'), t('wallet.label'), t('common.status'), t('common.actions')].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {addresses.map(a => (
                    <tr key={a.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-600 uppercase text-xs font-medium">{a.chain}</td>
                      <td className="px-4 py-3 font-mono text-xs break-all">{a.address}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{a.label || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border border-green-100">
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => copyAddress(a.address)}>
                          {copied === a.address ? t('wallet.copied') : t('wallet.copy')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="text-sm font-semibold text-zinc-500 mb-3 mt-8">{t('wallet.recentTransactions')}</h2>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md py-16 text-center text-zinc-400 text-sm">{t('wallet.noTransactions')}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    {[t('wallet.txType'), t('wallet.txAmount'), t('common.status'), t('common.createdAt')].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map(tx => (
                    <tr key={tx.transaction_id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-600 text-xs">{tx.type}</td>
                      <td className={`px-4 py-3 font-medium text-xs ${tx.side === 'Credit' ? 'text-green-600' : 'text-zinc-700'}`}>
                        {tx.amount_formatted}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          tx.state === 'SETTLED'
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-100'
                            : tx.state === 'FAILED' || tx.state === 'REVERSED'
                              ? 'bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border-red-100'
                              : 'bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700 border-amber-100'
                        }`}>
                          {tx.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
