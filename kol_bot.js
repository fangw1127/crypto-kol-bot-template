// === 手动加载 .env 文件 ===
import dotenv from 'dotenv'
dotenv.config()

import { Telegraf } from 'telegraf'

const token = process.env.BOT_TOKEN

if (!token) {
  throw new Error('❌ BOT_TOKEN is missing in environment variables.')
}

const bot = new Telegraf(token)

bot.start((ctx) => ctx.reply('你好，我是 GPT-4 合约机器人 👋'))
bot.command('help', (ctx) => ctx.reply('输入任何合约问题，我将用 GPT-4 帮你分析 📈'))

bot.launch()
console.log('✅ KOL Bot 已启动...')
