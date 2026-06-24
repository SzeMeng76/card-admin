export const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', GBP: '£', EUR: '€', HKD: 'HK$' }

export function cs(currency?: string): string {
  return CURRENCY_SYMBOL[currency || 'USD'] || (currency || 'USD')
}
