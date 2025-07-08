// === kol_bot.js (V2版，支持GPT-4、币安全币种、AI合约建议、多币种行情） ===

import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

// === 初始化 OpenAI GPT-4 ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === 初始化 Telegram Bot ===
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// === 币安行情 API ===
const BINANCE_BASE = "https://api.binance.com";

async function getPrice(symbol) {
  try {
    const res = await axios.get(`${BINANCE_BASE}/api/v3/ticker/price`, {
      params: { symbol },
    });
    return parseFloat(res.data.price);
  } catch (err) {
    return null;
  }
}

// === AI 合约建议生成器 ===
async function generateStrategy(symbol) {
  const price = await getPrice(symbol);
  if (!price) return `❌ 无法获取 ${symbol} 的现价`;

  const userPrompt = `你是一个专业的加密货币合约交易分析师。请针对币种 ${symbol} 当前价格为 ${price} USDT，预测未来1小时内的价格趋势（上涨、下跌、震荡），并给出：
1. 建议方向（做多/做空/观望）
2. 推荐杠杆倍数
3. 止盈止损建议
4. 简要理由（100字以内）`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userPrompt }],
    });
    return completion.choices[0].message.content;
  } catch (err) {
    return `❌ GPT 调用失败: ${err.message}`;
  }
}

// === 监听 Telegram 消息 ===
bot.onText(/\/(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1].trim().toUpperCase();

  if (!command.endsWith("USDT")) {
    bot.sendMessage(chatId, "⚠️ 请输入币种格式，例如：/BTCUSDT 或 /ETHUSDT");
    return;
  }

  bot.sendMessage(chatId, `📊 正在分析 ${command}...`);
  const response = await generateStrategy(command);
  bot.sendMessage(chatId, response);
});

// === 启动成功提示 ===
console.log("🤖 Crypto-KOL 合约专家机器人已启动");
