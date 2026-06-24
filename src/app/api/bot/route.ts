import { getBotWebhookHandler } from '@/lib/bot'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const handler = getBotWebhookHandler()
  return await handler(req)
}
