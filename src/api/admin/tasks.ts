import { Task } from '~/types/task.js';
import { api } from '../index.js';

type ResponseTasksGetAll = {
  total: number;
  page: number;
  tasks: Task[];
};

type RequestTaskCreate = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export const apiTask = {
  getTaskById: async (id: string) => {
    try {
      const res = await api.get<Task>(`/admin/tasks/${id}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  getTasksAll: async (page: number | string) => {
    try {
      const res = await api.get<ResponseTasksGetAll>(`/admin/tasks?page=${page}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  deleteTask: async (id: string) => {
    try {
      const res = await api.delete<Task>(`/admin/tasks/${id}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  createTask: async (data: RequestTaskCreate) => {
    try {
      const res = await api.post<Task>('/admin/tasks', data);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
  updateTask: async (id: string, data: RequestTaskCreate) => {
    try {
      const res = await api.patch<Task>(`/admin/tasks/${id}`, data);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  },
};
