import { User } from '~/types/user.js';
import { api } from '../index.js';

type ResponseGetAll = {
  total: number;
  page: number;
  users: User[];
};

export const apiUser = {
  getAll: async (page: number | string) => {
    try {
      const res = await api.get<ResponseGetAll>(`/admin/users?page=${page}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  getById: async (id_tg: string) => {
    try {
      const res = await api.get<User>(`/admin/users/${id_tg}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },

  toggleBan: async (id_tg: string, ban: boolean) => {
    try {
      const res = await api.patch<User>(`/admin/users/${id_tg}/status`, { ban });
      console.log(res.data);
      
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
