
function accessMiddleware(ctx, next) {
    if (ctx.chat && ctx.chat.id == process.env.ADMIN_nvr) {
        return next(); 
    } else {
        console.log(ctx.chat.id);

         ctx.reply(
            '❌ Siz botdan foydalanish huquqiga ega emassiz.',
            {
                reply_markup: { remove_keyboard: true }
            }
        );
        return;
    }
}

module.exports = accessMiddleware;
