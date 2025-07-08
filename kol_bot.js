// kol_bot_v2.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

// === 初始化 ===
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

let spotSymbols = new Set();
let futuresSymbols = new Set();

// === 加载支持币种（现货 + 合约） ===
async function loadSymbols() {
  try {
    const spotRes = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    spotSymbols = new Set(spotRes.data.symbols.map(s => s.symbol));

    const futRes = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
    futuresSymbols = new Set(futRes.data.symbols.map(s => s.symbol));

    console.log('✅ 币种列表加载完成');
  } catch (err) {
    console.error('❌ 币种列表加载失败', err.message);
  }
}
loadSymbols();

// === 获取现价 ===
async function getPrice(symbol) {
  try {
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    return parseFloat(res.data.price);
  } catch (err) {
    try {
      const res = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
      return parseFloat(res.data.price);
    } catch (e) {
      return null;
    }
  }
}

// === 生成图表链接（QuickChart 示例） ===
function getChartUrl(symbol) {
  return `https://quickchart.io/chart?c={type:'line',data:{labels:['-60min','','','','','','','now'],datasets:[{label:'${symbol}',data:[60,61,62,64,63,65,66]}]}}`;
}

// === GPT 合约建议 ===
async function getAiSuggestion(symbol, price) {
  const prompt = `你是一个专业的加密货币合约分析师，现在${symbol}的价格是 ${price} 美元。请基于当前市场趋势和AI预测，判断未来1小时走势（上涨/下跌/震荡），并给出合约建议，包括建议方向（多/空/观望）、推荐杠杆倍数、止盈止损价格。\n\n请使用以下格式回答：\n📈 趋势判断：\n💡 操作建议：\n🎯 止盈止损：`;

  const res = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return res.data.choices[0].message.content;
}

// === 通用指令处理 ===
bot.onText(/\/(分析|行情|图表|推荐)\s*(\w+)/i, async (msg, match) => {
  const cmd = match[1].toLowerCase();
  const base = match[2].toUpperCase();
  const symbol = base + 'USDT';
  const chatId = msg.chat.id;

  if (!spotSymbols.has(symbol) && !futuresSymbols.has(symbol)) {
    return bot.sendMessage(chatId, `❌ 不支持的币种：${base}`);
  }

  if (cmd === '图表') {
    const url = getChartUrl(symbol);
    return bot.sendPhoto(chatId, url, { caption: `${base} 图表（模拟图）` });
  }

  const price = await getPrice(symbol);
  if (!price) {
    return bot.sendMessage(chatId, '⚠️ 获取价格失败');
  }

  if (cmd === '行情') {
    return bot.sendMessage(chatId, `📊 ${base} 当前价格：$${price.toFixed(2)}`);
  }

  if (cmd === '分析' || cmd === '推荐') {
    bot.sendMessage(chatId, `💬 正在分析 ${base} ...`);
    try {
      const suggestion = await getAiSuggestion(symbol, price);
      return bot.sendMessage(chatId, suggestion);
    } catch (e) {
      return bot.sendMessage(chatId, '⚠️ AI 分析失败');
    }
  }
});

// === 帮助指令 ===
bot.onText(/\/start|\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `📈 欢迎使用合约KOL机器人\n支持命令：\n/分析 BTC\n/行情 OP\n/图表 SUI\n/推荐 LDO`);
});
