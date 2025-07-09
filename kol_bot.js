import { Telegraf } from 'telegraf';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// === 币价查询 ===
bot.command('price', async (ctx) => {
  const text = ctx.message.text;
  const parts = text.split(' ');
  const symbol = parts[1]?.toUpperCase();

  if (!symbol) return ctx.reply('请提供币种，例如 /price BTC');

  try {
    // 优先查合约，再查现货
    const endpoints = [
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`,
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    ];

    let price = null;
    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        if (res.data?.price) {
          price = res.data.price;
          break;
        }
      } catch (e) {}
    }

    if (price) {
      ctx.reply(`📊 ${symbol} 当前价格为：$${Number(price).toFixed(4)}`);
    } else {
      ctx.reply(`❌ 查询 ${symbol} 价格失败`);
    }
  } catch (err) {
    ctx.reply('❌ 查询失败，请稍后再试');
  }
});

// === 币种信息 ===
bot.command('info', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  const query = parts[1]?.toLowerCase();

  if (!query) return ctx.reply('请提供币种，例如 /info BTC');

  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${query}`;
    const searchRes = await axios.get(searchUrl);
    const coins = searchRes.data?.coins || [];
    const coin = coins.find(c => c.symbol.toLowerCase() === query || c.id.toLowerCase() === query || c.name.toLowerCase() === query);

    if (!coin) return ctx.reply(`❌ 没有找到 ${query.toUpperCase()} 的详细资料`);

    const coinDataRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
    const coinData = coinDataRes.data;

    const name = coinData.name;
    const symbol = coinData.symbol.toUpperCase();
    const desc = coinData.description?.en?.slice(0, 500) || '暂无介绍';
    const website = coinData.links?.homepage?.[0] || '暂无';
    const tags = coinData.categories?.join(', ') || '暂无';

    ctx.replyWithMarkdownV2(
      `🧾 *${name} (${symbol})* 项目信息\n\n${desc}\n\n🌐 官网: ${website}\n🏷️ 标签: ${tags}`
    );
  } catch (err) {
    ctx.reply(`❌ 没有找到 ${query.toUpperCase()} 的详细资料`);
  }
});

// === AI 趋势预测（模拟）===
bot.command('trend', async (ctx) => {
  const symbol = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!symbol) return ctx.reply('请提供币种，例如 /trend BTC');

  // 模拟结果（替换为真实 AI 模型输出逻辑）
  const directions = ['📈 看涨（建议做多）', '📉 看跌（建议做空）', '⚠️ 震荡（暂不操作）'];
  const prediction = directions[Math.floor(Math.random() * directions.length)];

  ctx.reply(`🤖 AI 预测：未来 1 小时 ${symbol} 趋势为：\n${prediction}`);
});

// 启动
bot.launch();
console.log('✅ Telegram KOL 机器人已启动');
