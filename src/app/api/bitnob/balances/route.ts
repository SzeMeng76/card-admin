import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBalances, BitnobApiError } from '@/lib/bitnob'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const accounts = await getBalances()
    return NextResponse.json(accounts)
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
