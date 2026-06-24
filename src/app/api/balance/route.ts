import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getBot } from '@/lib/bot'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cardId, type, amount, note, createdAt } = await request.json()
  if (!cardId || !type || amount === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const card = db.cards.findById(cardId)
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const delta = type === 'deduct' ? -Math.abs(amount) : Math.abs(amount)
  const newBalance = card.balance + delta

  if (newBalance < 0) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  const createdAtUtc = createdAt ? new Date(createdAt + '+08:00').toISOString() : null
  db.cards.updateBalance(cardId, newBalance)
  const result = db.transactions.create(cardId, type, delta, newBalance, note || '', session.id, createdAtUtc)
  const insertedTx = db.transactions.findById(Number(result.lastInsertRowid))

  const sign = delta > 0 ? '+' : ''
  const typeLabel = type === 'deduct' ? '💸 扣款' : '💰 入账'
  const txTime = insertedTx?.created_at
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(insertedTx.created_at.endsWith('Z') ? insertedTx.created_at : insertedTx.created_at + 'Z')).replace(',', '')
    : ''
  const msg =
    `💳 *新交易通知*\n` +
    `━━━━━━━━━━━━━\n` +
    `卡号：\`${card.card_number}\`\n` +
    `类型：${typeLabel}\n` +
    `金额：*${sign}${delta.toFixed(2)} ${card.currency || 'USD'}*\n` +
    `余额：${newBalance.toFixed(2)} ${card.currency || 'USD'}\n` +
    (note ? `备注：${note}\n` : '') +
    `时间：${txTime}`

  const recipients = new Set<number>()
  if (card.owner_id) {
    const ownerTgId = db.users.getTelegramId(card.owner_id)
    if (ownerTgId) recipients.add(ownerTgId)
  }
  for (const adminTgId of db.users.listAdminTelegramIds()) {
    recipients.add(adminTgId)
  }
  const bot = getBot()
  recipients.forEach((chatId) => {
    bot.api.sendMessage(chatId, msg, { parse_mode: 'Markdown' }).catch(console.error)
  })

  return NextResponse.json({ balance: newBalance })
}
