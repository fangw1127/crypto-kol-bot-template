// kol_bot.js
import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';

const bot = new Telegraf(process.env.BOT_TOKEN);

// =================== 通用价格查询方法 ===================
async function getPrice(symbol = 'BTC') {
  const symbolUpper = symbol.toUpperCase();
  const spotSymbol = `${symbolUpper}USDT`;
  const futureSymbol = `${symbolUpper}USDT`;

  // 查询现货
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${spotSymbol}`);
    if (res.ok) {
      const data = await res.json();
      return parseFloat(data.price).toFixed(4);
    }
  } catch (e) {
    console.warn("⚠️ 现货查询失败，尝试合约", e);
  }

  // 查询合约
  try {
    const res = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${futureSymbol}`);
    if (res.ok) {
      const data = await res.json();
      return parseFloat(data.price).toFixed(4);
    }
  } catch (e) {
    console.error("❌ 合约查询失败", e);
  }

  return null;
}

// =================== 命令绑定 ===================
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令');
});

bot.command('price', async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const [, symbolRaw] = text.split(" ");
    const symbol = symbolRaw?.toUpperCase() || "BTC";

    console.log("🔍 正在查询价格：", symbol);
    const price = await getPrice(symbol);
    console.log("✅ 查询成功：", price);

    if (!price) {
      return ctx.reply("❌ 查询失败，请确认币种是否支持");
    }
    ctx.reply(`💰 ${symbol} 当前价格为：$${price}`);
  } catch (err) {
    console.error("❌ 查询失败：", err);
    ctx.reply("❌ 查询失败，请稍后再试");
  }
});

// 更多功能预留位
// bot.command('info', async (ctx) => {...})
// bot.command('trend', async (ctx) => {...})

// =================== 启动 Bot ===================
bot.launch();

console.log("🚀 机器人已启动");

// Graceful Stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
