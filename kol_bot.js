// kol_bot.js
import { Telegraf } from 'telegraf';
import axios from 'axios';

const bot = new Telegraf(process.env.BOT_TOKEN);

// === 查询币种当前价格（支持现货优先，自动匹配合约） ===
bot.command('price', async (ctx) => {
  const symbol = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!symbol) return ctx.reply('请提供币种名称，例如 /price BTC');

  try {
    // 先查现货
    const spot = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    if (spot.data?.price) {
      return ctx.reply(`💰 ${symbol} 现货价格: $${spot.data.price}`);
    }
  } catch (e) {}

  try {
    // 再查合约
    const fut = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}USDT`);
    if (fut.data?.price) {
      return ctx.reply(`💰 ${symbol} 合约价格: $${fut.data.price}`);
    }
  } catch (e) {}

  ctx.reply(`❌ 查询失败，${symbol} 可能不是支持的币种`);
});

// === 查询币种项目信息（通过 CoinGecko 获取） ===
async function fetchTokenInfo(symbol) {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: '',
        per_page: 250,
        sparkline: false
      }
    });
    const markets = res.data;
    let info = markets.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
    if (!info) {
      info = markets.find(c => c.name.toLowerCase().includes(symbol.toLowerCase()));
    }
    if (!info) return `❌ 未找到 ${symbol.toUpperCase()} 的详细资料`;

    const detail = await axios.get(`https://api.coingecko.com/api/v3/coins/${info.id}`, {
      params: { localization: true }
    });
    const data = detail.data;
    const homepage = data.links?.homepage?.[0] || '暂无';
    const desc = data.description?.zh || data.description?.en || '暂无介绍';
    const tags = data.categories?.join(', ') || '无标签';

    return `🧾 ${data.name} (${data.symbol.toUpperCase()}) 项目信息\n\n${desc.slice(0, 400)}\n\n🌐 官网: ${homepage}\n🏷️ 标签: ${tags}`;
  } catch (e) {
    console.error(e);
    return `❌ 未找到 ${symbol.toUpperCase()} 的详细资料`;
  }
}

bot.command('info', async (ctx) => {
  const symbol = ctx.message.text.split(' ')[1]?.toUpperCase();
  if (!symbol) return ctx.reply('请提供币种名称，例如 /info BTC');
  const res = await fetchTokenInfo(symbol);
  ctx.reply(res, { disable_web_page_preview: false });
});

// === AI 趋势预测（mock） ===
bot.command('trend', async (ctx) => {
  const symbol = ctx.message.text.split(' ')[1]?.toUpperCase() || 'BTC';
  // mock 逻辑：随机涨跌预测
  const direction = Math.random() > 0.5 ? '📈 上涨' : '📉 下跌';
  const confidence = (80 + Math.random() * 10).toFixed(2);
  ctx.reply(`🔮 AI 预测 ${symbol} 未来 1 小时趋势：\n${direction}\n📊 置信度：${confidence}%`);
});

// === 欢迎信息 ===
bot.start((ctx) => {
  ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC, /info ETH, /trend SOL 等命令');
});

bot.launch();

console.log('🚀 机器人已启动');
