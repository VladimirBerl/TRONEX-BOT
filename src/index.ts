import { Telegraf, session } from 'telegraf';
import { BOT_TOKEN } from './const.js';

import { setupAdminCommands } from './commands/admin/index.js';

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is missing in environment');
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => ctx.reply('Добро пожаловать в TRONEX!'));

setupAdminCommands(bot);

bot
  .launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch((err) => console.log('❌ Не удалось запустить бота', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
