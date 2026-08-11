import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateCardStatus, adjustCardBalance, getCardSecureDetails, BitnobApiError } from '@/lib/bitnob'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardId } = await params
  try {
    const details = await getCardSecureDetails(cardId)
    return NextResponse.json(details)
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardId } = await params
  const body = await request.json()
  const { action } = body as { action: 'freeze' | 'unfreeze' | 'fund' | 'withdraw'; amount?: number; reference?: string }

  try {
    if (action === 'freeze' || action === 'unfreeze') {
      const card = await updateCardStatus(cardId, action === 'freeze' ? 'frozen' : 'active')
      const local = db.cards.findByProviderCardId(cardId)
      if (local) db.cards.updateStatus(local.id, action === 'freeze' ? 'frozen' : 'active')
      return NextResponse.json({ ok: true, card })
    }

    if (action === 'fund' || action === 'withdraw') {
      const { amount } = body as { amount: number }
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
      const tx = await adjustCardBalance(cardId, {
        amount: Math.round(amount * 1_000_000),
        type: action === 'fund' ? 'fund' : 'withdraw',
        reference: `CARDADMIN_BAL_${Date.now()}`,
      })
      return NextResponse.json({ ok: true, transaction: tx })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
