export const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', GBP: '£', EUR: '€', HKD: 'HK$' }

export function cs(currency?: string): string {
  return CURRENCY_SYMBOL[currency || 'USD'] || (currency || 'USD')
}

/**
 * Format an amount with the currency symbol, keeping the sign in front of the
 * symbol so an overdrawn balance reads "-$42.00" instead of "$-42.00".
 */
export function money(currency: string | undefined, amount: number, alwaysSign = false): string {
  const value = Number(amount) || 0
  const digits = Math.abs(value).toFixed(2)
  if (value < 0) return `-${cs(currency)}${digits}`
  return `${alwaysSign ? '+' : ''}${cs(currency)}${digits}`
}
