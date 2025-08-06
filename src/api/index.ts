import axios from 'axios';
import { API_URL } from '~/const.js';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});
