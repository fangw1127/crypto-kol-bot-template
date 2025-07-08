// kol_bot.js
import 'dotenv/config'
import { Telegraf } from 'telegraf'

if (!process.env.BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is missing in environment variables.")
}

console.log("✅ BOT_TOKEN =", process.env.BOT_TOKEN)

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('👋 你好，我是 GPT-4 合约助手！'))

bot.launch()
console.log('🤖 KOL Bot 启动成功...')
