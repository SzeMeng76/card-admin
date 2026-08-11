import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCardTransactions, BitnobApiError } from '@/lib/bitnob'

export async function GET(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardId } = await params
  const { searchParams } = new URL(request.url)
  try {
    const page = await getCardTransactions(cardId, {
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
    })
    return NextResponse.json(page)
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
