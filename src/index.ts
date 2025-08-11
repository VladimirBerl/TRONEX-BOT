import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from './const.js';

import { setupAdminCommands } from './commands/admin/index.js';
import { setupReferralCommands } from './commands/user/referral.js';

if (!BOT_TOKEN) throw new Error('BOT_TOKEN is missing in environment');
const bot = new Telegraf(BOT_TOKEN);

setupReferralCommands(bot);
setupAdminCommands(bot);

bot
  .launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch((err) => console.log('❌ Не удалось запустить бота', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
