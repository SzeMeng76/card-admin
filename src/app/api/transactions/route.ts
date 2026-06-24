import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')

  if (session.role === 'admin') {
    if (cardId) return NextResponse.json(db.transactions.listByCard(Number(cardId)))
    return NextResponse.json(db.transactions.list(200))
  }
  return NextResponse.json(db.transactions.listByOwner(session.id))
}

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
  return NextResponse.json({ ok: true, balance: newBalance }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, type, amount, note } = await request.json()
  if (!id || !type || amount === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const tx = db.transactions.findById(id)
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const card = db.cards.findById(tx.card_id)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  // Reverse old amount, apply new amount
  const newDelta = type === 'deduct' ? -Math.abs(amount) : Math.abs(amount)
  const newBalance = card.balance - tx.amount + newDelta

  if (newBalance < 0) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  db.cards.updateBalance(tx.card_id, newBalance)
  db.transactions.update(id, type, newDelta, note || '')
  return NextResponse.json({ ok: true, balance: newBalance })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()

  const tx = db.transactions.findById(id)
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const card = db.cards.findById(tx.card_id)
  if (card) {
    // Reverse the transaction's effect on balance
    const newBalance = card.balance - tx.amount
    if (newBalance >= 0) db.cards.updateBalance(tx.card_id, newBalance)
  }

  db.transactions.delete(id)
  return NextResponse.json({ ok: true })
}
