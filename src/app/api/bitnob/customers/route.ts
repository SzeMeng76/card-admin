import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCustomers, submitCardKyc, BitnobApiError, BitnobCardCustomer } from '@/lib/bitnob'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const customers = await getCustomers()
    return NextResponse.json({ customers })
  } catch (err) {
    const message = err instanceof BitnobApiError ? err.message : 'Failed to reach Bitnob'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const {
    customer, occupation, employmentStatus, accountPurpose, annualSalary,
    expectedMonthlyVolume, placeOfBirth, idFrontImage,
  } = body as {
    customer?: BitnobCardCustomer
    occupation?: string
    employmentStatus?: string
    accountPurpose?: string
    annualSalary?: string
    expectedMonthlyVolume?: string
    placeOfBirth?: string
    idFrontImage?: string
  }

  if (!customer) {
    return NextResponse.json({ error: 'Missing customer' }, { status: 400 })
  }
  const requiredCustomerFields: (keyof BitnobCardCustomer)[] = [
    'customer_type', 'first_name', 'last_name', 'email', 'phone_number', 'dial_code',
    'date_of_birth', 'id_type', 'id_number', 'line1', 'city', 'state', 'postal_code', 'country',
  ]
  for (const field of requiredCustomerFields) {
    if (!customer[field]) return NextResponse.json({ error: `Missing customer.${field}` }, { status: 400 })
  }
  if (!occupation || !employmentStatus || !accountPurpose || !annualSalary || !expectedMonthlyVolume) {
    return NextResponse.json({ error: 'Missing KYC fields' }, { status: 400 })
  }

  try {
    const kyc = await submitCardKyc({
      customer,
      occupation,
      employment_status: employmentStatus as 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student',
      account_purpose: accountPurpose,
      annual_salary: annualSalary,
      expected_monthly_volume: expectedMonthlyVolume,
      place_of_birth: placeOfBirth || undefined,
      terms_of_service_accepted: true,
      id_front_image: idFrontImage || undefined,
    })
    return NextResponse.json({ ok: true, kyc }, { status: 201 })
  } catch (err) {
    if (err instanceof BitnobApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status >= 400 && err.status < 600 ? err.status : 502 })
    }
    return NextResponse.json({ error: 'Failed to reach Bitnob' }, { status: 502 })
  }
}
