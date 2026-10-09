import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const stats = db.cards.stats()
  const balances = db.cards.balanceByCurrency()
  const maxBalances = db.cards.maxBalanceByCurrency()
  const todayTx = db.transactions.todayCount()
  const todayAmt = db.transactions.todayAmount()
  const userCount = db.users.list().length

  return NextResponse.json({
    totalCards: stats.total || 0,
    totalBalance: balances.reduce((sum, r) => sum + Number(r.total || 0), 0),
    balanceByCurrency: balances,
    maxBalanceByCurrency: maxBalances,
    activeCards: stats.active || 0,
    todayTransactions: todayTx,
    todayAmount: todayAmt,
    totalUsers: userCount,
  })
}
