export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  created_by: number;
  created_at: string;
  member_count?: number;
  members?: User[];
}

export interface Expense {
  id: number;
  group_id: number;
  paid_by_user_id: number;
  paid_by_name: string;
  amount: string;
  description: string;
  split_type: 'equal' | 'exact' | 'percentage' | 'share';
  created_at: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: number;
  expense_id: number;
  user_id: number;
  user_name: string;
  amount: string;
}

export interface Settlement {
  id: number;
  payer_id: number;
  payer_name: string;
  payee_id: number;
  payee_name: string;
  group_id: number;
  amount: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  expense_id: number;
  user_id: number;
  user_name: string;
  message: string;
  created_at: string;
}

export interface BalanceEntry {
  userId: number;
  userName: string;
  owes: { userId: number; userName: string; amount: number }[];
  owedBy: { userId: number; userName: string; amount: number }[];
}
