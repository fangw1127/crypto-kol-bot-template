import { Telegraf } from 'telegraf';
import axios from 'axios';

const bot = new Telegraf(process.env.BOT_TOKEN);

// 币价查询，合约优先，现货兜底
async function fetchPrice(symbol) {
  try {
    const symbolUSDT = symbol.toUpperCase() + 'USDT';

    // 尝试查合约价格
    try {
      const res = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbolUSDT}`);
      if (res.data.price) {
        return `📈 ${symbol.toUpperCase()} 合约最新价格：${parseFloat(res.data.price).toFixed(4)} USDT`;
      }
    } catch (_) {}

    // 合约失败，查现货价格
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbolUSDT}`);
    if (res.data.price) {
      return `📊 ${symbol.toUpperCase()} 现货最新价格：${parseFloat(res.data.price).toFixed(4)} USDT`;
    }

    return `❌ 查询失败，${symbol.toUpperCase()} 可能不是支持的币种`;
  } catch (e) {
    return '❌ 查询失败，请稍后重试';
  }
}

// 项目信息查询（使用 CoinGecko）
async function fetchTokenInfo(symbol) {
  try {
    const list = await axios.get('https://api.coingecko.com/api/v3/coins/list');
    const match = list.data.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());

    if (!match) return `❌ 没有找到 ${symbol.toUpperCase()} 的详细资料`;

    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${match.id}`);
    const info = res.data;
    const homepage = info.links?.homepage?.[0] || '暂无';
    const description = info.description?.zh || info.description?.en || '暂无介绍';
    const tags = info.categories?.join(', ') || '无标签';

    return `🧾 ${info.name} (${info.symbol.toUpperCase()}) 项目信息\n\n${description.slice(0, 500)}\n\n🌐 官网: ${homepage}\n🏷️ 标签: ${tags}`;
  } catch (e) {
    return `❌ 没有找到 ${symbol.toUpperCase()} 的详细资料`;
  }
}

// AI 趋势预测（目前无模型，返回提示）
async function aiTrendPrediction(symbol) {
  return `🤖 暂未接入 ${symbol.toUpperCase()} 的 AI 趋势预测模型，请稍后再试`;
}

// 处理命令
bot.start(ctx => ctx.reply('你好，我是 GPT-4 合约机器人 🤖，支持 /price BTC、/info ETH、/trend SOL 等命令'));

bot.command('price', async ctx => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('请提供币种，例如 /price BTC');
  const symbol = args[1];
  const result = await fetchPrice(symbol);
  ctx.reply(result);
});

bot.command('info', async ctx => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('请提供币种，例如 /info ETH');
  const symbol = args[1];
  const result = await fetchTokenInfo(symbol);
  ctx.reply(result, { parse_mode: 'HTML', disable_web_page_preview: false });
});

bot.command('trend', async ctx => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) return ctx.reply('请提供币种，例如 /trend SOL');
  const symbol = args[1];
  const result = await aiTrendPrediction(symbol);
  ctx.reply(result);
});

// 启动机器人
bot.launch().then(() => {
  console.log('🤖 机器人已启动');
});
