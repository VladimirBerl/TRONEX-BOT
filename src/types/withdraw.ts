export type Withdraw = {
  id: number;
  user_id_tg: string;
  amount: string;
  network: string;
  wallet_address: string;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: Date;
};
