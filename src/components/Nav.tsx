'use client'

import { useRouter, useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Input, Label } from './ui/input'

interface NavProps {
  role: 'admin' | 'user'
  username: string
}

export default function Nav({ role, username }: NavProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string
  const [showChangePw, setShowChangePw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [showTelegram, setShowTelegram] = useState(false)
  const [tgLink, setTgLink] = useState('')
  const [tgLoading, setTgLoading] = useState(false)

  const adminLinks = [
    { href: `/${locale}/dashboard`, label: t('nav.dashboard') },
    { href: `/${locale}/dashboard/cards`, label: t('nav.cards') },
    { href: `/${locale}/dashboard/users`, label: t('nav.users') },
    { href: `/${locale}/dashboard/transactions`, label: t('nav.transactions') },
  ]
  const userLinks = [
    { href: `/${locale}/portal`, label: t('nav.portal') },
    { href: `/${locale}/portal/transactions`, label: t('nav.transactions') },
  ]
  const links = role === 'admin' ? adminLinks : userLinks

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = `/${locale}/login`
  }

  function switchLocale() {
    const next = locale === 'zh' ? 'en' : 'zh'
    const newPath = pathname.replace(`/${locale}/`, `/${next}/`)
    router.push(newPath)
  }

  async function openTelegram() {
    setShowTelegram(true)
    setTgLink('')
    setTgLoading(true)
    const res = await fetch('/api/telegram')
    if (res.ok) {
      const data = await res.json()
      setTgLink(data.url)
    }
    setTgLoading(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.next !== pwForm.confirm) {
      setPwError(t('common.passwordMismatch'))
      return
    }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    })
    if (res.ok) {
      setShowChangePw(false)
      setPwForm({ current: '', next: '', confirm: '' })
    } else {
      const data = await res.json()
      setPwError(data.error === 'Current password incorrect' ? t('common.wrongPassword') : data.error)
    }
  }

  return (
    <>
      <nav className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-6">
          <span className="font-semibold text-zinc-900 text-sm">Card Admin</span>
          <div className="flex items-center gap-1 flex-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === link.href
                    ? 'bg-zinc-100 text-zinc-900 font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={switchLocale} className="text-xs text-zinc-400 hover:text-zinc-600">
              {locale === 'zh' ? 'EN' : '中文'}
            </button>
            <button onClick={openTelegram} className="text-sm text-zinc-400 hover:text-blue-500 transition-colors" title="绑定 Telegram">
              TG
            </button>
            <button onClick={() => setShowChangePw(true)} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              {username}
            </button>
            <button onClick={logout} className="text-sm text-zinc-400 hover:text-red-600 transition-colors">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </nav>

      {showTelegram && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-2">绑定 Telegram</h2>
            <p className="text-sm text-zinc-500 mb-4">点击下方链接，在 Telegram 中完成绑定。链接 5 分钟内有效。</p>
            {tgLoading && <p className="text-sm text-zinc-400">生成链接中...</p>}
            {tgLink && (
              <a href={tgLink} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                打开 Telegram 完成绑定
              </a>
            )}
            <div className="flex gap-2 mt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowTelegram(false)}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {showChangePw && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold mb-4">{t('common.changePassword')}</h2>
            <form onSubmit={changePassword} className="space-y-3">
              <div className="space-y-1">
                <Label>{t('common.currentPassword')}</Label>
                <Input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.newPassword')}</Label>
                <Input type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>{t('common.confirmPassword')}</Label>
                <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="submit">{t('common.save')}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowChangePw(false); setPwError('') }}>{t('common.cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
