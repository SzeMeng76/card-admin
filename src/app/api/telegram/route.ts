import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// GET — 生成绑定 token，返回 Telegram 深链接
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = crypto.randomBytes(24).toString('hex')
  const expires = Date.now() + 5 * 60 * 1000 // 5分钟有效

  db.users.setLinkToken(session.id, token, expires)

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) return NextResponse.json({ error: 'TELEGRAM_BOT_USERNAME not set' }, { status: 500 })

  return NextResponse.json({
    url: `https://t.me/${botUsername}?start=${token}`,
    expires_in: 300,
  })
}

// DELETE — 解除绑定
export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  db.users.setTelegramId(session.id, null as any)
  return NextResponse.json({ ok: true })
}
