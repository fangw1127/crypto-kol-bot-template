import { Telegraf } from 'telegraf'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const bot = new Telegraf(process.env.BOT_TOKEN)

// /start 命令
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 👋')
})

// /price 命令
bot.command('price', async (ctx) => {
  const parts = ctx.message.text.split(' ')
  const symbol = (parts[1] || '').toUpperCase()
  if (!symbol) {
    return ctx.reply('请提供币种，例如 /price BTC')
  }

  const pair = `${symbol}USDT`

  try {
    // 获取现货和合约价格
    const [spotRes, futRes] = await Promise.all([
      axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`),
      axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${pair}`)
    ])

    const spotPrice = parseFloat(spotRes.data.price).toFixed(2)
    const futPrice = parseFloat(futRes.data.price).toFixed(2)

    ctx.reply(
      `${pair} 当前价格：\n现货：$${spotPrice}\n合约：$${futPrice}`
    )
  } catch (error) {
    ctx.reply(`❌ 无法获取 ${pair} 价格，可能币种不存在`)
  }
})

bot.launch()
console.log('✅ KOL Bot 已启动...')
