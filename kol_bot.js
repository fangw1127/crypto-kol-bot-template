require('dotenv').config()
const axios = require('axios')
const TelegramBot = require('node-telegram-bot-api')

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
          { role: 'system', content: '你是一位经验丰富的合约交易专家，擅长分析币种的趋势、支撑压力位、合约方向、入场价格、止盈止损建议。你的语言简洁明确，具有实战操作性。' },
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
