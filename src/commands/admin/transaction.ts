import { Telegraf } from 'telegraf';
import { apiTransaction } from '~/api/admin/transaction.js';
import { isAdmin } from '~/middleware/is_admin.js';
import { setupDepositCommands } from './deposits.js';

const translateStatusWithdrawal = (status: string) => {
  const variant: Record<string, string> = {
    pending: '⌛В обработке',
    paid: '✅Выполнен',
    rejected: '❌Отклонён',
  };

  return variant[status] ?? 'Неизвестно';
};

const renderWithdrawalList = async (ctx: any, page: number) => {
  await ctx.answerCbQuery();

  const allWithdraws = await apiTransaction.getWithdrawsAll(page);
  if (!allWithdraws) return await ctx.answerCbQuery('❌ Ошибка загрузки');

  const inline_keyboard = allWithdraws.withdraws.map((w) => [
    {
      text: `🆔ID: ${w.id} Сумма: ${parseFloat(w.amount).toFixed(6)} ✉️Статус: ${translateStatusWithdrawal(
        w.status
      )}`,
      callback_data: `admin_withdrawal_detail:${w.id}`,
    },
  ]);

  const navRow: any[] = [];
  if (page > 1) navRow.push({ text: '⬅️ Назад', callback_data: `admin_withdrawal_page:${page - 1}` });
  if (page * 10 < allWithdraws.total)
    navRow.push({ text: '➡️ Вперёд', callback_data: `admin_withdrawal_page:${page + 1}` });

  inline_keyboard.push(navRow);
  inline_keyboard.push([{ text: '🔙 Меню', callback_data: 'admin_transaction' }]);

  await ctx.editMessageText(`📤 Выводы (стр. ${page}):`, {
    reply_markup: { inline_keyboard },
  });
};

const renderWithdrawalInfo = async (ctx: any, id: number | string) => {
  if (!id) return ctx.answerCbQuery('❌ ID не найден');

  const withdrawal = await apiTransaction.getWithdrawById(String(id));
  if (!withdrawal) return await ctx.answerCbQuery('❌ Транзакция не найдена');

  const text = `
🆔 ID : ${withdrawal.user_id_tg}
👤 Пользователь: ${withdrawal.username}

🆔 ID заявки: ${withdrawal.id}
💰 Сумма: <code>${withdrawal.amount}</code>
🔗 Сеть: <code>${withdrawal.network}</code>
💼 Адрес: <code>${withdrawal.wallet_address}</code>
✉️ Статус: ${translateStatusWithdrawal(withdrawal.status)}
📅 Создан: ${new Date(withdrawal.createdAt).toLocaleString()}
  `;

  const inline_keyboard =
    withdrawal.status === 'paid' || withdrawal.status === 'rejected'
      ? [[{ text: '🔙 Назад к списку', callback_data: 'admin_withdrawal_page:1' }]]
      : [
          [
            { text: '✅ Подтвердить', callback_data: `withdraw_approve:${withdrawal.id}` },
            { text: '❌ Отклонить', callback_data: `withdraw_reject:${withdrawal.id}` },
          ],
          [{ text: '🔙 Назад к списку', callback_data: 'admin_withdrawal_page:1' }],
        ];

  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard,
    },
  });
};

export const setupWithdrawalCommands = (bot: Telegraf) => {
  bot.action('admin_transaction', isAdmin, async (ctx) => {
    await ctx.answerCbQuery();

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Выводы', callback_data: 'admin_withdrawal' }],
          [{ text: '📥 Пополнения', callback_data: 'admin_deposit' }],
          [{ text: '🔙 Назад', callback_data: 'admin_menu' }],
        ],
      },
    };

    await ctx.editMessageText('💰 Транзакции', keyboard);
  });

  bot.action('admin_withdrawal', isAdmin, async (ctx) => await renderWithdrawalList(ctx, 1));

  bot.action(/admin_withdrawal_page:(\d+)/, isAdmin, async (ctx) => {
    const page = Number(ctx.match[1]);
    await renderWithdrawalList(ctx, page);
  });

  bot.action(/^admin_withdrawal_detail:(.+)$/, isAdmin, async (ctx) => {
    const id = ctx.match?.[1];
    await renderWithdrawalInfo(ctx, id);
  });

  bot.action(/^withdraw_approve:(\d+)/, isAdmin, async (ctx) => {
    const id = ctx.match[1];
    await apiTransaction.updateWithdrawStatus(id, 'paid');
    await ctx.answerCbQuery('✅ Выплата подтверждена');
    await renderWithdrawalInfo(ctx, id);
  });

  bot.action(/^withdraw_reject:(\d+)/, isAdmin, async (ctx) => {
    const id = ctx.match[1];
    await apiTransaction.updateWithdrawStatus(id, 'rejected');
    await ctx.answerCbQuery('❌ Выплата отменена');
    await renderWithdrawalInfo(ctx, id);
  });

  setupDepositCommands(bot);
};
