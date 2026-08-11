import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAddresses, createAddress, BitnobApiError } from '@/lib/bitnob'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const addresses = await getAddresses()
    return NextResponse.json(addresses)
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { chain, label } = await request.json()
  if (!chain) return NextResponse.json({ error: 'Missing chain' }, { status: 400 })

  try {
    const address = await createAddress({ chain, label: label || undefined, reference: `CARDADMIN_ADDR_${Date.now()}` })
    return NextResponse.json(address, { status: 201 })
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
