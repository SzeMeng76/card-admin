import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const stats = db.cards.stats()
  const todayTx = db.transactions.todayCount()
  const userCount = db.users.list().length

  return NextResponse.json({
    totalCards: stats.total || 0,
    totalBalance: stats.totalBalance || 0,
    activeCards: stats.active || 0,
    todayTransactions: todayTx,
    totalUsers: userCount,
  })
}
