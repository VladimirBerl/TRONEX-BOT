import { api } from "../index.js";

export const apiAuth = {
  auth: async (id_tg: string, username: string) => {
    try {
      const res = await api.post('/auth', { id_tg, username });
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};