// kol_bot.js
import 'dotenv/config' // 👈 Railway 才能识别 BOT_TOKEN 等变量
import { Telegraf } from 'telegraf'

if (!process.env.BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN is missing in environment variables.")
}

console.log("✅ 启动中，BOT_TOKEN 已加载")

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('你好，我是 GPT-4 合约助手 🤖'))
bot.launch()
console.log('🤖 KOL Bot 正在运行...')
