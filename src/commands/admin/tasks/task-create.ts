import { Context, Telegraf } from 'telegraf';
import { apiTask } from '~/api/admin/tasks.js';
import { isAdmin } from '~/middleware/is_admin.js';
import { TaskDraft } from './type.js';
import { Message } from 'telegraf/types';

const taskCreateStates = new Map<number, Partial<Omit<TaskDraft, 'step'>> & Pick<TaskDraft, 'step'>>();

export const setupTaskCreateCommands = (bot: Telegraf) => {
  bot.action('admin_task_create', isAdmin, async (ctx) => {
    taskCreateStates.set(ctx.from.id, { step: 'title' });
    await ctx.reply('📝 Введите название задания:');
  });

  bot.on('message', async (ctx, next) => {
    const userId = ctx.from.id;
    const state = taskCreateStates.get(userId);

    if (!state) return next();
    const { message } = ctx;

    const handlers: Record<string, (ctx: Context) => Promise<Message.TextMessage | undefined | void>> = {
      title: async () => {
        if (!('text' in message)) return;
        state.title = message.text;
        state.step = 'reward';
        await ctx.reply('💰 Введите награду за выполнение (например, 1.5):');
      },
      reward: async () => {
        if (!('text' in message)) return;
        state.reward = message.text;
        state.step = 'url';
        await ctx.reply('🔗 Введите ссылку на задание (начинается с https://):');
      },
      url: async () => {
        if (!('text' in message)) return;
        state.url = message.text;
        state.step = 'image';
        await ctx.reply('🖼 Пришлите изображение задания:');
      },
      image: async () => {
        if (!('photo' in message) || !Array.isArray(message.photo)) {
          await ctx.reply('❌ Пожалуйста, отправьте изображение.');
          return;
        }

        const photo = message.photo.at(-1);
        if (!photo) return ctx.reply('❌ Не удалось получить изображение.');

        state.imageFileId = photo.file_id;
        state.imageUrl = (await ctx.telegram.getFileLink(photo.file_id)).href;

        taskCreateStates.set(userId, state);

        await ctx.replyWithPhoto(photo.file_id, {
          caption: `✅ Проверьте задание:\n\n📌 Название: ${state.title}\n💰 Награда: ${state.reward}\n🔗 Ссылка: ${state.url}`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Создать', callback_data: 'task_create_confirm' }],
              [{ text: '❌ Отменить', callback_data: 'task_create_cancel' }],
            ],
          },
        });
      },
    };

    if (state.step in handlers) {
      await handlers[state.step](ctx);
    } else {
      await ctx.reply(`⛔ Заполните поле: ${state.step}`);
    }
  });

  bot.action('task_create_confirm', isAdmin, async (ctx) => {
    const userId = ctx.from.id;
    const state = taskCreateStates.get(userId);

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

      await apiTask.createTask({
        title: state.title!,
        reward: state.reward!,
        url: state.url!,
        imageFileId: state.imageFileId!,
        imageUrl: state.imageUrl!,
      });

      taskCreateStates.delete(userId);

      await ctx.deleteMessage();
      await ctx.reply('🎉 Задание создано!');
      await ctx.answerCbQuery();
    } catch (err) {
      taskCreateStates.delete(userId);
      console.error('Ошибка при создании задания:', err);
      await ctx.answerCbQuery('⛔ Ошибка создания задания: ');
    }
  });

  bot.action('task_create_cancel', async (ctx) => {
    taskCreateStates.delete(ctx.from.id);
    await ctx.deleteMessage();
    await ctx.reply('🚫 Создание задания отменено.');
    await ctx.answerCbQuery();
  });
};
