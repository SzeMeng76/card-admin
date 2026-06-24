'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CardData {
  id: number
  card_number: string
  balance: number
  status: string
  expires_at: string | null
  note: string
}

export default function PortalPage() {
  const t = useTranslations()
  const [cards, setCards] = useState<CardData[]>([])

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then(setCards)
  }, [])

  function maskCard(num: string) {
    if (num.length <= 8) return num
    return num.slice(0, 4) + ' **** **** ' + num.slice(-4)
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{t('portal.myCards')}</h1>
      {cards.length === 0 ? (
        <p className="text-zinc-400">{t('portal.noCards')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <Card key={card.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-zinc-600">{maskCard(card.card_number)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">¥{Number(card.balance).toFixed(2)}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${card.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {t(`common.${card.status as 'active' | 'frozen'}`)}
                  </span>
                </div>
                {card.expires_at && (
                  <p className="text-xs text-zinc-400">{t('portal.expiresAt')}: {card.expires_at.split('T')[0]}</p>
                )}
                {card.note && <p className="text-xs text-zinc-400">{card.note}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
