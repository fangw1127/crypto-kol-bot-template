// === 加载环境变量 ===
import dotenv from 'dotenv'
dotenv.config()

// === 校验 token ===
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN 环境变量未设置，无法启动机器人。')
  console.error('📌 请确认你在 Railway 或部署平台已添加环境变量 BOT_TOKEN。')
  process.exit(1)
}

import { Telegraf } from 'telegraf'
import axios from 'axios'

// === 初始化 Bot ===
const bot = new Telegraf(process.env.BOT_TOKEN)
console.log('🚀 机器人已启动')

// === 指令: /start
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 👋')
})

// === 指令: /price BTC
bot.command('price', async (ctx) => {
  const input = ctx.message.text.split(' ')
  const symbol = input[1]?.toUpperCase()

  if (!symbol) {
    return ctx.reply('请提供币种，如 /price BTC')
  }

  try {
    // 先查现货（spot）
    let resp = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`)
    const price = parseFloat(resp.data.price)
    return ctx.reply(`💰 ${symbol}/USDT 当前现货价格：${price.toFixed(4)} USDT`)
  } catch (e1) {
    try {
      // 再查合约（futures）
      let fut = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`)
      const futPrice = parseFloat(fut.data.price)
      return ctx.reply(`💰 ${symbol}/USDT 当前合约价格：${futPrice.toFixed(4)} USDT`)
    } catch (e2) {
      return ctx.reply(`❌ 查询失败，${symbol} 可能不是支持的币种`)
    }
  }
})

// === 启动
bot.launch()
