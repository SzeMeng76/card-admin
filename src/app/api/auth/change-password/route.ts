import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Password too short' }, { status: 400 })

  const user = db.users.findByUsername(session.username)
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 })
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.users.updatePassword(session.id, hash)
  return NextResponse.json({ ok: true })
}
