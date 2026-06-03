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

function money(n){ return `$${Number(n).toFixed(2)} AUD`; }
function makeOrderId(){ return `SCL-${Date.now().toString().slice(-6)}`; }

bot.on('web_app_data', async ctx => {
  try {
    console.log('WEB APP DATA RECEIVED:', ctx.webAppData.data);

    const payload = JSON.parse(ctx.webAppData.data);
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
    await ctx.reply(`✅ Order request received.\nOrder ID: ${orderId}`);
  } catch (err) {
    console.error('ORDER ERROR:', err);
    await ctx.reply('Order failed. Please message admin.');
  }
});
