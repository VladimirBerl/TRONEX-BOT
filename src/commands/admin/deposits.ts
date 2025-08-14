import { Telegraf } from 'telegraf';
import { apiTransaction } from '~/api/admin/transaction.js';
import { isAdmin } from '~/middleware/is_admin.js';

const renderDepositsList = async (ctx: any, page: number) => {
  await ctx.answerCbQuery();

  const allDeposits = await apiTransaction.getDepositsAll(page);
  if (!allDeposits) return await ctx.answerCbQuery('❌ Ошибка загрузки');

  const inline_keyboard = allDeposits.deposits.map((w) => [
    {
      text: `🆔ID: ${w.id} Сумма: ${parseFloat(w.amount).toFixed(6)}}`,
      callback_data: `admin_deposit_detail:${w.id}`,
    },
  ]);

  const navRow: any[] = [];
  if (page > 1) navRow.push({ text: '⬅️ Назад', callback_data: `admin_deposits_page:${page - 1}` });
  if (page * 10 < allDeposits.total)
    navRow.push({ text: '➡️ Вперёд', callback_data: `admin_deposits_page:${page + 1}` });

  inline_keyboard.push(navRow);
  inline_keyboard.push([{ text: '🔙 Меню', callback_data: 'admin_transaction' }]);

  await ctx.editMessageText(`📤 Выводы (стр. ${page}):`, {
    reply_markup: { inline_keyboard },
  });
};

const renderDepositInfo = async (ctx: any, id: number | string) => {
  if (!id) return ctx.answerCbQuery('❌ ID не найден');

  const deposit = await apiTransaction.getDepositById(String(id));
  if (!deposit) return await ctx.answerCbQuery('❌ Транзакция не найдена');

  const text = `
🆔 ID : ${deposit.user_id_tg}
👤 Пользователь: ${deposit.username}

🆔 ID заявки: ${deposit.id}
💰 Сумма: <code>${deposit.amount}</code>
🔗 Сеть: <code>${deposit.network}</code>
💼 Адрес: <code>${deposit.wallet_address}</code>
📅 Создан: ${new Date(deposit.createdAt).toLocaleString()}
  `;

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: '🔙 Назад к списку', callback_data: 'admin_deposits_page:1' }]],
    },
  });
};

export const setupDepositCommands = (bot: Telegraf) => {
  bot.action('admin_deposit', isAdmin, async (ctx) => await renderDepositsList(ctx, 1));

  bot.action(/admin_deposits_page:(\d+)/, isAdmin, async (ctx) => {
    const page = Number(ctx.match[1]);
    await renderDepositsList(ctx, page);
  });

  bot.action(/^admin_deposit_detail:(.+)$/, isAdmin, async (ctx) => {
    const id = ctx.match?.[1];
    await renderDepositInfo(ctx, id);
  });
};
