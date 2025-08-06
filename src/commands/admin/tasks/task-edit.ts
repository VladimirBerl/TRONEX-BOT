import { Context, Telegraf } from 'telegraf';
import { TaskDraft } from './type.js';
import { isAdmin } from '~/middleware/is_admin.js';
import { apiTask } from '~/api/admin/tasks.js';
import { Message } from '@telegraf/types';

type EditTask = TaskDraft & { id: number | string };

const taskEditStates = new Map<number, EditTask>();

export const setupTaskEditCommands = (bot: Telegraf) => {
  bot.action(/^admin_task_edit:(.+)$/, isAdmin, async (ctx) => {
    try {
      const id = ctx.match[1];
      const task = await apiTask.getTaskById(id);
      if (!task) return await ctx.answerCbQuery('❌ Задание не найдено.');

      taskEditStates.set(ctx.from.id, { step: 'title', ...task });

      await ctx.answerCbQuery();
      await ctx.reply('✏️ Введите новый заголовок или отправьте "нет", чтобы оставить текущий:');
    } catch (error) {
      console.error(error);
      await ctx.answerCbQuery('❌ Ошибка при получении задания.');
    }
  });

  bot.on('message', async (ctx, next) => {
    const userId = ctx.from.id;
    const state = taskEditStates.get(userId);

    if (!state) return next();

    const handlers: Record<string, (ctx: Context) => Promise<Message.TextMessage | undefined | void>> = {
      title: async () => {
        if (!('text' in ctx.message)) return;
        if (ctx.message.text?.toLowerCase() !== 'нет') state.title = ctx.message.text;

        state.step = 'reward';
        return ctx.reply('💰 Новый бонус (или "нет"):');
      },
      reward: async () => {
        if (!('text' in ctx.message)) return;
        if (ctx.message.text?.toLowerCase() !== 'нет') state.reward = ctx.message.text;
        state.step = 'url';
        return ctx.reply('🔗 Новая ссылка (или "нет"):');
      },
      url: async () => {
        if (!('text' in ctx.message)) return;
        if (ctx.message.text?.toLowerCase() !== 'нет') state.url = ctx.message.text;
        state.step = 'image';
        return ctx.reply('🖼 Пришлите новое изображение (или напишите "нет"):');
      },
      image: async () => {
        if ('text' in ctx.message && ctx.message.text?.toLowerCase() === 'нет') {
          await ctx.replyWithPhoto(state.imageFileId, {
            caption: `✅ Проверьте задание:\n\n📌 Название: ${state.title}\n💰 Награда: ${state.reward}\n🔗 Ссылка: ${state.url}`,
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Создать', callback_data: 'task_edit_confirm' }],
                [{ text: '❌ Отменить', callback_data: 'task_edit_cancel' }],
              ],
            },
          });
        }
        if ('photo' in ctx.message && Array.isArray(ctx.message.photo)) {
          const photo = ctx.message.photo.at(-1);
          if (!photo) return ctx.reply('❌ Не удалось получить изображение.');

          state.imageFileId = photo.file_id;
          state.imageUrl = (await ctx.telegram.getFileLink(photo.file_id)).href;

          taskEditStates.set(userId, state);

          await ctx.replyWithPhoto(state.imageFileId, {
            caption: `✅ Проверьте задание:\n\n📌 Название: ${state.title}\n💰 Награда: ${state.reward}\n🔗 Ссылка: ${state.url}`,
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Создать', callback_data: 'task_edit_confirm' }],
                [{ text: '❌ Отменить', callback_data: 'task_edit_cancel' }],
              ],
            },
          });
        }
      },
    };

    if (state.step in handlers) {
      await handlers[state.step](ctx);
    } else {
      await ctx.reply(`⛔ Заполните поле: ${state.step}`);
    }
  });

  bot.action(/^admin_task_delete:(.+)$/, isAdmin, async (ctx) => {
    const id = ctx.match[1];
    try {
      await apiTask.deleteTask(id);
      await ctx.deleteMessage();
      await ctx.reply('🗑 Задание удалено.');
      await ctx.answerCbQuery();
    } catch (err) {
      console.error(err);
      await ctx.answerCbQuery('❌ Ошибка при удалении.');
    }
  });

  bot.action('task_edit_confirm', isAdmin, async (ctx) => {
    const userId = ctx.from.id;
    const state = taskEditStates.get(userId);

    const missingFields = [];
    if (!state?.title) missingFields.push('название');
    if (!state?.reward) missingFields.push('награда');
    if (!state?.url) missingFields.push('ссылка');
    if (!state?.imageFileId) missingFields.push('изображение');
    if (!state?.imageUrl) missingFields.push('ссылка на изображение');

    if (missingFields.length > 0) {
      await ctx.answerCbQuery(`⛔ Не заполнены поля: ${missingFields.join(', ')}`);
      return;
    }

    try {
      if (!state) return;

      await apiTask.updateTask(String(state.id), {
        title: state.title,
        reward: state.reward,
        url: state.url,
        imageFileId: state.imageFileId,
        imageUrl: state.imageUrl,
      });
      taskEditStates.delete(userId);

      await ctx.deleteMessage();
      await ctx.reply('✅ Задание успешно обновлено.');
      await ctx.answerCbQuery();
    } catch (err) {
      taskEditStates.delete(userId);
      console.error('⛔ Ошибка обновления задания:', err);
      await ctx.answerCbQuery('⛔ Ошибка обновления задания: ');
    }
  });

  bot.action('task_edit_cancel', async (ctx) => {
    taskEditStates.delete(ctx.from.id);
    await ctx.deleteMessage();
    await ctx.reply('🚫 Обновления задания отменено.');
    await ctx.answerCbQuery();
  });
};
