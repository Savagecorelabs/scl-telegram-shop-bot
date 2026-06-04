const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

let cart = [];

fetch('/products.json')
  .then(r => r.json())
  .then(products => {
    document.getElementById('products').innerHTML = products.map(p => `
      <div class="card">
        <b>${p.name}</b>
        <p>${p.category}</p>
        <p>$${p.price} AUD</p>
        <button onclick="addToCart('${p.id}', '${p.name}', ${p.price})">Add</button>
      </div>
    `).join('');
  });

function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  alert(`${name} added to cart`);
}

document.getElementById('cart').onclick = () => {
  if (!cart.length) {
    alert('Add a product first');
    return;
  }

const name = prompt('Full name?');
const telegram = prompt('Telegram username?');
const houseNumber = prompt('House/unit number?');
const streetAddress = prompt('Street address?');
const suburb = prompt('Suburb?');
const state = prompt('State?');
const postcode = prompt('Postcode?');
const paymentMethod = prompt('Payment method? BANK or CRYPTO');

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const order = {
    customer: {
      name,
      telegram,
      houseNumber,
      streetAddress,
      suburb,
      state,
      postcode,
      paymentMethod
    },
    items: cart,
    total
  };

  alert('Sending order to admin...');

  fetch('/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      alert(`Order sent. Order ID: ${data.orderId}`);
      cart = [];
    } else {
      alert('Order failed. Message admin.');
    }
  })
  .catch(() => alert('Order failed. Message admin.'));
};
