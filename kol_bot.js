// === 手动加载 .env 文件 ===
import dotenv from 'dotenv'
dotenv.config()

import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("❌ BOT_TOKEN is missing in environment variables.");
const bot = new Telegraf(BOT_TOKEN);

const BINANCE_BASE = 'https://api.binance.com';

// 获取币安价格
async function getBinancePrice(symbol, isFutures = false) {
  const base = isFutures
    ? 'https://fapi.binance.com'
    : 'https://api.binance.com';
  const url = `${base}/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.price) {
      return `💰 ${symbol.toUpperCase()} 当前价格: ${parseFloat(data.price).toFixed(2)} USDT`;
    } else {
      return `❌ 无法获取 ${symbol} 的价格，可能币种不存在或格式错误`;
    }
  } catch (e) {
    return `⚠️ 获取价格失败: ${e.message}`;
  }
}

// /price 命令
bot.command('price', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  const symbol = parts[1]?.toUpperCase();
  const isFutures = parts.includes('--futures');

  if (!symbol) {
    return ctx.reply('📌 用法: /price BTC 或 /price BTCUSDT --futures');
  }

  // 判断是否为现货币种（如 BTC）
  const spotSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
  const priceMsg = await getBinancePrice(spotSymbol, isFutures);
  return ctx.reply(priceMsg);
});

// 启动 Bot
bot.launch();
console.log("✅ KOL Bot (GPT-4) 已启动...");

