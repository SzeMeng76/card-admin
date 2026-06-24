import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(db.users.list())
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { username, password, role } = await request.json()
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const existing = db.users.findByUsername(username)
  if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 409 })

  const hash = bcrypt.hashSync(password, 10)
  db.users.create(username, hash, role || 'user')
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (id === session.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  db.users.delete(id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if ('telegram_id' in body) {
    db.users.setTelegramId(id, body.telegram_id)
    return NextResponse.json({ ok: true })
  }

  if (body.password) {
    const hash = bcrypt.hashSync(body.password, 10)
    db.users.updatePassword(id, hash)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
