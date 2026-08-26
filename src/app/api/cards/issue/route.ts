import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createCard, submitCardKyc, BitnobApiError, BitnobCardCustomer } from '@/lib/bitnob'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    name, amount, currency, ownerId, cardBrand, contactlessPayment, customer,
    customerId, occupation, employmentStatus, accountPurpose, annualSalary,
    expectedMonthlyVolume, placeOfBirth, idFrontImage,
  } = body as {
    name?: string
    amount?: number
    currency?: string
    ownerId?: number | null
    cardBrand?: string
    contactlessPayment?: boolean
    customer?: BitnobCardCustomer
    customerId?: string
    occupation?: string
    employmentStatus?: string
    accountPurpose?: string
    annualSalary?: string
    expectedMonthlyVolume?: string
    placeOfBirth?: string
    idFrontImage?: string
  }

  if (!name || !amount || !currency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (Number(amount) < 3 || Number(amount) > 2500) {
    return NextResponse.json({ error: 'Funding amount must be between $3 and $2,500' }, { status: 400 })
  }
  if (!customerId && !customer) {
    return NextResponse.json({ error: 'Missing customer or customerId' }, { status: 400 })
  }

  try {
    let resolvedCustomerId = customerId

    if (!resolvedCustomerId) {
      const requiredCustomerFields: (keyof BitnobCardCustomer)[] = [
        'customer_type', 'first_name', 'last_name', 'email', 'phone_number', 'dial_code',
        'date_of_birth', 'id_type', 'id_number', 'line1', 'city', 'state', 'postal_code', 'country',
      ]
      for (const field of requiredCustomerFields) {
        if (!customer![field]) return NextResponse.json({ error: `Missing customer.${field}` }, { status: 400 })
      }
      if (!occupation || !employmentStatus || !accountPurpose || !annualSalary || !expectedMonthlyVolume) {
        return NextResponse.json({ error: 'Missing KYC fields' }, { status: 400 })
      }

      const kyc = await submitCardKyc({
        customer: customer!,
        occupation,
        employment_status: employmentStatus as 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student',
        account_purpose: accountPurpose,
        annual_salary: annualSalary,
        expected_monthly_volume: expectedMonthlyVolume,
        place_of_birth: placeOfBirth || undefined,
        terms_of_service_accepted: true,
        id_front_image: idFrontImage || undefined,
      })

      if (kyc.normalized_status !== 'approved') {
        return NextResponse.json({
          error: 'KYC not approved',
          kyc_status: kyc.normalized_status,
          customer_id: kyc.customer_id,
        }, { status: 422 })
      }
      resolvedCustomerId = kyc.customer_id
    }

    const reference = `CARDADMIN_${Date.now()}`
    const card = await createCard({
      amount: Math.round(Number(amount) * 1_000_000),
      card_type: 'virtual',
      currency,
      name,
      reference,
      card_brand: cardBrand || undefined,
      contactless_payment: contactlessPayment ?? false,
      customer_id: resolvedCustomerId,
    })

    const billing = card.billing_address || {}
    const billingAddr = [billing.line1, billing.city, billing.state, billing.postal_code, billing.country].filter(Boolean).join(', ')
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
