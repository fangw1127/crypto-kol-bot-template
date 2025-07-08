// 导入依赖
const { OpenAI } = require('openai');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// === 配置 ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// === 响应逻辑 ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();

  if (!userMessage) return;

  // 提示词构建：KOL风格 + 合约分析
  const prompt = `
你是一位中文加密货币KOL和合约专家，请用简洁、专业、有观点的方式回答问题。
问题来自用户：“${userMessage}”
请从以下角度作答：
1. 当前趋势解读（如是震荡、上涨、下跌）
2. 建议操作（多空方向、是否观望）
3. 风险提示（止盈止损）
请用中文回复，不超过200字。`;

  try {
    // 向 OpenAI 请求
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',  // 确保你的 API Key 有访问权限
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (reply) {
      await bot.sendMessage(chatId, reply);
    } else {
      await bot.sendMessage(chatId, '⚠️ 无法获取建议，请稍后再试。');
    }

  } catch (error) {
    console.error('❌ OpenAI 错误：', error.message || error);

    if (error.status === 401 || error.status === 403) {
      await bot.sendMessage(chatId, '⚠️ OpenAI API 授权失败，请检查你的密钥。');
    } else if (error.status === 429 || error.message.includes('quota')) {
      await bot.sendMessage(chatId, '⚠️ OpenAI 配额不足，请稍后重试或升级账户。');
    } else {
      await bot.sendMessage(chatId, '⚠️ 无法获取建议，请稍后再试。');
    }
  }
});
