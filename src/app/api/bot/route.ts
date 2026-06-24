import { getBotWebhookHandler } from '@/lib/bot'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // 验证 secret token 防止他人伪造请求
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }
  const handler = getBotWebhookHandler()
  return await handler(req)
}
