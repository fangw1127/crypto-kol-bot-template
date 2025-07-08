import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// === 环境变量校验 ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

if (!BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN is missing in environment variables.');
}

const bot = new Telegraf(BOT_TOKEN);

// === /start 命令 ===
bot.start((ctx) => {
  console.log('✅ 收到 /start');
  ctx.reply('欢迎使用 📈 KOL 合约机器人！发送 /price BTC 查询现价');
});

// === /price 命令 ===
bot.command('price', async (ctx) => {
  const text = ctx.message.text;
  const args = text.split(' ');
  const symbol = (args[1] || 'BTC').toUpperCase();

  const pair = symbol + 'USDT';

  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
    const price = parseFloat(response.data.price).toFixed(2);
    const reply = `💰 ${symbol}/USDT 当前价格: $${price}`;
    console.log(`[PRICE] ${symbol} => $${price}`);
    ctx.reply(reply);
  } catch (error) {
    console.error('❌ 获取价格失败:', error.message);
    ctx.reply(`❌ 获取 ${symbol} 价格失败`);
  }
});

// === 任意文字回复，用于调试 ===
bot.on('text', async (ctx) => {
  console.log('🗣 收到文本消息:', ctx.message.text);
  ctx.reply('👋 我收到你的消息了，可用命令：/price BTC');
});

// === 启动 bot ===
bot.launch({ dropPendingUpdates: true });
console.log('✅ KOL Bot 已启动...');
