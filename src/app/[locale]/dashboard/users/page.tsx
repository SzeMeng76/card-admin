'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

interface User {
  id: number
  username: string
  role: string
  created_at: string
  telegram_id: number | null
}

export default function UsersPage() {
  const t = useTranslations()
  const [users, setUsers] = useState<User[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [resetModal, setResetModal] = useState<User | null>(null)
  const [tgModal, setTgModal] = useState<User | null>(null)
  const [tgId, setTgId] = useState('')
  const [form, setForm] = useState({ username: '', password: '', role: 'user' })
  const [newPassword, setNewPassword] = useState('')

  async function load() {
    const data = await fetch('/api/users').then(r => r.json())
    setUsers(data)
  }

  useEffect(() => { load() }, [])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowAdd(false)
    setForm({ username: '', password: '', role: 'user' })
    load()
  }

  async function deleteUser(id: number) {
    if (!confirm(t('users.confirmDelete'))) return
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetModal) return
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resetModal.id, password: newPassword }),
    })
    setResetModal(null)
    setNewPassword('')
  }

  async function setTelegramId(e: React.FormEvent) {
    e.preventDefault()
    if (!tgModal) return
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tgModal.id, telegram_id: tgId ? Number(tgId) : null }),
    })
    setTgModal(null)
    setTgId('')
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('users.title')}</h1>
        <Button onClick={() => setShowAdd(true)}>{t('users.addUser')}</Button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-4">{t('users.addUser')}</h2>
            <form onSubmit={addUser} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('common.username')}</Label>
                <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.password')}</Label>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('users.role')}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="user">{t('users.user')}</option>
                  <option value="admin">{t('users.admin')}</option>
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

      {tgModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-1">绑定 Telegram — {tgModal.username}</h2>
            <p className="text-xs text-zinc-400 mb-4">填入用户的 Telegram 数字 ID，留空则解除绑定。</p>
            <form onSubmit={setTelegramId} className="space-y-3">
              <div className="space-y-1">
                <Label>Telegram ID</Label>
                <Input
                  placeholder="例如：123456789"
                  value={tgId}
                  onChange={e => setTgId(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setTgModal(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-4">{t('users.resetPassword')} — {resetModal.username}</h2>
            <form onSubmit={resetPassword} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('users.newPassword')}</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => setResetModal(null)}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {[t('common.username'), t('users.role'), 'Telegram', t('common.createdAt'), t('common.actions')].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {t(`users.${user.role as 'admin' | 'user'}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {user.telegram_id ? <span className="text-blue-500">{user.telegram_id}</span> : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{user.created_at.split('T')[0]}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setTgModal(user); setTgId(user.telegram_id ? String(user.telegram_id) : '') }}>TG</Button>
                    <Button size="sm" variant="outline" onClick={() => setResetModal(user)}>{t('users.resetPassword')}</Button>
                    {user.role !== 'admin' && (
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>{t('common.delete')}</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
