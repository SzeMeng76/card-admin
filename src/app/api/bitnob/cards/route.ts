import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { listCards, BitnobApiError } from '@/lib/bitnob'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const page = await listCards({ limit: 100 })
    const localByProviderId = new Map(
      db.cards.listByProvider('bitnob').map((c: any) => [c.provider_card_id, c])
    )
    const cards = page.cards.map(card => {
      const local = localByProviderId.get(card.id)
      return {
        ...card,
        owner_id: local?.owner_id ?? null,
        owner_name: local?.owner_name ?? null,
      }
    })
    return NextResponse.json({ cards, page_info: page.page_info })
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
