import { Telegraf } from 'telegraf'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN is missing in environment variables.')
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 👋')
})

bot.command('price', async (ctx) => {
  const input = ctx.message.text.split(' ')
  if (input.length < 2) {
    return ctx.reply('❌ 用法错误，请输入 /price BTC')
  }

  const symbol = input[1].toUpperCase()
  const pair = `${symbol}USDT`

  try {
    const [spot, fut] = await Promise.all([
      axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`),
      axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${pair}`)
    ])

    const spotPrice = parseFloat(spot.data.price).toFixed(2)
    const futPrice = parseFloat(fut.data.price).toFixed(2)

    ctx.reply(
      `📈 ${symbol} 当前价格：\n现货：$${spotPrice}\n合约：$${futPrice}`
    )
  } catch (e) {
    ctx.reply(`❌ 查询失败，${symbol} 可能不是支持的币种`)
  }
})

// 启动机器人
bot.launch()
console.log('✅ KOL Bot 已启动...')
