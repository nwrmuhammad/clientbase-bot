function accessMiddleware(ctx, next) {
  if (
    (ctx.chat && ctx.chat.id == process.env.ADMIN_nvr) ||
    process.env.ADMIN_shrz
  ) {
    return next();
  } else {
    ctx.reply(
      console.log(ctx.chat.id),
      "❌ Siz botdan foydalanish huquqiga ega emassiz.",
      {
        reply_markup: { remove_keyboard: true },
      }
    );
    return;
  }
}

module.exports = accessMiddleware;
