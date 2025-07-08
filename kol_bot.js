const TelegramBot = require('node-telegram-bot-api');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');

// === 环境变量 ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// === 初始化 Telegram Bot ===
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// === 初始化 OpenAI ===
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// === 获取币安实时行情数据 ===
async function getMarketContext(symbol = 'BTCUSDT') {
  try {
    const priceRes = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const latestPrice = parseFloat(priceRes.data.price);

    const klineRes = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=2`);
    const prevClose = parseFloat(klineRes.data[0][4]);
    const changePct = ((latestPrice - prevClose) / prevClose) * 100;

    return `当前${symbol}价格为 ${latestPrice.toFixed(2)} USDT，过去1小时涨幅为 ${changePct.toFixed(2)}%。`;
  } catch (err) {
    return '⚠️ 无法获取行情数据，请稍后再试。';
  }
}

// === 处理用户消息 ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const prompt = msg.text;

  // 获取行情上下文
  const market = await getMarketContext();

  // 构造 GPT 请求
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一位专业的加密货币合约交易专家，请根据实时行情给出简洁、清晰、实际可操作的建议。包括：趋势判断、可能的入场价、止盈止损策略等。"
        },
        {
          role: "user",
          content: `${market}\n\n用户提问：${prompt}`
        }
      ]
    });

    const reply = completion.data.choices[0].message.content;
    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("❌ OpenAI API 调用失败:", error.message);
    bot.sendMessage(chatId, '⚠️ 无法获取建议，请稍后再试。');
  }
});
