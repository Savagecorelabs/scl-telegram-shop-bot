require('dotenv').config();
const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MINI_APP_URL = process.env.MINI_APP_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) throw new Error('Missing BOT_TOKEN');

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const products = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'miniapp')));
app.get('/products.json', (req, res) => res.json(products));
app.get('/health', (req, res) => res.json({ ok: true }));

function money(n){ return `$${Number(n).toFixed(2)} AUD`; }
function makeOrderId(){ return `SCL-${Date.now().toString().slice(-6)}`; }

bot.start(ctx => ctx.reply('Welcome to Savage Core Labs.', Markup.inlineKeyboard([
  [Markup.button.webApp('🧪 Open SCL Shop', MINI_APP_URL)]
])));

bot.command('shop', ctx => ctx.reply('Open shop:', Markup.inlineKeyboard([
  [Markup.button.webApp('🧪 Open Shop', MINI_APP_URL)]
])));

bot.on('web_app_data', async ctx => {
  const payload = JSON.parse(ctx.webAppData.data);
  const orderId = makeOrderId();
  const items = payload.items.map(i => `• ${i.name} x${i.qty}`).join('\n');
  const msg = `🧪 NEW SCL ORDER\n\nOrder ID: ${orderId}\nName: ${payload.customer.name}\nTelegram: ${payload.customer.telegram || ''}\nLocation: ${payload.customer.suburb || ''} ${payload.customer.state || ''}\n\nItems:\n${items}\n\nTotal: ${money(payload.total)}\n\nStatus: Pending admin confirmation`;
  if (ADMIN_CHAT_ID) await bot.telegram.sendMessage(ADMIN_CHAT_ID, msg);
  await ctx.reply(`✅ Order request received.\nOrder ID: ${orderId}`);
});

bot.launch();
app.listen(PORT, () => console.log(`Running on ${PORT}`));
