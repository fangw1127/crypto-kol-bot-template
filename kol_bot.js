import dotenv from "dotenv";
dotenv.config();

console.log("Bot Token:", process.env.TELEGRAM_TOKEN);  // ✅ 检查点
import { Telegraf } from 'telegraf';
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 欢迎使用【合约专家 KOL 机器人】

请输入币种（如：BTCUSDT）获取最新现价与策略建议：
📊 涨跌趋势 + 杠杆建议 + 止盈止损`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.trim().toUpperCase();
  if (text.startsWith('/')) return;

  try {
    const res = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${text}`);
    const price = parseFloat(res.data.price);

    const prompt = `
你是一个资深的币圈合约交易专家，现在${text}的价格为 ${price} USDT。
请判断未来1小时的市场趋势，并给出以下建议：
1. 未来1小时预测趋势（涨/跌/震荡）
2. 推荐交易方向（做多/做空/观望）
3. 建议杠杆倍数（如 5x、10x 等）
4. 止盈止损设置（%范围）
请用简洁中文回答。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = completion.choices[0].message.content;
    bot.sendMessage(chatId, `📈 【${text}】当前价格：${price} USDT\n\n🤖 策略建议：\n${reply}`);
  } catch (err) {
    console.error('❌ 出错', err.message || err);
    bot.sendMessage(chatId, `⚠️ 获取币种行情或策略失败，请检查币种是否正确（如 BTCUSDT）`);
  }
});
