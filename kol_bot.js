import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const BOT_TOKEN = process.env.BOT_TOKEN;
const AI_PREDICT_ENDPOINT = process.env.AI_PREDICT_ENDPOINT;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// === 价格查询 ===
async function getSpotPrice(symbol) {
  const idMap = {
    btc: 'bitcoin',
    eth: 'ethereum',
    sol: 'solana',
    pepe: 'pepe',
  };
  const id = idMap[symbol.toLowerCase()];
  if (!id) return null;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: id,
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
    });
    return res.data[id];
  } catch (err) {
    return null;
  }
}

async function getFuturesPrice(symbol) {
  try {
    const res = await axios.get(
      `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`
    );
    const p = parseFloat(res.data.lastPrice);
    const chg = parseFloat(res.data.priceChangePercent);
    return { usd: p, usd_24h_change: chg };
  } catch {
    return null;
  }
}

// === 币种信息 ===
async function getCoinInfo(symbol) {
  try {
    const listRes = await axios.get(`https://api.coingecko.com/api/v3/coins/list`);
    const match = listRes.data.find(
      (c) => c.symbol.toLowerCase() === symbol.toLowerCase()
    );
    if (!match) return null;

    const detail = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${match.id}`
    );
    const data = detail.data;
    return {
      name: data.name,
      description: data.description.en?.slice(0, 500),
      homepage: data.links.homepage[0],
      whitepaper: data.links.official_forum_url?.[0] || '',
    };
  } catch {
    return null;
  }
}

// === AI 预测 ===
async function getTrendPrediction(symbol) {
  try {
    const res = await axios.post(AI_PREDICT_ENDPOINT, { symbol });
    return res.data; // { trend: 'up/down/neutral', confidence: 0.9 }
  } catch {
    return null;
  }
}

// === 指令处理 ===

bot.onText(/\/price (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const symbol = match[1].trim().toLowerCase();
  let priceData = await getSpotPrice(symbol);
  if (!priceData) priceData = await getFuturesPrice(symbol);

  if (!priceData) {
    return bot.sendMessage(chatId, `❌ 查询失败，${symbol.toUpperCase()} 可能不是支持的币种`);
  }

  bot.sendMessage(
    chatId,
    `📈 ${symbol.toUpperCase()} 当前价格：$${priceData.usd.toFixed(4)}\n24小时变动：${priceData.usd_24h_change.toFixed(2)}%`
  );
});

bot.onText(/\/info (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const symbol = match[1].trim().toLowerCase();
  const info = await getCoinInfo(symbol);

  if (!info) {
    return bot.sendMessage(chatId, `❌ 没有找到 ${symbol.toUpperCase()} 的详细资料`);
  }

  bot.sendMessage(
    chatId,
    `📘 ${info.name} 项目简介\n\n${info.description || '暂无描述'}\n\n🔗 官网: ${info.homepage}\n📄 白皮书: ${info.whitepaper || '未提供'}`
  );
});

bot.onText(/\/trend (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const symbol = match[1].trim().toLowerCase();
  const result = await getTrendPrediction(symbol);

  if (!result || !result.trend) {
    return bot.sendMessage(chatId, `❌ 无法获取 ${symbol.toUpperCase()} 的趋势预测`);
  }

  const emoji = result.trend === 'up' ? '🚀' : result.trend === 'down' ? '📉' : '🔄';
  bot.sendMessage(
    chatId,
    `${emoji} AI预测 ${symbol.toUpperCase()} 未来1小时趋势：${result.trend.toUpperCase()}（置信度 ${(result.confidence * 100).toFixed(1)}%）`
  );
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `欢迎使用 📊 KOL 合约机器人！支持以下功能：\n\n/price BTC — 查询币价\n/info BTC — 查看项目信息\n/trend BTC — AI预测趋势`
  );
});
