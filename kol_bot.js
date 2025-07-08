import { Telegraf } from 'telegraf'
import axios from 'axios'
import 'dotenv/config'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖，请输入 /price BTC 来查询现货价格')
})

// 价格查询指令
bot.command('price', async (ctx) => {
  const input = ctx.message.text.split(' ')
  if (input.length < 2) return ctx.reply('❌ 格式错误，请使用 /price BTC')

  const symbol = input[1].toUpperCase()
  const pair = symbol + 'USDT'

  try {
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`)
    const price = parseFloat(res.data.price).toLocaleString()
    ctx.reply(`✅ ${symbol} 现货最新价格：${price} USDT`)
  } catch (error) {
    ctx.reply(`❌ 查询失败，${symbol} 可能不是币安现货支持的币种`)
  }
})

bot.launch()
console.log('✅ KOL Bot 已启动...')
