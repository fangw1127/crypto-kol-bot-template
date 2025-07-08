require('dotenv').config()
const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api')
const system_prompt = "你是一个加密领域的KOL，语气专业、简洁，善于分析走势，用词权威。";

// 创建 Telegram 机器人
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// 获取实时行情（CoinGecko 示例）
async function getMarketSummary() {
  try {
    const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,solana',
        vs_currencies: 'usd',
        include_24hr_change: true,
      },
    })
    return `
📊 当前行情：
• BTC: $${data.bitcoin.usd.toFixed(2)}（24h ${data.bitcoin.usd_24h_change.toFixed(2)}%）
• ETH: $${data.ethereum.usd.toFixed(2)}（24h ${data.ethereum.usd_24h_change.toFixed(2)}%）
• SOL: $${data.solana.usd.toFixed(2)}（24h ${data.solana.usd_24h_change.toFixed(2)}%）
`
  } catch (error) {
    return '❌ 获取市场行情失败，请稍后重试。'
  }
}

// 处理用户消息
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const question = msg.text?.trim()

  if (!question) return bot.sendMessage(chatId, '请输入问题～')

  const market = await getMarketSummary()

  // 调用 OpenAI API
  try {
    const { data } = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: '你是一个专业的加密货币策略分析师，结合市场行情，回答用户问题。' },
          { role: 'user', content: `${market}\n\n用户提问：${question}` },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    )

    const answer = data.choices[0].message.content
    bot.sendMessage(chatId, answer)
  } catch (err) {
    console.error('❌ OpenAI API 调用失败:', err.response?.data || err.message)
    bot.sendMessage(chatId, '⚠️ 无法获取建议，请稍后再试。')
  }
})
