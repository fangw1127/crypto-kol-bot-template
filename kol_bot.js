// kol_bot.js

import { Telegraf } from 'telegraf'
import axios from 'axios'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// 币安所有交易对缓存
let binanceSymbols = []

// 初始化加载交易对列表
async function loadBinanceSymbols() {
  try {
    const res = await axios.get('https://api.binance.com/api/v3/exchangeInfo')
    binanceSymbols = res.data.symbols.map(s => s.symbol)
    console.log(`✅ Binance 交易对已加载 (${binanceSymbols.length}) 个`)
  } catch (err) {
    console.error('❌ 获取币安交易对列表失败', err.message)
  }
}

// 启动时加载交易对列表
loadBinanceSymbols()

// /start 指令
bot.start((ctx) => ctx.reply('🤖 欢迎使用加密货币 KOL 助手！发送 /price BTC 查看币价'))

// /price 查询币价
bot.command('price', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1)
  if (args.length === 0) {
    return ctx.reply('❗用法：/price BTC（输入币种简称）')
  }

  const symbolInput = args[0].toUpperCase()

  // 查找匹配的现货 USDT 交易对
  const match = binanceSymbols.find(s =>
    s.endsWith('USDT') && s.includes(symbolInput)
  )

  if (!match) {
    return ctx.reply(`❌ 查询失败，${symbolInput} 可能不是支持的币种`)
  }

  try {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${match}`
    const res = await axios.get(url)
    const price = parseFloat(res.data.price)

    return ctx.reply(`💰 ${match} 当前价格：${price.toLocaleString()} USDT`)
  } catch (err) {
    console.error('❌ 获取价格失败', err.message)
    return ctx.reply(`❌ 获取 ${match} 价格失败`)
  }
})

bot.launch()
console.log('🚀 机器人已启动')
