import { Telegraf } from 'telegraf'
import axios from 'axios'

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) throw new Error('❌ BOT_TOKEN is missing in environment variables.')

const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖')
})

bot.command('price', async (ctx) => {
  const args = ctx.message.text.split(' ')
  if (args.length < 2) return ctx.reply('用法：/price BTC')

  const symbol = args[1].toUpperCase()
  const spotSymbol = symbol + 'USDT'

  try {
    // 优先查现货
    const spot = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${spotSymbol}`)
    const price = parseFloat(spot.data.price).toFixed(6)
    return ctx.reply(`📈 ${symbol}（现货）价格：${price} USDT`)
  } catch (e) {
    // 如果现货查不到，就尝试查询合约（智能匹配）
    try {
      const allSymbolsResp = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo')
      const matched = allSymbolsResp.data.symbols.find(s => s.symbol.endsWith(symbol + 'USDT'))
      if (!matched) return ctx.reply(`❌ 查询失败，${symbol} 不是支持的币种`)

      const fut = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${matched.symbol}`)
      const price = parseFloat(fut.data.price).toFixed(6)
      return ctx.reply(`📈 ${symbol}（合约：${matched.symbol}）价格：${price} USDT`)
    } catch (err) {
      return ctx.reply(`❌ 查询失败，${symbol} 可能不是支持的币种`)
    }
  }
})

bot.launch()
console.log('🚀 机器人已启动')
