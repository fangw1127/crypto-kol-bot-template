// kol_bot.js
import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// 启动欢迎语
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令');
});

// /price 命令：现货优先，合约兜底
bot.command('price', async (ctx) => {
  const input = ctx.message.text.split(' ');
  const symbol = (input[1] || '').toUpperCase();
  if (!symbol) return ctx.reply('⚠️ 请提供币种，例如：/price BTC');

  try {
    // 查询现货价格
    const spot = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    return ctx.reply(`📈 ${symbol}/USDT 现货价格：${parseFloat(spot.data.price).toFixed(4)} USDT`);
  } catch (e1) {
    try {
      // 查询合约价格
      const fut = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`);
      return ctx.reply(`📉 ${symbol}/USDT 合约价格：${parseFloat(fut.data.price).toFixed(4)} USDT`);
    } catch (e2) {
      return ctx.reply('❌ 查询失败，请稍后再试');
    }
  }
});

// /info 命令：币种基础信息（合约优先）
bot.command('info', async (ctx) => {
  const input = ctx.message.text.split(' ');
  const symbol = (input[1] || '').toUpperCase();
  if (!symbol) return ctx.reply('⚠️ 请提供币种，例如：/info BTC');

  try {
    // 合约币种信息
    const futRes = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
    const futSymbol = futRes.data.symbols.find(s => s.symbol === `${symbol}USDT`);

    if (futSymbol) {
      const filters = Object.fromEntries(futSymbol.filters.map(f => [f.filterType, f]));
      return ctx.reply(
        `📘 合约币种信息：${symbol}USDT\n` +
        `类型：${futSymbol.contractType} 合约\n` +
        `杠杆范围：1 ~ ${futSymbol.maxLeverage} 倍\n` +
        `最小下单量：${filters.LOT_SIZE.minQty}\n` +
        `价格精度：${filters.PRICE_FILTER.tickSize}`
      );
    }

    // 现货币种信息
    const spotRes = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const spotSymbol = spotRes.data.symbols.find(s => s.symbol === `${symbol}USDT`);

    if (spotSymbol) {
      const filters = Object.fromEntries(spotSymbol.filters.map(f => [f.filterType, f]));
      return ctx.reply(
        `📗 现货币种信息：${symbol}USDT\n` +
        `状态：${spotSymbol.status}\n` +
        `最小下单量：${filters.LOT_SIZE.minQty}\n` +
        `价格精度：${filters.PRICE_FILTER.tickSize}`
      );
    }

    return ctx.reply(`❌ 未找到 ${symbol} 相关信息，请检查币种名。`);
  } catch (err) {
    console.error(err);
    return ctx.reply('⚠️ 查询失败，请稍后再试');
  }
});

// 启动 bot
bot.launch();

console.log('🚀 机器人已启动');
