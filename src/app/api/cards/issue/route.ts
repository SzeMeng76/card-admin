import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createCard, BitnobApiError, BitnobCardCustomer } from '@/lib/bitnob'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, amount, currency, ownerId, cardBrand, contactlessPayment, customer } = body as {
    name?: string
    amount?: number
    currency?: string
    ownerId?: number | null
    cardBrand?: string
    contactlessPayment?: boolean
    customer?: BitnobCardCustomer
  }

  if (!name || !amount || !currency || !customer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const requiredCustomerFields: (keyof BitnobCardCustomer)[] = [
    'customer_type', 'first_name', 'last_name', 'email', 'phone_number', 'dial_code',
    'date_of_birth', 'id_type', 'id_number', 'line1', 'city', 'state', 'postal_code', 'country',
  ]
  for (const field of requiredCustomerFields) {
    if (!customer[field]) return NextResponse.json({ error: `Missing customer.${field}` }, { status: 400 })
  }

  try {
    const reference = `CARDADMIN_${Date.now()}`
    const card = await createCard({
      amount: Math.round(Number(amount) * 1_000_000),
      card_type: 'virtual',
      currency,
      name,
      reference,
      card_brand: cardBrand || undefined,
      contactless_payment: contactlessPayment ?? false,
      customer,
    })

    const billingAddr = [customer.line1, customer.city, customer.state, customer.postal_code, customer.country].filter(Boolean).join(', ')
    db.cards.create(
      card.masked_pan || `PENDING_${card.id}`,
      ownerId || null,
      card.display_amount || Number(amount),
      `Issued via Bitnob (${reference})`,
      null,
      null,
      name,
      currency,
      billingAddr,
      'bitnob',
      card.id,
    )

    return NextResponse.json({ ok: true, card }, { status: 201 })
  } catch (err) {
    if (err instanceof BitnobApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 400 && err.status < 600 ? err.status : 502 })
    }
    return NextResponse.json({ error: 'Failed to issue card' }, { status: 502 })
  }
}
