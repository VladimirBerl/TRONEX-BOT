import { Telegraf } from "telegraf";
import { apiReferral } from "~/api/admin/referrals.js";
import { apiAuth } from "~/api/users/auth.js";
import { MINI_APP_LINK } from "~/const.js";

export const setupReferralCommands = (bot: Telegraf) => {
  bot.start(async (ctx) => {
    const payload = ctx.payload;
    const id = ctx.from.id;
    const username = ctx.from.username ?? ctx.from.last_name ?? ctx.from.first_name;

    try {
      await apiAuth.auth(String(id), username);
    } catch (error) {
      console.error(error);
      return ctx.reply('An error occurred during authorization, please try again.', {
        reply_markup: {
          inline_keyboard: [[{ text: '🚀 Start App', url: MINI_APP_LINK }]],
        },
      });
    }

    if (!payload || !payload.startsWith('invited_by_')) {
      return ctx.reply('Welcome to TONEX BOT 💸', {
        reply_markup: {
          inline_keyboard: [[{ text: '🚀 Start App', url: MINI_APP_LINK }]],
        },
      });
    }

    const inviter_id_tg = payload.replace('invited_by_', '');

    try {
      const res = await apiReferral.addReferral(inviter_id_tg, String(id));

      if (res?.created) {
        await ctx.reply('Welcome to TONEX BOT 💸. You have been successfully registered as a referral!', {
          reply_markup: {
            inline_keyboard: [[{ text: '🚀 Start App', url: MINI_APP_LINK }]],
          },
        });
      } else {
        await ctx.reply('Welcome to TONEX BOT 💸. You have already been invited before.', {
          reply_markup: {
            inline_keyboard: [[{ text: '🚀 Start App', url: MINI_APP_LINK }]],
          },
        });
      }
    } catch (err) {
      console.error('Ошибка при создании реферала:', err);
      await ctx.reply(
        'The inviting user does not exist! The referral system failed, please try again.',
        {
          reply_markup: {
            inline_keyboard: [[{ text: '🚀 Start App', url: MINI_APP_LINK }]],
          },
        }
      );
    }
  });
};
