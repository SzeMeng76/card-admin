import crypto from 'crypto'

const BASE_URL = process.env.BITNOB_BASE_URL || 'https://api.bitnob.com'

function authHeaders(body: unknown): Record<string, string> {
  const clientId = process.env.BITNOB_CLIENT_ID
  const clientSecret = process.env.BITNOB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('BITNOB_CLIENT_ID / BITNOB_CLIENT_SECRET not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = crypto.randomBytes(16).toString('hex')
  const payload = body ? JSON.stringify(body) : ''
  const stringToSign = `${clientId}:${timestamp}:${nonce}:${payload}`
  const signature = crypto.createHmac('sha256', clientSecret).update(stringToSign).digest('hex')

  return {
    'Content-Type': 'application/json',
    'X-Auth-Client': clientId,
    'X-Auth-Timestamp': timestamp.toString(),
    'X-Auth-Nonce': nonce,
    'X-Auth-Signature': signature,
  }
}

export interface BitnobCardCustomer {
  customer_type: 'individual' | 'business'
  first_name: string
  last_name: string
  email: string
  phone_number: string
  dial_code: string
  date_of_birth: string
  id_type: 'passport' | 'nin' | 'bvn' | 'national_id' | 'vnin' | 'drivers_license' | 'voters_card' | 'ghana_card'
  id_number: string
  line1: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface BitnobCustomer {
  id: string
  company_id: string
  customer_type: 'individual' | 'business'
  first_name: string
  last_name: string
  email: string
  phone_number: string
  dial_code: string
  date_of_birth: string
  id_type: string
  id_number: string
  line1: string
  city: string
  state: string
  postal_code: string
  country: string
  is_active: boolean
  kyc_status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ListCustomersParams {
  cursor?: string
  limit?: number
}

export interface CustomersPage {
  customers: BitnobCustomer[]
  has_more: boolean
  next_cursor: string
  prev_cursor: string
  page_size: number
  total: number
}

export async function getCustomers(params: ListCustomersParams = {}): Promise<CustomersPage> {
  const qs = new URLSearchParams()
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  const res = await fetch(`${BASE_URL}/api/customers${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || json?.detail || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as CustomersPage
}

export interface CreateCardParams {
  amount: number
  card_type: 'virtual' | 'physical'
  currency: string
  name: string
  reference?: string
  contactless_payment?: boolean
  card_brand?: string
  customer_id: string
}

export interface CardKycParams {
  customer: BitnobCardCustomer
  occupation: string
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student'
  account_purpose: string
  annual_salary: string
  expected_monthly_volume: string
  place_of_birth?: string
  terms_of_service_accepted: true
  webhook_url?: string
  id_front_image?: string
}

export interface CardKycResult {
  customer_id: string
  status: string
  normalized_status: 'initiated' | 'pending' | 'approved' | 'rejected'
  completion_link: string
  email: string
  first_name: string
  last_name: string
}

export async function submitCardKyc(params: CardKycParams): Promise<CardKycResult> {
  const res = await fetch(`${BASE_URL}/api/cards/kyc`, {
    method: 'POST',
    headers: authHeaders(params),
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || json?.detail || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as CardKycResult
}

export interface BitnobCard {
  id: string
  company_id: string
  customer_id: string
  card_type: string
  status: string
  created_status: string
  name: string
  preferred_name: string
  masked_pan: string
  first_six_digit?: string
  last_four_digit?: string
  balance_amount: string
  balance_currency: string
  display_amount: number
  contactless_payment: boolean
  spending_limits: Record<string, number>
  reference: string
  webhook_url: string | null
  user_metadata: string
  billing_address: Record<string, string>
  created_by: string | null
  created_at: string
  updated_at: string
}

export class BitnobApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function createCard(params: CreateCardParams): Promise<BitnobCard> {
  const res = await fetch(`${BASE_URL}/api/cards`, {
    method: 'POST',
    headers: authHeaders(params),
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.card as BitnobCard
}

export async function getCard(cardId: string): Promise<BitnobCard> {
  const res = await fetch(`${BASE_URL}/api/cards/${cardId}`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.card as BitnobCard
}

export interface AdjustCardBalanceParams {
  amount: number
  type: 'fund' | 'withdraw'
  reference: string
}

export interface CardBalanceTransaction {
  id: string
  status: string
  type: string
  amount: string
  balance_before: string
  balance_after: string
  reference: string
}

export async function adjustCardBalance(cardId: string, params: AdjustCardBalanceParams): Promise<CardBalanceTransaction> {
  const res = await fetch(`${BASE_URL}/api/cards/${cardId}/balance`, {
    method: 'POST',
    headers: authHeaders(params),
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.transaction as CardBalanceTransaction
}

export interface BitnobAccount {
  account_id: string
  account_number: string
  currency: string
  ledger_balance: string
  available_balance: string
  ledger_balance_formatted: string
  available_balance_formatted: string
  created_at: string
}

export async function getBalances(): Promise<BitnobAccount[]> {
  const res = await fetch(`${BASE_URL}/api/balances`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.accounts as BitnobAccount[]
}

export interface BitnobAddress {
  id: string
  chain: string
  company_id: string
  address: string
  status: string
  label: string | null
  reference: string | null
  created_at?: string
}

export async function getAddresses(): Promise<BitnobAddress[]> {
  const res = await fetch(`${BASE_URL}/api/addresses`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.addresses as BitnobAddress[]
}

export interface CreateAddressParams {
  chain: string
  label?: string
  reference?: string
  customer_email?: string
}

export async function createAddress(params: CreateAddressParams): Promise<BitnobAddress> {
  const res = await fetch(`${BASE_URL}/api/addresses`, {
    method: 'POST',
    headers: authHeaders(params),
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as BitnobAddress
}

export interface BitnobTransaction {
  transaction_id: string
  account_number: string
  currency: string
  type: string
  state: string
  amount: string
  fee: string
  reference: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  value_date: string
  amount_formatted: string
  fee_formatted: string
  side: 'Credit' | 'Debit'
}

export interface ListTransactionsParams {
  cursor?: string
  limit?: number
  type?: string
  status?: string
  currency?: string
}

export interface TransactionsPage {
  transactions: BitnobTransaction[]
  next_cursor: string
  previous_cursor: string
  total_count: number
  has_more: boolean
}

export async function getTransactions(params: ListTransactionsParams = {}): Promise<TransactionsPage> {
  const qs = new URLSearchParams()
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.type) qs.set('type', params.type)
  if (params.status) qs.set('status', params.status)
  if (params.currency) qs.set('currency', params.currency)
  const query = qs.toString()

  const res = await fetch(`${BASE_URL}/api/transactions${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as TransactionsPage
}

export interface CardTransaction {
  id: string
  card_id: string
  company_id: string
  type: 'fee' | 'funding' | 'purchase' | 'refund' | 'withdrawal'
  status: 'pending' | 'completed' | 'failed'
  amount: string
  currency: string
  display_amount: number
  balance_before: string
  balance_after: string
  fee_amount: string
  fee_type: string
  reference: string
  description: string
  metadata: string
  cardholder_name: string
  last_four_digit?: string
  provider_transaction_id?: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ListCardTransactionsParams {
  cursor?: string
  limit?: number
  type?: string
  status?: string
}

export interface CardTransactionsPage {
  transactions: CardTransaction[]
  page_info: {
    has_next_page: boolean
    has_previous_page: boolean
    total: number
  }
}

export async function getCardTransactions(cardId: string, params: ListCardTransactionsParams = {}): Promise<CardTransactionsPage> {
  const qs = new URLSearchParams()
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.type) qs.set('type', params.type)
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()

  const res = await fetch(`${BASE_URL}/api/cards/${cardId}/transactions${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as CardTransactionsPage
}

export async function updateCardStatus(cardId: string, status: 'active' | 'frozen'): Promise<BitnobCard> {
  const res = await fetch(`${BASE_URL}/api/cards/${cardId}/status`, {
    method: 'POST',
    headers: authHeaders({ status }),
    body: JSON.stringify({ status }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.card as BitnobCard
}

export interface ListCardsParams {
  cursor?: string
  limit?: number
}

export interface CardsPage {
  cards: BitnobCard[]
  page_info: {
    has_next_page: boolean
    has_previous_page: boolean
    total: number
  }
}

export async function listCards(params: ListCardsParams = {}): Promise<CardsPage> {
  const qs = new URLSearchParams()
  if (params.cursor) qs.set('cursor', params.cursor)
  if (params.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  const res = await fetch(`${BASE_URL}/api/cards${query ? `?${query}` : ''}`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data as CardsPage
}

export interface CardSecureDetails {
  card_id: string
  card_number: string
  cvv: string
  expiry_month: string
  expiry_year: string
  name: string
}

export async function getCardSecureDetails(cardId: string): Promise<CardSecureDetails> {
  const res = await fetch(`${BASE_URL}/api/cards/${cardId}/secure`, {
    method: 'GET',
    headers: authHeaders(null),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new BitnobApiError(json?.message || `Bitnob API error (${res.status})`, res.status)
  }
  return json.data.details as CardSecureDetails
}
