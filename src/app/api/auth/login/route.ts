import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const user = db.users.findByUsername(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ id: user.id, username: user.username, role: user.role })

  const response = NextResponse.json({ role: user.role, username: user.username })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}
