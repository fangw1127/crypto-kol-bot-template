// === 📦 必要依赖安装（先执行）===
// npm install telegraf axios dotenv

import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// === 🧠 AI 预测函数（预留，可接模型） ===
async function getAIPrediction(symbol) {
  return `🤖 ${symbol} 未来趋势预测暂不可用，敬请期待！`;
}

// === 💰 查询现货或合约价格 ===
async function getCryptoPrice(symbol) {
  const upper = symbol.toUpperCase();
  try {
    // 优先查现货
    let res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${upper}USDT`);
    return `💰 ${upper} 现货价格: $${parseFloat(res.data.price).toFixed(4)}`;
  } catch (e1) {
    try {
      // 再查合约
      let res = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${upper}USDT`);
      return `📉 ${upper} 合约价格: $${parseFloat(res.data.price).toFixed(4)}`;
    } catch (e2) {
      return `❌ 查询失败，${upper} 可能不是支持的币种`;
    }
  }
}

// === 📚 查询币种项目信息（CoinGecko） ===
async function getCoinInfo(symbol) {
  try {
    const coinList = await axios.get('https://api.coingecko.com/api/v3/coins/list');
    const match = coinList.data.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
    if (!match) return `❌ 没有找到 ${symbol.toUpperCase()} 的详细资料`;

    const coinData = await axios.get(`https://api.coingecko.com/api/v3/coins/${match.id}`);
    const info = coinData.data;

    return `🧾 ${info.name} 项目信息\n\n` +
      `${info.description.en?.split('. ')[0] || '暂无介绍'}\n` +
      `官网: ${info.links.homepage[0] || '暂无'}\n` +
      `标签: ${info.categories.slice(0, 3).join(', ') || '无'}`;
  } catch (err) {
    return `❌ 查询 ${symbol.toUpperCase()} 项目信息失败，请稍后再试`;
  }
}

// === 🤖 命令绑定 ===
bot.start(ctx => ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令'));

bot.command('price', async ctx => {
  const symbol = ctx.message.text.split(' ')[1];
  if (!symbol) return ctx.reply('请输入币种，如 /price BTC');
  const msg = await getCryptoPrice(symbol);
  ctx.reply(msg);
});

bot.command('info', async ctx => {
  const symbol = ctx.message.text.split(' ')[1];
  if (!symbol) return ctx.reply('请输入币种，如 /info BTC');
  const msg = await getCoinInfo(symbol);
  ctx.reply(msg);
});

bot.command('trend', async ctx => {
  const symbol = ctx.message.text.split(' ')[1];
  if (!symbol) return ctx.reply('请输入币种，如 /trend BTC');
  const msg = await getAIPrediction(symbol);
  ctx.reply(msg);
});

bot.command('help', ctx => {
  ctx.reply('📌 支持以下命令:\n/price BTC - 查询价格\n/info ETH - 项目信息\n/trend SOL - AI预测\n/help - 显示帮助');
});

bot.launch().then(() => console.log('🚀 机器人已启动'));

// === 关闭提示 ===
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
