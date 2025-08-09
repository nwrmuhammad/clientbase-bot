const admins = ["8025873679", "1118457274", "7220439451"];

function accessMiddleware(ctx, next) {
  if (!admins.includes(String(ctx.chat.id))) {
    ctx.reply("❌ Siz botdan foydalanish huquqiga ega emassiz.", {
      reply_markup: { remove_keyboard: true },
    });
  } else {
    return next();
  }
}

module.exports = accessMiddleware;

//   if (
//     (ctx.chat && ctx.chat.id == process.env.ADMIN_nvr) ||
//     process.env.ADMIN_shrz
//   ) {
//     return next();
//   } else {
//     ctx.reply(
//       console.log(ctx.chat.id),
//       "❌ Siz botdan foydalanish huquqiga ega emassiz.",
//       {
//         reply_markup: { remove_keyboard: true },
//       }
//     );
//     return;
//   }

//   console.log(!admins.includes(++ctx.chat.id));
//   console.log(ctx.chat.id);
