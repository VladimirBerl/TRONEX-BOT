import { Telegraf } from 'telegraf';
import { apiStatistics } from '~/api/admin/statistic.js';
import { isAdmin } from '~/middleware/is_admin.js';

export const setupStatisticsCommands = (bot: Telegraf) => {
  bot.action('admin_stats', isAdmin, async (ctx) => {
    const statistic = await apiStatistics.get();
    if (!statistic) return await ctx.answerCbQuery('❌ Ошибка получения данных');

    const text = `
📊 Статистика:
👤 Все пользователи: ${statistic.totalUser}
📤 Все выводы: ${statistic.totalWithdrawal}
📤 Все пополнения: ${statistic.totalDeposit}

  `;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin_menu' }]],
      },
    });
  });
};
