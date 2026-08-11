'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import Footer from '@/components/Footer'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-zinc-50 to-zinc-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-4">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('login.title')}</h1>
          <p className="text-zinc-500 mt-2 text-sm">{t('login.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
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

      <div className="mt-10">
        <Footer />
      </div>
    </div>
  )
}
