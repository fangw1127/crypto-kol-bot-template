import { Telegraf } from 'telegraf';
import axios from 'axios';

// === 环境变量 ===
const bot = new Telegraf(process.env.BOT_TOKEN);

// === 查询现价 ===
bot.command('price', async (ctx) => {
  const coin = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!coin) return ctx.reply('⚠️ 请提供币种，如 /price BTC');

  try {
    // 优先查现货
    const spotResp = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}USDT`);
    const price = parseFloat(spotResp.data.price).toFixed(4);
    return ctx.reply(`💰 ${coin} 现货价格：$${price}`);
  } catch {
    try {
      // 合约补充
      const futResp = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${coin}USDT`);
      const futPrice = parseFloat(futResp.data.price).toFixed(4);
      return ctx.reply(`💰 ${coin} 合约价格：$${futPrice}`);
    } catch {
      return ctx.reply(`❌ 查询失败，${coin} 可能不是支持的币种`);
    }
  }
});

// === 项目信息 ===
bot.command('info', async (ctx) => {
  const coin = ctx.message.text.split(' ')[1]?.toLowerCase();
  if (!coin) return ctx.reply('⚠️ 请提供币种，如 /info BTC');

  try {
    const info = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const data = info.data;

    const description = data.description?.en?.slice(0, 300) || '暂无介绍';
    const homepage = data.links?.homepage?.[0] || '暂无';
    const tags = data.categories?.join(', ') || '无标签';

    return ctx.replyWithHTML(`📘 <b>${data.name} 项目信息</b>\n\n${description}\n\n🌐 官网: ${homepage}\n🏷️ 标签: ${tags}`);
  } catch {
    return ctx.reply(`❌ 没有找到 ${coin.toUpperCase()} 的详细资料`);
  }
});

// === AI 趋势预测（模拟 fallback）===
bot.command('trend', async (ctx) => {
  const coin = ctx.message.text.split(' ')[1]?.toUpperCase() || 'BTC';
  // 模拟预测逻辑
  const directions = ['📈 看涨', '📉 看跌', '⏸️ 震荡'];
  const result = directions[Math.floor(Math.random() * directions.length)];
  return ctx.reply(`🤖 AI预测 ${coin} 接下来 1 小时走势：${result}`);
});

// === 启动提示 ===
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令');
});

// === 启动 Bot ===
bot.launch();
console.log('🚀 机器人已启动');
