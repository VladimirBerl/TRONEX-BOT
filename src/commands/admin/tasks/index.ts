import { Context, Telegraf } from 'telegraf';
import { apiTask } from '~/api/admin/tasks.js';
import { isAdmin } from '~/middleware/is_admin.js';
import { setupTaskCreateCommands } from './task-create.js';
import { setupTaskEditCommands } from './task-edit.js';

const renderTasksList = async (ctx: Context, page: number) => {
  await ctx.answerCbQuery();

  const allTasks = await apiTask.getTasksAll(page);
  if (!allTasks) return await ctx.answerCbQuery('❌ Ошибка загрузки');

  const inline_keyboard =
    allTasks.tasks.length === 0
      ? []
      : allTasks.tasks.map((t) => [
          {
            text: `🆔ID: ${t.id} 🔝Заголовок: ${t.title} 🎁Бонус: ${parseFloat(t.reward).toFixed(6)}`,
            callback_data: `admin_task_detail:${t.id}`,
          },
        ]);

  const navRow: any[] = [];
  if (page > 1) navRow.push({ text: '⬅️ Назад', callback_data: `admin_all_tasks_page:${page - 1}` });
  if (page * 10 < allTasks.total)
    navRow.push({ text: '➡️ Вперёд', callback_data: `admin_all_tasks_page:${page + 1}` });

  inline_keyboard.push(navRow);
  inline_keyboard.push([{ text: '🔙 Меню', callback_data: 'admin_tasks' }]);

  if (ctx.callbackQuery && 'text' in ctx.callbackQuery.message!) {
    await ctx.editMessageText('📤 Задачи (стр. 1):', {
      reply_markup: { inline_keyboard },
    });
  } else {
    await ctx.reply('📤 Задачи (стр. 1):', {
      reply_markup: { inline_keyboard },
    });
  }
};

const renderTaskInfo = async (ctx: Context, id: string) => {
  if (!id) return ctx.answerCbQuery('❌ ID не найден');

  const task = await apiTask.getTaskById(id);
  if (!task) return await ctx.answerCbQuery('❌ Задача не найдена');

  const text = `
🆔 ID : <code>${task.id}</code>
🔝 Заголовок: ${task.title}  
🎁 Сумма: <code>${task.reward}</code>
📅 Создан: ${new Date(task.createdAt).toLocaleString()}
📅 Обновлен: ${new Date(task.updatedAt).toLocaleString()}
    `;

  const inline_keyboard = [
    [
      { text: '✏️ Изменить', callback_data: `admin_task_edit:${task.id}` },
      { text: '❌ Удалить', callback_data: `admin_task_delete:${task.id}` },
    ],
    [{ text: '🔙 Назад к списку', callback_data: 'admin_all_tasks_page:1' }],
  ];

  await ctx.replyWithPhoto(task.imageFileId, {
    parse_mode: 'HTML',
    caption: text,
    reply_markup: {
      inline_keyboard,
    },
  });
};

export const setupTasksCommands = (bot: Telegraf) => {
  bot.action('admin_tasks', isAdmin, async (ctx) => {
    await ctx.answerCbQuery();

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📝 Создать', callback_data: 'admin_task_create' }],
          [{ text: '💼 Все задачи', callback_data: 'admin_all_tasks' }],
          [{ text: '🔙 Назад', callback_data: 'admin_menu' }],
        ],
      },
    };

    await ctx.editMessageText('📝 Задачи', keyboard);
  });

  bot.action('admin_all_tasks', isAdmin, async (ctx) => await renderTasksList(ctx, 1));

  bot.action(/admin_all_tasks_page:(\d+)/, isAdmin, async (ctx) => {
    const page = Number(ctx.match[1]);
    await renderTasksList(ctx, page);
  });

  bot.action(/^admin_task_detail:(.+)$/, isAdmin, async (ctx) => {
    const id = ctx.match?.[1];
    await renderTaskInfo(ctx, id);
  });

  setupTaskCreateCommands(bot);
  setupTaskEditCommands(bot);
};
