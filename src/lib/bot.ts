import { Bot, webhookCallback, InlineKeyboard } from 'grammy'
import { db, fmtAmountByCurrency } from './db'
import { cs } from './currency'

function userMenu() {
  return new InlineKeyboard()
    .text('💳 我的卡片', 'cards').text('💰 余额汇总', 'balance').row()
    .text('📋 最近交易', 'txn')
}

function adminMenu() {
  return new InlineKeyboard()
    .text('💳 我的卡片', 'cards').text('💰 余额汇总', 'balance').row()
    .text('📋 最近交易', 'txn').text('📊 系统统计', 'stats').row()
    .text('🗂 所有卡片', 'allcards').text('ℹ️ 管理指令', 'admin_cmds')
}

async function sendWelcome(ctx: any, user: any) {
  const isAdmin = user.role === 'admin'
  const cards = isAdmin ? db.cards.list() : db.cards.listByOwner(user.id)
  const balanceByCur: Record<string, number> = {}
  for (const c of cards) {
    const cur = c.currency || 'USD'
    balanceByCur[cur] = (balanceByCur[cur] || 0) + Number(c.balance)
  }
  const balanceStr = fmtAmountByCurrency(Object.entries(balanceByCur).map(([currency, total]) => ({ currency, total })))
  const todayAmtStr = fmtAmountByCurrency(isAdmin
    ? db.transactions.todayAmountByCurrency()
    : db.transactions.todayAmountByCurrencyByOwner(user.id))
  const todayCount = isAdmin
    ? db.transactions.todayCount()
    : db.transactions.todayCountByOwner(user.id)

  const tgName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || user.username

  const msg =
    `👋 欢迎回来，*${tgName}*！\n` +
    `🆔 Telegram ID：\`${ctx.from.id}\`\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💳 卡片数量：${cards.length} 张\n` +
    `💰 总余额：${balanceStr}\n` +
    `📈 今日交易：${todayCount} 笔 / ${todayAmtStr}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `请选择操作：`

  await ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: isAdmin ? adminMenu() : userMenu(),
  })
}

let _bot: Bot | null = null

export function getBot(): Bot {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
    _bot = new Bot(token)
    registerHandlers(_bot)
  }
  return _bot
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`
}

function fmtCards(cards: any[]) {
  if (!cards.length) return '没有找到卡片。'
  return cards.map(c =>
    `💳 *${c.card_number}*\n` +
    `余额: ${cs(c.currency)}${Number(c.balance).toFixed(2)}\n` +
    `状态: ${c.status === 'active' ? '✅ 正常' : '🔒 封禁'}` +
    (c.cardholder ? `\n持卡人: ${c.cardholder}` : '') +
    (c.expires_at ? `\n有效期: ${(() => { const p = c.expires_at.slice(0,7).split('-'); return `${p[1]}/${p[0]}` })()}` : '') +
    (c.cvc ? `\nCVC: ${c.cvc}` : '') +
    (c.billing_address ? `\n账单地址: ${c.billing_address}` : '')
  ).join('\n\n')
}

function getAdmin(telegramId: number) {
  const user = db.users.findByTelegramId(telegramId)
  if (!user || user.role !== 'admin') return null
  return user
}

function getUser(telegramId: number) {
  return db.users.findByTelegramId(telegramId) || null
}

function registerHandlers(bot: Bot) {
  bot.command('start', async (ctx) => {
    const arg = ctx.match?.trim()
    if (arg) {
      const user = db.users.findByLinkToken(arg)
      if (!user) { await ctx.reply('❌ 链接已过期或无效，请重新在网站生成绑定链接。'); return }
      db.users.setTelegramId(user.id, ctx.from!.id)
      await ctx.reply(`✅ 绑定成功！欢迎 ${user.username}。`)
      await sendWelcome(ctx, user)
      return
    }
    const user = getUser(ctx.from!.id)
    if (user) {
      await sendWelcome(ctx, user)
    } else {
      await ctx.reply('👋 欢迎使用 Card Admin Bot！\n\n请先在网站生成绑定链接完成绑定。')
    }
  })

  bot.command('help', async (ctx) => {
    const user = getUser(ctx.from!.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    await sendWelcome(ctx, user)
  })

  // 按钮回调
  bot.callbackQuery('cards', async (ctx) => {
    await ctx.answerCallbackQuery()
    const user = getUser(ctx.from.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const cards = user.role === 'admin' ? db.cards.list() : db.cards.listByOwner(user.id)
    await ctx.reply(fmtCards(cards.slice(0, 10)), { parse_mode: 'Markdown' })
  })

  bot.callbackQuery('balance', async (ctx) => {
    await ctx.answerCallbackQuery()
    const user = getUser(ctx.from.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const cards = user.role === 'admin' ? db.cards.list() : db.cards.listByOwner(user.id)
    const byCur: Record<string, number> = {}
    for (const c of cards) { const cur = c.currency || 'USD'; byCur[cur] = (byCur[cur] || 0) + Number(c.balance) }
    const balanceStr = fmtAmountByCurrency(Object.entries(byCur).map(([currency, total]) => ({ currency, total })))
    await ctx.reply(`💰 共 ${cards.length} 张卡\n总余额：${balanceStr}`)
  })

  bot.callbackQuery('txn', async (ctx) => {
    await ctx.answerCallbackQuery()
    const user = getUser(ctx.from.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const txns = user.role === 'admin'
      ? db.transactions.list(10)
      : db.transactions.listByOwner(user.id).slice(0, 10)
    if (!txns.length) { await ctx.reply('暂无交易记录。'); return }
    await ctx.reply(txns.map((t: any) =>
      `${t.type === 'deduct' ? '🔴' : '🟢'} ${t.card_number} ${t.amount > 0 ? '+' : ''}${cs(t.currency)}${Number(t.amount).toFixed(2)}\n余额：${cs(t.currency)}${Number(t.balance_after).toFixed(2)}${t.note ? `  ${t.note}` : ''}\n🕐 ${fmtDate(t.created_at)}`
    ).join('\n\n'))
  })

  bot.callbackQuery('stats', async (ctx) => {
    await ctx.answerCallbackQuery()
    if (!getAdmin(ctx.from.id)) { await ctx.reply('权限不足。'); return }
    const s = db.cards.stats()
    const todayCount = db.transactions.todayCount()
    const balanceStr = fmtAmountByCurrency(db.cards.balanceByCurrency())
    const todayAmtStr = fmtAmountByCurrency(db.transactions.todayAmountByCurrency())
    await ctx.reply(`📊 *系统统计*\n\n💳 卡片总数：${s.total}\n✅ 活跃卡片：${s.active}\n💰 总余额：${balanceStr}\n📈 今日交易：${todayCount} 笔 / ${todayAmtStr}`, { parse_mode: 'Markdown' })
  })

  bot.callbackQuery('allcards', async (ctx) => {
    await ctx.answerCallbackQuery()
    if (!getAdmin(ctx.from.id)) { await ctx.reply('权限不足。'); return }
    await ctx.reply(fmtCards(db.cards.list().slice(0, 20)), { parse_mode: 'Markdown' })
  })

  bot.callbackQuery('admin_cmds', async (ctx) => {
    await ctx.answerCallbackQuery()
    if (!getAdmin(ctx.from.id)) { await ctx.reply('权限不足。'); return }
    await ctx.reply(
      `⚙️ *管理员指令*\n\n` +
      `🔍 *查询*\n` +
      `/card 卡号 — 查特定卡及最近交易\n` +
      `/user 用户名 — 查用户名下所有卡\n\n` +
      `💸 *交易*\n` +
      `/topup 卡号 金额 备注 — 充值\n` +
      `/deduct 卡号 金额 备注 — 扣款\n\n` +
      `🔒 *卡片状态*\n` +
      `/block 卡号 — 封卡\n` +
      `/unblock 卡号 — 解封`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('cards', async (ctx) => {
    const user = getUser(ctx.from!.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const cards = user.role === 'admin' ? db.cards.list() : db.cards.listByOwner(user.id)
    await ctx.reply(fmtCards(cards.slice(0, 10)))
  })

  bot.command('allcards', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    await ctx.reply(fmtCards(db.cards.list().slice(0, 20)))
  })

  bot.command('balance', async (ctx) => {
    const user = getUser(ctx.from!.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const cards = user.role === 'admin' ? db.cards.list() : db.cards.listByOwner(user.id)
    const byCur: Record<string, number> = {}
    for (const c of cards) { const cur = c.currency || 'USD'; byCur[cur] = (byCur[cur] || 0) + Number(c.balance) }
    const balanceStr = fmtAmountByCurrency(Object.entries(byCur).map(([currency, total]) => ({ currency, total })))
    await ctx.reply(`💰 共 ${cards.length} 张卡\n总余额: ${balanceStr}`)
  })

  bot.command('txn', async (ctx) => {
    const user = getUser(ctx.from!.id)
    if (!user) { await ctx.reply('请先绑定账号。'); return }
    const txns = user.role === 'admin'
      ? db.transactions.list(10)
      : db.transactions.listByOwner(user.id).slice(0, 10)
    if (!txns.length) { await ctx.reply('暂无交易记录。'); return }
    await ctx.reply(txns.map((t: any) =>
      `${t.type === 'deduct' ? '🔴' : '🟢'} ${t.card_number} ${t.amount > 0 ? '+' : ''}${cs(t.currency)}${Number(t.amount).toFixed(2)}\n余额: ${cs(t.currency)}${Number(t.balance_after).toFixed(2)}${t.note ? `  ${t.note}` : ''}\n🕐 ${fmtDate(t.created_at)}`
    ).join('\n\n'))
  })

  bot.command('stats', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    const s = db.cards.stats()
    const todayCount = db.transactions.todayCount()
    const balanceStr = fmtAmountByCurrency(db.cards.balanceByCurrency())
    const todayAmtStr = fmtAmountByCurrency(db.transactions.todayAmountByCurrency())
    await ctx.reply(`📊 系统统计\n\n卡片总数: ${s.total}\n活跃卡片: ${s.active}\n总余额: ${balanceStr}\n今日交易: ${todayCount} 笔 / ${todayAmtStr}`)
  })

  bot.command('card', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    const cardNumber = ctx.match?.trim()
    if (!cardNumber) { await ctx.reply('用法: /card 卡号'); return }
    const cards = db.cards.list().filter((c: any) => c.card_number.includes(cardNumber))
    if (!cards.length) { await ctx.reply('找不到该卡。'); return }
    const card = cards[0]
    const txns = db.transactions.listByCard(card.id).slice(0, 5)
    const txnText = txns.length
      ? '\n\n最近交易:\n' + txns.map((t: any) =>
          `${t.type === 'deduct' ? '🔴' : '🟢'} ${t.amount > 0 ? '+' : ''}${cs(t.currency)}${Number(t.amount).toFixed(2)}${t.note ? `  ${t.note}` : ''}  🕐 ${fmtDate(t.created_at)}`
        ).join('\n')
      : '\n\n暂无交易记录'
    await ctx.reply(fmtCards([card]) + txnText)
  })

  bot.command('user', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    const username = ctx.match?.trim()
    if (!username) { await ctx.reply('用法: /user 用户名'); return }
    const u = db.users.findByUsername(username)
    if (!u) { await ctx.reply('找不到该用户。'); return }
    const cards = db.cards.listByOwner(u.id)
    await ctx.reply(`👤 ${u.username} (${u.role})\nTG: ${u.telegram_id || '未绑定'}\n\n` + fmtCards(cards))
  })

  bot.command('topup', async (ctx) => {
    const admin = getAdmin(ctx.from!.id)
    if (!admin) { await ctx.reply('权限不足。'); return }
    const parts = ctx.match?.trim().split(/\s+/) || []
    if (parts.length < 2) { await ctx.reply('用法: /topup 卡号 金额 备注'); return }
    const [cardNumber, amtStr, ...noteParts] = parts
    const amount = parseFloat(amtStr)
    if (isNaN(amount) || amount <= 0) { await ctx.reply('金额无效。'); return }
    const cards = db.cards.list().filter((c: any) => c.card_number.includes(cardNumber))
    if (!cards.length) { await ctx.reply('找不到该卡。'); return }
    const card = cards[0]
    if (card.status !== 'active') { await ctx.reply('该卡已封禁，无法操作。'); return }
    const newBalance = Number(card.balance) + amount
    db.cards.updateBalance(card.id, newBalance)
    db.transactions.create(card.id, 'topup', amount, newBalance, noteParts.join(' ') || 'TG充值', admin.id)
    await ctx.reply(`✅ 充值成功\n卡号: ${card.card_number}\n金额: +${cs(card.currency)}${amount.toFixed(2)}\n新余额: ${cs(card.currency)}${newBalance.toFixed(2)}`)
  })

  bot.command('deduct', async (ctx) => {
    const admin = getAdmin(ctx.from!.id)
    if (!admin) { await ctx.reply('权限不足。'); return }
    const parts = ctx.match?.trim().split(/\s+/) || []
    if (parts.length < 2) { await ctx.reply('用法: /deduct 卡号 金额 备注'); return }
    const [cardNumber, amtStr, ...noteParts] = parts
    const amount = parseFloat(amtStr)
    if (isNaN(amount) || amount <= 0) { await ctx.reply('金额无效。'); return }
    const cards = db.cards.list().filter((c: any) => c.card_number.includes(cardNumber))
    if (!cards.length) { await ctx.reply('找不到该卡。'); return }
    const card = cards[0]
    if (card.status !== 'active') { await ctx.reply('该卡已封禁，无法操作。'); return }
    const newBalance = Number(card.balance) - amount
    if (newBalance < 0) { await ctx.reply(`余额不足，当前余额: ${cs(card.currency)}${Number(card.balance).toFixed(2)}`); return }
    db.cards.updateBalance(card.id, newBalance)
    db.transactions.create(card.id, 'deduct', -amount, newBalance, noteParts.join(' ') || 'TG扣款', admin.id)
    await ctx.reply(`✅ 扣款成功\n卡号: ${card.card_number}\n金额: -${cs(card.currency)}${amount.toFixed(2)}\n新余额: ${cs(card.currency)}${newBalance.toFixed(2)}`)
  })

  bot.command('block', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    const cardNumber = ctx.match?.trim()
    if (!cardNumber) { await ctx.reply('用法: /block 卡号'); return }
    const cards = db.cards.list().filter((c: any) => c.card_number.includes(cardNumber))
    if (!cards.length) { await ctx.reply('找不到该卡。'); return }
    db.cards.updateStatus(cards[0].id, 'blocked')
    await ctx.reply(`🔒 已封卡: ${cards[0].card_number}`)
  })

  bot.command('unblock', async (ctx) => {
    if (!getAdmin(ctx.from!.id)) { await ctx.reply('权限不足。'); return }
    const cardNumber = ctx.match?.trim()
    if (!cardNumber) { await ctx.reply('用法: /unblock 卡号'); return }
    const cards = db.cards.list().filter((c: any) => c.card_number.includes(cardNumber))
    if (!cards.length) { await ctx.reply('找不到该卡。'); return }
    db.cards.updateStatus(cards[0].id, 'active')
    await ctx.reply(`🔓 已解封: ${cards[0].card_number}`)
  })

  bot.on('message', async (ctx) => {
    await ctx.reply('发送 /help 查看可用指令。')
  })
}

export function getBotWebhookHandler() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  return webhookCallback(getBot(), 'std/http', { secretToken: secret })
}

export async function startPolling() {
  const bot = getBot()
  console.log('[bot] Starting in polling mode...')
  await bot.start()
}
