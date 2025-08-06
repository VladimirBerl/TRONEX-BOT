import { Context, Telegraf } from 'telegraf';
import { apiUser } from '~/api/admin/user.js';
import { isAdmin } from '~/middleware/is_admin.js';

const renderUsersList = async (ctx: Context, page: number) => {
  await ctx.answerCbQuery();
  const data = await apiUser.getAll(page);
  if (!data) return await ctx.answerCbQuery('❌ Ошибка загрузки');

  const inline_keyboard = data.users.map((u) => [
    {
      text: `🆔ID: ${u.id_tg} 👤Username: ${u.username}`,
      callback_data: `admin_user_detail:${u.id_tg}`,
    },
  ]);

  const navRow: any[] = [];
  if (page > 1) navRow.push({ text: '⬅️ Назад', callback_data: `admin_users_page:${page - 1}` });
  if (page * 10 < data.total)
    navRow.push({ text: '➡️ Вперёд', callback_data: `admin_users_page:${page + 1}` });

  inline_keyboard.push(navRow);
  inline_keyboard.push([{ text: '🔙 Меню', callback_data: 'admin_menu' }]);

  await ctx.editMessageText(`👥 Пользователи (стр. ${page}):`, {
    reply_markup: { inline_keyboard },
  });
};

const renderUserStatistics = async (ctx: Context, userId: string) => {
  if (!userId) return ctx.answerCbQuery('❌ ID не найден');

  const user = await apiUser.getById(userId);

  if (!user) {
    return ctx.answerCbQuery('❌ Пользователь не найден');
  }

  const text = `
👤 Username: <b>${user.username}</b>
🆔 ID: <code>${user.id_tg}</code>
📊 Уровень: ${user.level}
💼 Инвест. баланс: ${user.investment_balance}
🌾 Ферма: ${user.farm_balance}
🔄 Клики: ${user.clicks_today}
📅 Создан: ${new Date(user.createdAt).toLocaleString()}
📘 Статус: ${user.status}
`.trim();

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: user.status === 'banned' ? '🔓 Разблокировать' : '🚫 Забанить',
            callback_data: `admin_user_toggle_ban:${user.id_tg}`,
          },
        ],
        [{ text: '🔙 Назад к списку', callback_data: 'admin_users_page:1' }],
      ],
    },
  });
};

export const setupUsersCommands = (bot: Telegraf) => {
  bot.action('admin_users', isAdmin, async (ctx) => await renderUsersList(ctx, 1));

  bot.action(/admin_users_page:(\d+)/, isAdmin, async (ctx) => {
    const page = Number(ctx.match[1]);
    await renderUsersList(ctx, page);
  });

  bot.action(/^admin_user_detail:(.+)$/, isAdmin, async (ctx) => {
    const userId = ctx.match?.[1];
    renderUserStatistics(ctx, userId);
  });

  bot.action(/^admin_user_toggle_ban:(.+)$/, isAdmin, async (ctx) => {
    const id_tg = ctx.match?.[1];
    const user = await apiUser.getById(id_tg);
    if (!user) return ctx.answerCbQuery('❌ Пользователь не найден');
    const ban = user.status !== 'banned';
    await apiUser.toggleBan(id_tg, ban);

    await ctx.answerCbQuery(ban ? '🚫 Пользователь забанен' : '🔓 Пользователь разблокирован');
    await renderUserStatistics(ctx, id_tg);
  });
};
