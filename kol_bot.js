// === crypto-kol-bot：整合现价 /info 项目信息 /trend AI预测 ===
import { Telegraf } from 'telegraf'
import axios from 'axios'

const bot = new Telegraf(process.env.BOT_TOKEN)

// === 币种价格查询 ===
bot.command('price', async (ctx) => {
  const parts = ctx.message.text.split(' ')
  if (parts.length < 2) return ctx.reply('❌ 用法错误，例如：/price BTC')
  const symbol = parts[1].toUpperCase()

  try {
    // 优先现货
    const spot = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`)
    const price = parseFloat(spot.data.price).toFixed(4)
    return ctx.reply(`📈 ${symbol} 现货价格：$${price}`)
  } catch (e1) {
    try {
      // 其次合约
      const fut = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`)
      const price = parseFloat(fut.data.price).toFixed(4)
      return ctx.reply(`📉 ${symbol} 合约价格：$${price}`)
    } catch (e2) {
      return ctx.reply(`❌ 查询失败，${symbol} 可能不是支持的币种`)
    }
  }
})

// === 项目信息查询 ===
bot.command('info', async (ctx) => {
  const parts = ctx.message.text.split(' ')
  if (parts.length < 2) return ctx.reply('❌ 用法错误，例如：/info BTC')
  const query = parts[1].toLowerCase()
  try {
    // CoinGecko 查询
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${query}`)
    const coin = res.data
    const name = coin.name || query
    const desc = coin.description?.en?.slice(0, 300) || '无项目简介'
    const homepage = coin.links?.homepage?.[0] || '无官网'
    return ctx.replyWithMarkdownV2(`📘 *${name} 项目简介*\n\n${desc}\n\n🌐 官网: [${homepage}](${homepage})`)
  } catch (e) {
    return ctx.reply(`❌ 没有找到 ${query.toUpperCase()} 的详细资料`)
  }
})

// === AI 趋势预测（模拟占位） ===
bot.command('trend', async (ctx) => {
  const parts = ctx.message.text.split(' ')
  if (parts.length < 2) return ctx.reply('❌ 用法错误，例如：/trend BTC')
  const symbol = parts[1].toUpperCase()
  // TODO：调用你的AI模型服务
  return ctx.reply(`🤖 AI预测 ${symbol}：未来1小时趋势为 ⚠️ 震荡（模拟结果）`)
})

// === 启动提示 ===
bot.start((ctx) => {
  ctx.reply(`你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令`)
})

bot.launch()
console.log('🚀 机器人已启动')
