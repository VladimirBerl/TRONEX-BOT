import { Context, Telegraf } from 'telegraf';
import { isAdmin } from '~/middleware/is_admin.js';
import { setupUsersCommands } from './users.js';
import { setupWithdrawalCommands } from './transaction.js';
import { setupTasksCommands } from './tasks/index.js';
import { setupStatisticsCommands } from './statistics.js';

const renderAdminMenu = async (ctx: Context) => {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
        [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
        [{ text: '💰 Транзакции', callback_data: 'admin_transaction' }],
        [{ text: '📝 Задачи', callback_data: 'admin_tasks' }],
      ],
    },
  };

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
    await ctx.editMessageText('👑 Админ-панель', keyboard);
  } else {
    await ctx.reply('👑 Админ-панель', keyboard);
  }
};

export const setupAdminCommands = (bot: Telegraf) => {
  bot.command('admin', isAdmin, renderAdminMenu);
  bot.action('admin_menu', renderAdminMenu);

  setupStatisticsCommands(bot);
  setupUsersCommands(bot);
  setupWithdrawalCommands(bot);
  setupTasksCommands(bot);
};
