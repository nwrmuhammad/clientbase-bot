require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");
const Customer = require("./models/customers");

const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");
const accessMiddleware = require("./middleware/access_admin");

const bot = new Telegraf(process.env.TOKEN);

let sessions = {};

// function loadCustomers() {
//   if (fs.existsSync("customers.json")) {
//     return JSON.parse(fs.readFileSync("customers.json", "utf8"));
//   }
//   return [];
// }

// function saveCustomer(customer) {
//   let customers = loadCustomers();
//   customers.push(customer);
//   fs.writeFileSync("customers.json", JSON.stringify(customers, null, 2));
// }

bot.use(accessMiddleware);

bot.start((ctx) => {
  console.log(ctx.from.id);
  ctx.reply(
    "Mijozlar ro`yxatini olish va ularga xabar yuborish , faqat so`kilmasin 👊🏻",
    Markup.keyboard([
      ["➕ Mijoz qo`shish"],
      ["📋 Mijozlar ro`yxati", "🗑 Mijozlarni o'chirish"],
      ["📊 Statistika"],
      ["📥 Mijozlarni Excelga yuklash"],
    ]).resize()
  );
});

// Tugmalar ishlashi
bot.hears("🗑 Mijozlarni o'chirish", (ctx) => {
  const id = ctx.chat.id;
  sessions[id] = { step: "delete_customer" }; // New step
  ctx.reply("O'chirmoqchi bo'lgan mijozning telefon raqamini kiriting:");
});

bot.hears("➕ Mijoz qo`shish", (ctx) => {
  let id = ctx.chat.id;
  sessions[id] = { step: "get_name" };
  ctx.reply("Mijoz ismini kiriting:");
});

bot.hears("📥 Mijozlarni Excelga yuklash", async (ctx) => {
  let customers = await Customer.findAll();

  if (!customers || customers.length === 0) {
    return ctx.reply("📭 Hozircha mijozlar yo'q.");
  }

  // Excelga tayyorlash — O'zbekcha ustunlar + chiroyli sana
  const excelData = customers.map((c, index) => ({
    "№": index + 1,
    Ismi: c.name || "",
    "Telefon raqami": c.phone || "",
    "Sotib olgan mahsuloti": c.purchased_item || "",
    Sana: c.date || "",
    "Qo‘shilgan vaqti": c.created_at
      ? new Date(c.created_at).toLocaleString("uz-UZ", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  }));

  // JSON → Sheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Ustun kengliklarini sozlash
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
  ];

  // AutoFilter qo‘yish (A1 dan F1 gacha)
  worksheet["!autofilter"] = { ref: "A1:F1" };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mijozlar");

  // Fayl nomi
  const filePath = path.join(__dirname, "mijozlar.xlsx");

  // Excel fayl yaratish
  XLSX.writeFile(workbook, filePath);

  // Foydalanuvchiga yuborish
  ctx.replyWithDocument({ source: filePath }).then(() => {
    // Yuborilgandan keyin faylni o‘chirish
    fs.unlinkSync(filePath);
  });
});

bot.hears("📋 Mijozlar ro`yxati", async (ctx) => {
  let customers = await Customer.findAll();

  if (!customers || customers.length === 0) {
    return ctx.reply("📭 Hozircha mijozlar yo'q.");
  }

  let text = "📋 Mijozlar ro'yxati:\n\n";

  customers.forEach((c, i) => {
    text += ` <b>#${i + 1}</b>\n`;
    text += ` <b>Ismi:</b> <i>${c.name}</i>\n`;
    text += ` <b>Raqami:</b> <i>${c.phone || "yo‘q"}</i>\n`;
    text += ` <b>Nima sotib olgan:</b> <i>${c.purchased_item || "yo‘q"}</i>\n`;
    text += ` <b>Sana:</b> <i>${c.date || "—"}</i>\n`;
    text += ` <b>Qo‘shilgan vaqt:</b> <i>${
      c.created_at ? new Date(c.created_at).toLocaleString("uz-UZ") : "—"
    }</i>\n`;
    text += `━━━━━━━━━━━━━━\n`;
  });

  ctx.reply(text, { parse_mode: "HTML" });
});

bot.hears("📊 Statistika", async (ctx) => {
  const customers = await Customer.findAll();
  const today = new Date().toISOString().split("T")[0];

  const todayCustomers = customers.filter((c) => {
    const customerDate = new Date(c.created_at).toISOString().split("T")[0];
    return customerDate === today;
  }).length;

  const totalCustomers = customers.length;

  ctx.reply(`
📊 Bugungi statistika: \n
 -- Yangi mijozlar: ${todayCustomers}
 -- Jami mijozlar: ${totalCustomers}
  `);
});

bot.on("text", async (ctx, next) => {
  let id = ctx.chat.id;
  let session = sessions[id];

  if (!session) return ctx.reply("/start bosing");

  if (session.step === "get_name") {
    session.name = ctx.message.text;
    session.step = "get_item";
    ctx.reply("Xarid qilingan mahsulotni kiriting:");
  } else if (session.step === "get_item") {
    session.purchased_item = ctx.message.text;
    session.step = "get_date";
    ctx.reply("Qachon xarid qilingan: Misol uchun 29.01.2023");
  } else if (session.step === "get_date") {
    const input = ctx.message.text.trim();

    // Regex for DD.MM.YYYY
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;

    if (!dateRegex.test(input)) {
      return ctx.reply("❌ Sana formati noto‘g‘ri.\nNamuna: 25.08.2025");
    }

    // Extract day, month, year
    const [, day, month, year] = input.match(dateRegex);

    // Check if it's a real date
    const dateObj = new Date(year, month - 1, day);
    const isValid =
      dateObj.getFullYear() == year &&
      dateObj.getMonth() == month - 1 &&
      dateObj.getDate() == day;

    if (!isValid) {
      return ctx.reply("❌ Sana noto'g'ri. Iltimos, haqiqiy sanani kiriting.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Remove time part
    if (dateObj > today) {
      return ctx.reply(
        "❌ Xali bu kunlargacha yetib kelmadik og'a. Iltimos, bugungi yoki o'tgan sanani kiriting."
      );
    }

    session.date = input;
    session.step = "get_contact";
    ctx.reply(
      "Mijozning telefon raqamini yuboring (9 xonali yoki +998 formatida)"
    );
  } else if (session.step === "get_contact") {
    const existingCustomers = await Customer.findAll({ raw: true });

    let input = ctx.message.text.trim();

    if (!/^\+?998\d{9}$/.test(input) && !/^\d{9}$/.test(input)) {
      return ctx.reply("❌ Telefon raqam formati noto'g'ri. Qayta kiriting.");
    }

    // Remove non-digit characters
    let digits = input.replace(/\D/g, "");

    let formattedPhone = null;

    // ✅ 9 digits → treat as local Uzbekistan number
    if (/^\d{9}$/.test(digits)) {
      formattedPhone = "+998" + digits;
    }
    // ✅ 12 digits starting with 998
    else if (/^998\d{9}$/.test(digits)) {
      formattedPhone = "+" + digits;
    }
    // ✅ Already has +998XXXXXXXXX
    else if (/^\+998\d{9}$/.test(input)) {
      formattedPhone = input;
    }

    // ❌ If no valid format matched
    if (!formattedPhone) {
      return ctx.reply(
        "❌ Telefon raqam formati noto'g'ri. Qayta kiriting.\nNamuna: +998901234567 yoki 901234567"
      );
    }

    // Check duplicate
    if (existingCustomers.some((c) => c.phone === formattedPhone)) {
      return ctx.reply(`❌ ${formattedPhone} raqami bazada mavjud!`);
    }

    session.contact = formattedPhone;

    await Customer.create({
      id: Date.now(),
      name: session.name,
      phone: session.contact,
      date: session.date,
      purchased_item: session.purchased_item,
      created_at: new Date().toISOString(),
    });

    ctx.reply(
      `✅ Rahmat, <b>${session.name}</b> okamzani ma'lumotlari saqlandi.\n\nTelefon: ${session.contact}\nSana: ${session.date}`,
      { parse_mode: "HTML" },
      Markup.keyboard([
        ["➕ Mijoz qo`shish"],
        ["📋 Mijozlar ro`yxati", "🗑 Mijozlarni o'chirish"],
        ["📊 Statistika"],
        ["📥 Mijozlarni Excelga yuklash"],
      ]).resize()
    );
  } else if (session.step === "delete_customer") {
    const input = ctx.message.text.trim();
    const digits = input.replace(/\D/g, "");

    // Normalize phone format to +998XXXXXXXXX
    let formattedPhone = null;
    if (/^\d{9}$/.test(digits)) {
      formattedPhone = "+998" + digits;
    } else if (/^998\d{9}$/.test(digits)) {
      formattedPhone = "+" + digits;
    } else if (/^\+998\d{9}$/.test(input)) {
      formattedPhone = input;
    }

    if (!formattedPhone) {
      return ctx.reply(
        "❌ Telefon raqam formati noto'g'ri.\n Namuna: +998901234567 yoki 901234567"
      );
    }

    // Try to find and delete the customer
    const deleted = await Customer.destroy({
      where: { phone: formattedPhone },
    });

    if (deleted) {
      ctx.reply(`✅ ${formattedPhone} raqamli mijoz o'chirildi.`);
    } else {
      ctx.reply(`❌ ${formattedPhone} raqamli mijoz topilmadi.`);
    }
    delete sessions[id];
  }
});

// bot.on("text", async (ctx) => {
//   const id = ctx.chat.id;
//   const session = sessions[id];

//   // If not in delete mode, skip
//   if (!session || session.step !== "delete_customer") return;

//   const input = ctx.message.text.trim();
//   const digits = input.replace(/\D/g, "");

//   // Normalize phone format to +998XXXXXXXXX
//   let formattedPhone = null;
//   if (/^\d{9}$/.test(digits)) {
//     formattedPhone = "+998" + digits;
//   } else if (/^998\d{9}$/.test(digits)) {
//     formattedPhone = "+" + digits;
//   } else if (/^\+998\d{9}$/.test(input)) {
//     formattedPhone = input;
//   }

//   if (!formattedPhone) {
//     return ctx.reply(
//       "❌ Telefon raqam formati noto'g'ri.\n Namuna: +998901234567 yoki 901234567"
//     );
//   }

//   // Try to find and delete the customer
//   const deleted = await Customer.destroy({
//     where: { phone: formattedPhone },
//   });

//   if (deleted) {
//     ctx.reply(`✅ ${formattedPhone} raqamli mijoz o'chirildi.`);
//   } else {
//     ctx.reply(`❌ ${formattedPhone} raqamli mijoz topilmadi.`);
//   }

//   // End delete session
//   delete sessions[id];
// });

bot.launch();
