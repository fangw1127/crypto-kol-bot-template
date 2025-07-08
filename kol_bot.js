// kol_bot.js (ES Module Version - Railway-ready)
import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import { Configuration, OpenAIApi } from 'openai';
import fetch from 'node-fetch';

// === 环境变量加载校验 ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TELEGRAM_TOKEN || !OPENAI_API_KEY) {
  console.error('[❌ ERROR] Missing TELEGRAM_TOKEN or OPENAI_API_KEY in environment variables');
  process.exit(1);
}

// === 初始化 Telegram Bot ===
const bot = new Telegraf(TELEGRAM_TOKEN);

// === 初始化 OpenAI ===
const openai = new OpenAIApi(
  new Configuration({ apiKey: OPENAI_API_KEY })
);

// === 用户命令响应 ===
bot.start((ctx) => ctx.reply('👋 欢迎使用 KOL 合约机器人！请输入币种名称，如 "BTCUSDT"'));

bot.on('text', async (ctx) => {
  const query = ctx.message.text.trim().toUpperCase();
  if (!/^[A-Z]{3,10}USDT$/.test(query)) {
    return ctx.reply('⚠️ 币种格式错误，请输入如 BTCUSDT 或 ETHUSDT');
  }

  try {
    ctx.reply(`📊 获取 ${query} 合约信息中...`);

    // Binance 最新价格
    const priceRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${query}`);
    const priceData = await priceRes.json();
    const price = parseFloat(priceData.price).toFixed(4);

    // 使用 OpenAI 获取预测建议
    const prompt = `你是一个专业的加密货币合约分析师。当前币种为 ${query}，现价 ${price}。请给出未来1小时涨跌趋势预测，并建议合理的杠杆倍数与止盈止损策略。用简洁专业口吻回复。`;
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    const suggestion = aiRes.data.choices[0].message.content;
    ctx.reply(`📈 ${query} 当前价格：$${price}\n\n🤖 AI 策略建议：\n${suggestion}`);
  } catch (e) {
    console.error('❌ 错误:', e);
    ctx.reply('⚠️ 获取失败，请稍后重试。');
  }
});

// === 启动 Bot ===
bot.launch();
console.log('🤖 KOL 合约机器人启动成功！');

// === 优雅关闭 ===
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
