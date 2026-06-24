'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      const data = await res.json()
      window.location.href = `/${locale}/${data.role === 'admin' ? 'dashboard' : 'portal'}`
    } else {
      setError(t('login.error'))
      setLoading(false)
    }
  }

  function switchLocale() {
    const next = locale === 'zh' ? 'en' : 'zh'
    router.push(`/${next}/login`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">{t('login.title')}</h1>
          <p className="text-zinc-500 mt-1 text-sm">{t('login.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">{t('common.username')}</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('common.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('common.login')}
            </Button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button onClick={switchLocale} className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
            {locale === 'zh' ? 'English' : '中文'}
          </button>
        </div>
      </div>
    </div>
  )
}
