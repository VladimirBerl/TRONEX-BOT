import { api } from '../index.js';

type ResponseGet = {
  totalUser: number;
  totalWithdrawal: number;
  totalDeposit: number;
};

export const apiStatistics = {
  get: async () => {
    try {
      const res = await api.get<ResponseGet>(`/admin/statistic`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
