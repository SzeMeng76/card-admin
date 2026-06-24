import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardId, type, amount, note } = await request.json()
  if (!cardId || !type || amount === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const card = db.cards.findById(cardId)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const delta = type === 'deduct' ? -Math.abs(amount) : Math.abs(amount)
  const newBalance = card.balance + delta

  if (newBalance < 0) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  db.cards.updateBalance(cardId, newBalance)
  db.transactions.create(cardId, type, delta, newBalance, note || '', session.id)

  return NextResponse.json({ balance: newBalance })
}
