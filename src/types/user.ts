export type User = {
  id_tg: string;
  username: string;
  investment_balance: string;
  status: string;
  farm_balance: string;
  farm_balance_reset_at: Date;
  level: number;
  clicks_today: number;
  clicks_today_reset_at: Date;
  bonus_locked: boolean;
  createdAt: Date;
};