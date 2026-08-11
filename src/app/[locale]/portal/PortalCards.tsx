'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Wifi } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cs } from '@/lib/currency'

interface CardData {
  id: number
  card_number: string
  balance: number
  status: string
  expires_at: string | null
  cvc: string | null
  cardholder: string | null
  currency: string
  note: string
}

export default function PortalCards() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [cards, setCards] = useState<CardData[]>([])

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then(setCards)
  }, [])

  function formatExpiry(val: string | null) {
    if (!val) return '—'
    const parts = val.split('-')
    if (parts.length >= 2) return `${parts[1]}/${parts[0].slice(2)}`
    return val
  }

  return (
    <div>
      <h2 className="font-semibold mb-4 text-zinc-700">{t('portal.myCards')}</h2>
      {cards.length === 0 ? (
        <p className="text-zinc-400">{t('portal.noCards')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.id} className="cursor-pointer group" onClick={() => router.push(`/${locale}/portal/cards/${card.id}`)}>
              <Card className="overflow-hidden">
                <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-zinc-900 text-white p-5 space-y-4 overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -right-2 top-12 w-20 h-20 rounded-full bg-white/5" />
                  <div className="relative flex items-center justify-between">
                    <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 opacity-90" />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${card.status === 'active' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'}`}>
                      {t(`common.${card.status as 'active' | 'frozen'}`)}
                    </span>
                  </div>
                  <p className="relative font-mono text-lg tracking-widest">
                    {card.card_number.match(/.{1,4}/g)?.join(' ') || card.card_number}
                  </p>
                  <div className="relative flex items-end justify-between">
                    <div>
                      <p className="text-xs opacity-60 uppercase">{t('portal.cardholder')}</p>
                      <p className="text-sm font-medium">{card.cardholder || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-60 uppercase">{t('portal.expires')}</p>
                      <p className="text-sm font-mono">{formatExpiry(card.expires_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-60 uppercase">CVC</p>
                      <p className="text-sm font-mono">{card.cvc || '—'}</p>
                    </div>
                  </div>
                  <Wifi className="relative w-5 h-5 opacity-50 rotate-90 -mt-1" />
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">{t('portal.balance')}</span>
                    <span className="text-xl font-bold">{cs(card.currency)}{Number(card.balance).toFixed(2)} <span className="text-sm font-normal text-zinc-400">{card.currency}</span></span>
                  </div>
                  {card.note && <p className="text-xs text-zinc-400 mt-1">{card.note}</p>}
                  <p className="text-xs text-zinc-300 mt-2 text-right">{t('portal.clickDetails')} →</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
