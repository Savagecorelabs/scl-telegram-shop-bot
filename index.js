require('dotenv').config();
const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MINI_APP_URL = 'https://scl-telegram-shop-bot-production.up.railway.app';
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) throw new Error('Missing BOT_TOKEN');

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8')
);

app.use(express.json());
app.use(express.static(__dirname));
app.get('/products.json', (req, res) => res.json(products));
app.get('/health', (req, res) => res.json({ ok: true }));
app.post('/order', async (req, res) => {
  try {
    console.log('HTTP ORDER RECEIVED:', req.body);

    const payload = req.body;
    const orderId = makeOrderId();
    const items = payload.items.map(i => `• ${i.name} x${i.qty}`).join('\n');

    const msg = `🧪 NEW SCL ORDER

Order ID: ${orderId}

Name: ${payload.customer.name}
Telegram: ${payload.customer.telegram || ''}
Location: ${payload.customer.suburb || ''} ${payload.customer.state || ''}

Items:
${items}

Total: ${money(payload.total)}

Status: Pending admin confirmation`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, msg);

    res.json({ ok: true, orderId });
  } catch (err) {
    console.error('HTTP ORDER ERROR:', err);
    res.status(500).json({ ok: false });
  }
});
function money(n){ return `$${Number(n).toFixed(2)} AUD`; }
function makeOrderId(){ return `SCL-${Date.now().toString().slice(-6)}`; }
bot.start(ctx => ctx.reply('Welcome to Savage Core Labs.', Markup.inlineKeyboard([
  [Markup.button.webApp('🧪 Open SCL Shop', MINI_APP_URL)]
])));

bot.command('shop', ctx => ctx.reply('Open shop:', Markup.inlineKeyboard([
  [Markup.button.webApp('🧪 Open Shop', MINI_APP_URL)]
])));

bot.command('id', ctx => {
  ctx.reply(`Chat ID: ${ctx.chat.id}`);
});
bot.on('web_app_data', async ctx => {
  try {
    console.log('WEB APP DATA RECEIVED:', ctx.webAppData.data);

    const payload = JSON.parse(ctx.webAppData.data);
    const orderId = makeOrderId();
    const items = payload.items.map(i => `• ${i.name} x${i.qty}`).join('\n');

const msg = `🧪 NEW SCL ORDER

Order ID: ${orderId}

Customer:
Name: ${payload.customer.name || ''}
Telegram: ${payload.customer.telegram || ''}

Address:
${payload.customer.houseNumber || ''} ${payload.customer.streetAddress || ''}
${payload.customer.suburb || ''} ${payload.customer.state || ''} ${payload.customer.postcode || ''}

Payment Method:
${payload.customer.paymentMethod || 'Not selected'}

Items:
${items}

Total: ${money(payload.total)}

Status: Pending admin confirmation`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, msg);
    await ctx.reply(`✅ Order request received.\nOrder ID: ${orderId}`);
  } catch (err) {
    console.error('ORDER ERROR:', err);
    await ctx.reply('Order failed. Please message admin.');
  }
});
bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => bot.launch())
  .then(() => console.log('Telegram bot launched successfully'))
  .catch(err => console.error('BOT LAUNCH ERROR:', err));

app.listen(PORT, () => console.log(`Running on ${PORT}`));
