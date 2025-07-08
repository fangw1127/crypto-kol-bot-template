import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('❌ BOT_TOKEN is missing in environment variables.');

const bot = new Telegraf(BOT_TOKEN);

const BINANCE_API = 'https://api.binance.com';
const headers = { 'User-Agent': 'crypto-kol-bot' };

// 🚀 机器人启动
bot.launch().then(() => console.log('🚀 机器人已启动'));

// /start 欢迎消息
bot.start((ctx) => ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令'));

// ✅ 币种映射（优先现货）
const getSymbolPair = async (symbol) => {
  const { data: spotList } = await axios.get(`${BINANCE_API}/api/v3/exchangeInfo`);
  const { data: futList } = await axios.get(`${BINANCE_API}/fapi/v1/exchangeInfo`);
  const upper = symbol.toUpperCase();
  if (spotList.symbols.find(s => s.symbol === upper + 'USDT')) return { pair: upper + 'USDT', type: 'spot' };
  if (futList.symbols.find(s => s.symbol === upper + 'USDT')) return { pair: upper + 'USDT', type: 'futures' };
  return null;
};

// ✅ /price 查询价格，优先现货
bot.command('price', async (ctx) => {
  const token = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!token) return ctx.reply('请输入币种，例如：/price BTC');
  try {
    const info = await getSymbolPair(token);
    if (!info) return ctx.reply(`❌ 查询失败，${token} 可能不是支持的币种`);
    const endpoint = info.type === 'spot' ? '/api/v3/ticker/price' : '/fapi/v1/ticker/price';
    const res = await axios.get(`${BINANCE_API}${endpoint}?symbol=${info.pair}`, { headers });
    ctx.reply(`💰 ${info.pair} 当前${info.type === 'spot' ? '现货' : '合约'}价格：${res.data.price}`);
  } catch (err) {
    ctx.reply('❌ 查询失败，请稍后再试');
  }
});

// ✅ /info 查看币种行情信息
bot.command('info', async (ctx) => {
  const token = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!token) return ctx.reply('请输入币种，例如：/info BTC');
  try {
    const info = await getSymbolPair(token);
    if (!info) return ctx.reply(`❌ 查询失败，${token} 可能不是支持的币种`);
    const endpoint = info.type === 'spot' ? '/api/v3/ticker/24hr' : '/fapi/v1/ticker/24hr';
    const { data } = await axios.get(`${BINANCE_API}${endpoint}?symbol=${info.pair}`, { headers });
    ctx.reply(
      `📊 ${info.pair} (${info.type}) 最新行情：\n` +
      `价格：${data.lastPrice}\n涨跌幅：${data.priceChangePercent}%\n` +
      `最高：${data.highPrice}，最低：${data.lowPrice}\n成交量：${data.volume}`
    );
  } catch {
    ctx.reply('❌ 查询失败，请稍后再试');
  }
});

// ✅ /trend 模拟未来1小时预测（替换为你的 AI 预测）
bot.command('trend', async (ctx) => {
  const token = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!token) return ctx.reply('请输入币种，例如：/trend BTC');
  try {
    const fakePrediction = Math.random();
    let trend = fakePrediction > 0.66 ? '📈 上涨' : fakePrediction < 0.33 ? '📉 下跌' : '🔄 横盘';
    const confidence = (70 + Math.random() * 30).toFixed(2);
    ctx.reply(`📡 AI预测 ${token}：${trend}\n置信度约 ${confidence}%`);
  } catch {
    ctx.reply('❌ 预测失败，请稍后再试');
  }
});

// ✅ /longshort 返回合约交易建议（模拟）
bot.command('longshort', async (ctx) => {
  const token = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!token) return ctx.reply('请输入币种，例如：/longshort BTC');
  try {
    const rand = Math.random();
    let signal = rand > 0.66 ? '建议做多 📈' : rand < 0.33 ? '建议做空 📉' : '建议观望 ⚖️';
    ctx.reply(`📉 ${token} 合约信号：\n${signal}\n止盈：+0.5%｜止损：-0.3%`);
  } catch {
    ctx.reply('❌ 获取建议失败，请稍后再试');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
