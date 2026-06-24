export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.TELEGRAM_BOT_TOKEN) return

  const mode = process.env.TELEGRAM_BOT_MODE || 'webhook'

  if (mode === 'polling') {
    const { startPolling } = await import('./lib/bot')
    startPolling().catch(console.error)
  } else {
    // webhook 模式：启动时自动向 Telegram 注册 webhook URL
    const appUrl = process.env.APP_URL
    if (!appUrl) { console.warn('[bot] APP_URL not set, skipping webhook registration'); return }

    const token = process.env.TELEGRAM_BOT_TOKEN
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/bot`

    fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.ok) console.log(`[bot] Webhook registered: ${webhookUrl}`)
        else console.error('[bot] Webhook registration failed:', r.description)
      })
      .catch(e => console.error('[bot] Webhook registration error:', e))
  }
}
