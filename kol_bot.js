import 'dotenv/config'; // 直接加载 .env 文件（等同于 dotenv.config()）
import { Telegraf } from 'telegraf';
import { OpenAI } from 'openai';

// ✅ 校验 BOT_TOKEN 是否存在
if (!process.env.BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in environment variables.");
  process.exit(1);
}

// ✅ 初始化 Telegraf Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// ✅ 初始化 OpenAI（GPT-4）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ 指令处理（/start）
bot.start((ctx) => {
  ctx.reply('👋 欢迎使用 KOL 合约机器人！发送任意问题开始对话～');
});

// ✅ 普通消息处理：调用 GPT-4
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  try {
    // 发给 OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '你是一个中文加密货币KOL，语气专业、有逻辑，擅长分析合约交易策略。' },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    ctx.reply(reply || '⚠️ GPT 回复为空，请稍后再试。');
  } catch (err) {
    console.error("GPT 请求失败：", err);
    ctx.reply('⚠️ 出错了，请稍后再试。');
  }
});

// ✅ 启动 bot
bot.launch();
console.log('✅ KOL Bot (GPT-4) 已启动...');
