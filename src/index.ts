import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from './const.js';

import { setupAdminCommands } from './commands/admin/index.js';
import { apiReferral } from './api/admin/referrals.js';
import { apiAuth } from './api/users/auth.js';

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is missing in environment');
const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const payload = ctx.payload;
  const id = ctx.from.id;
  const username = ctx.from.username ?? ctx.from.last_name ?? ctx.from.first_name;

  try {
    await apiAuth.auth(String(id), username);
  } catch (error) {
    console.error(error);
    return ctx.reply('При авторизации произошла ошибка, попробуйте еще раз.');
  }

  if (!payload || !payload.startsWith('invited_by_')) {
    return ctx.reply('Добро пожаловать!');
  }

  const inviter_id_tg = payload.replace('invited_by_', '');

  try {
    const res = await apiReferral.addReferral(inviter_id_tg, String(id));

    if (res?.created) {
      await ctx.reply('Добро пожаловать! Вы были успешно зарегистрированы как реферал!');
    } else {
      await ctx.reply('Добро пожаловать! Вы уже были приглашены ранее.');
    }
  } catch (err) {
    console.error('Ошибка при создании реферала:', err);
    await ctx.reply(
      'Приглашающего пользователя не существует! Реферальная система не прошла, попробуйте еще раз.'
    );
  }
});

setupAdminCommands(bot);

bot
  .launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch((err) => console.log('❌ Не удалось запустить бота', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
