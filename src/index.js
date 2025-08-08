require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.TOKEN);

let sessions = {}; 


function loadCustomers() {
    if (fs.existsSync('customers.json')) {
        return JSON.parse(fs.readFileSync('customers.json', 'utf8'));
    }
    return [];
}



function saveCustomer(customer) {
    let customers = loadCustomers();
    customers.push(customer);
    fs.writeFileSync('customers.json', JSON.stringify(customers, null, 2));
}

bot.start((ctx) => {
    ctx.reply(
        "Mijozlar ro`yxatini olish va ularga xabar yuborish , faqat so`kilmasin 👊🏻",
        Markup.keyboard([
            ["➕ Add Customer", "📋 List of Customers"]
        ]).resize()
    );
});

// Tugmalar ishlashi
bot.hears("➕ Add Customer", (ctx) => {
    let id = ctx.chat.id;
    sessions[id] = { step: "get_name" };
    ctx.reply("Ismingizni kiriting:");
});


bot.hears("📋 List of Customers", (ctx) => {
    let customers = loadCustomers();

    if (!customers || customers.length === 0) {
        return ctx.reply("📭 Hozircha mijozlar yo‘q.");
    }

    let text = "📋 Mijozlar ro‘yxati:\n\n";
    customers.forEach((c, i) => {
        text += `${i + 1}) \n <b>Ismi:</b> <i>${c.name}</i>, \n <b>Raqami:</b> <i>${c.phone || "📞 yo‘q"}</i>, \n <b>Nima sotib olgan:</b> <i>${c.purchased_item || "📦 yo‘q"}</i> \n`;
    });

    ctx.reply(text , { parse_mode: "HTML" });
});

bot.on("text", (ctx) => {
    let id = ctx.chat.id;
    let session = sessions[id];

    if (!session) return "/start bosing"

    if (session.step === "get_name") {
        session.name = ctx.message.text;
        session.step = "get_item";
        ctx.reply("Xarid qilgan mahsulotingizni kiriting:");
    } 
    else if (session.step === "get_item") {
        session.purchased_item = ctx.message.text;
        session.step = "get_date";
        ctx.reply("Qachon xarid qilgan: Misol uchun 2023-29-01");
       
    } 
    else if (session.step === "get_date") {
        session.date = ctx.message.text;
        session.step = "get_contact";
        ctx.reply("Mijozning telefon raqamini yuboring")
       
    }
    else if (session.step === "get_contact") {
        session.contact = ctx.message.text;

         let customers = {
            name: session.name,
            phone: session.contact,
            date: session.date,
            purchased_item: session.purchased_item
        }
        saveCustomer(customers)

        ctx.reply(
            `✅ Rahmat, ${session.name} okamzani! Ma'lumotlari saqlandi.`,
            Markup.keyboard([
                ["➕ Add Customer", "📋 List of Customers"]
            ]).resize()
        );
        delete sessions[id];
    }

});




bot.launch();