// kol_bot.js

import axios from 'axios'
import TelegramBot from 'node-telegram-bot-api'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// 缓存 CoinGecko 支持币种列表
let coinListCache = {}

async function getCoinId(symbol) {
  try {
    if (Object.keys(coinListCache).length === 0) {
      const res = await axios.get('https://api.coingecko.com/api/v3/coins/list')
      coinListCache = res.data.reduce((acc, coin) => {
        acc[coin.symbol.toLowerCase()] = coin.id
        return acc
      }, {})
    }
    return coinListCache[symbol.toLowerCase()] || null
  } catch (err) {
    console.error('Coin ID 获取失败:', err)
    return null
  }
}

async function getCoinInfo(symbol) {
  const coinId = await getCoinId(symbol)
  if (!coinId) return null

  try {
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`)
    return {
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      desc: data.description?.zh || data.description?.en || '暂无介绍',
      homepage: data.links.homepage?.[0] || '暂无',
      categories: data.categories?.join(', ') || '暂无',
    }
  } catch (err) {
    console.error('币种详情获取失败:', err)
    return null
  }
}

bot.onText(/\/info (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const symbol = match[1]?.trim()
  if (!symbol) return bot.sendMessage(chatId, '⚠️ 格式错误，请输入：/info 币种')

  const info = await getCoinInfo(symbol)
  if (!info) {
    return bot.sendMessage(chatId, `❌ 未找到 ${symbol.toUpperCase()} 的详细资料`)
  }

  const text = `🧾 ${info.name} (${info.symbol})\n\n介绍: ${info.desc}\n官网: ${info.homepage}\n标签: ${info.categories}`
  bot.sendMessage(chatId, text)
})

// 其他指令（略）
