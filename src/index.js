require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.TOKEN);

let sessions = {}; // store temporary data before saving

// Function to load customers.json if exists
function loadCustomers() {
    if (fs.existsSync('customers.json')) {
        return JSON.parse(fs.readFileSync('customers.json', 'utf8'));
    }
    return [];
}

// Function to save customers.json
function saveCustomer(customer) {
    let customers = loadCustomers();
    customers.push(customer);
    fs.writeFileSync('customers.json', JSON.stringify(customers, null, 2));
}

// Start command
bot.start((ctx) => {
    ctx.reply('Welcome! Please send me your name.');
    sessions[ctx.chat.id] = {};
    
});


// Handle text messages
bot.on('text', (ctx) => {
    let id = ctx.chat.id;
    if (!sessions[id]) sessions[id] = {};

    if (!sessions[id].name) {
        sessions[id].name = ctx.message.text;
        ctx.reply(
            'Got it! Now please share your phone number:',
            Markup.keyboard([
                Markup.button.contactRequest('📱 Share my phone number')
            ]).resize()
        );
    }
    console.log(ctx);
});

bot.on('contact', (ctx) => {
    let id = ctx.chat.id;
    if (!sessions[id] || !sessions[id].name) {
        return ctx.reply('Please start by sending your name.');
    }

    let phone = ctx.message.contact.phone_number;
    let customers = loadCustomers();

    // Telefon raqami oldin mavjudligini tekshirish
    let exists = customers.some(c => c.phone === phone);

    if (exists) {
        ctx.reply('❌ Bu telefon raqami allaqachon ro‘yxatda mavjud.');
        delete sessions[id];
        return;
    }

    // Yangi mijoz yaratish
    let customer = {
        name: sessions[id].name,
        phone: phone
    };

    saveCustomer(customer);

    ctx.reply(`✅ Thank you, ${customer.name}! Your data has been saved.`);
    delete sessions[id];
});
// Command to view all customers (for admin only)
bot.command('list', (ctx) => {
    let customers = loadCustomers();
    if (customers.length === 0) {
        ctx.reply('No customers saved yet.');
    } else {
        let msg = customers.map((c, i) => `${i + 1}. ${c.name} - ${c.phone}`).join('\n');
        ctx.reply(`📋 Customer List:\n${msg}`);
    }
});


bot.launch();