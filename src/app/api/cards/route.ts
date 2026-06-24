import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role === 'admin') {
    return NextResponse.json(db.cards.list())
  }
  return NextResponse.json(db.cards.listByOwner(session.id))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardNumber, ownerId, balance, note, expiresAt, cvc, cardholder } = await request.json()
  if (!cardNumber) return NextResponse.json({ error: 'Card number required' }, { status: 400 })

  try {
    db.cards.create(cardNumber, ownerId || null, balance || 0, note || '', expiresAt || null, cvc || null, cardholder || null)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Card number already exists' }, { status: 409 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await request.json()
  db.cards.updateStatus(id, status)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  db.cards.delete(id)
  return NextResponse.json({ ok: true })
}
