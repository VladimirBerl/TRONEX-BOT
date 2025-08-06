import { Withdraw } from '~/types/withdraw.js';
import { api } from '../index.js';

type ResponseWithdrawGetAll = {
  total: number;
  page: number;
  withdraws: Withdraw[];
};

type ResponseWithdrawById = Withdraw & {
  username: string;
};

export const apiTransaction = {
  getWithdrawsAll: async (page: number | string) => {
    try {
      const res = await api.get<ResponseWithdrawGetAll>(`/admin/withdraw?page=${page}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  getWithdrawById: async (id:  string) => {
    try {
      const res = await api.get<ResponseWithdrawById>(`/admin/withdraw/${id}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateWithdrawStatus: async (id:  string, status: string) => {
    try {
      const res = await api.patch<Withdraw>(`/admin/withdraw/${id}/update_status`, { status });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
