import 'dotenv/config';
import { Telegraf } from 'telegraf';
import OpenAI from 'openai';

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

bot.start((ctx) => {
  ctx.reply('👋 欢迎使用合约 KOL 机器人！请输入你关心的币种或合约问题。');
});

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的加密货币合约专家，用通俗易懂的 KOL 语气回答用户问题。请结合实际市场情况与投资逻辑，提供明确观点。',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    ctx.reply(reply);
  } catch (err) {
    console.error('❌ OpenAI 错误:', err);
    ctx.reply('⚠️ 无法获取 GPT-4 回应，请稍后再试。');
  }
});

bot.launch();
console.log('✅ KOL Bot (GPT-4) 已启动...');
