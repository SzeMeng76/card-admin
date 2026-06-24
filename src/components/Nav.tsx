'use client'

import { useRouter, useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    router.push(`/${locale}/login`)
  }

  function switchLocale() {
    const next = locale === 'zh' ? 'en' : 'zh'
    const newPath = pathname.replace(`/${locale}/`, `/${next}/`)
    router.push(newPath)
  }

  return (
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
          <span className="text-sm text-zinc-500">{username}</span>
          <button onClick={logout} className="text-sm text-zinc-400 hover:text-red-600 transition-colors">
            {t('common.logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}
