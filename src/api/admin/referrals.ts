import { Referral } from '~/types/referrals.js';
import { api } from '../index.js';

type ResponseAddReferral = {
  referral: Referral;
  created: boolean;
};

export const apiReferral = {
  addReferral: async (inviter_id_tg: string, invited_id_tg: string) => {
    try {
      const res = await api.post<ResponseAddReferral>(`/admin/users/${inviter_id_tg}/referrals`, {
        invited_id_tg,
        invited_username: 'asdasd',
      });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
