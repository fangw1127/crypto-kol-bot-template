require("dotenv").config();
const { Telegraf } = require("node-telegram-bot-api");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

// 初始化 OpenAI 和 Telegram
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 获取币种现价
async function getPrice(symbol) {
    const url = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
    try {
        const res = await axios.get(url);
        return parseFloat(res.data.price);
    } catch (err) {
        return null;
    }
}

// 构建提示词
function buildPrompt(symbol, price) {
    return `
你是一个专业的合约交易分析师，请根据如下数据，预测未来1小时内 ${symbol} 的涨跌趋势：

- 当前价格：${price} USDT
- 时间周期：未来1小时
- 请给出以下内容：
  1. 趋势判断（上涨/下跌/震荡）
  2. 推荐方向（做多/做空/观望）
  3. 建议杠杆倍数（合理风险控制）
  4. 推荐止盈止损位（以当前价为基础）
  5. 策略简要理由

请用简洁的中文回答，适合KOL在频道中直接转发。
`;
}

// 处理 Telegram 指令
bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim().toUpperCase();
    if (!text.startsWith("/TREND ")) return;

    const symbol = text.split(" ")[1];
    if (!symbol || !symbol.endsWith("USDT")) {
        return ctx.reply("请使用格式：`/trend BTCUSDT`", { parse_mode: "Markdown" });
    }

    const price = await getPrice(symbol);
    if (!price) {
        return ctx.reply("获取币种行情失败，请检查币种是否正确。");
    }

    const prompt = buildPrompt(symbol, price);

    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [
                { role: "system", content: "你是资深币圈KOL，擅长合约分析与策略建议。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.7
        });

        const reply = completion.data.choices[0].message.content;
        ctx.reply(`📈 ${symbol} 当前价格：${price} USDT\n\n${reply}`);
    } catch (err) {
        console.error("OpenAI 错误：", err?.response?.data || err.message);
        ctx.reply("❌ ChatGPT 请求失败，请检查 API KEY 配额是否足够。");
    }
});

// 启动机器人
bot.launch();
console.log("✅ KOL 合约机器人已启动");
