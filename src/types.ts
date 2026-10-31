export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  categoryId: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  archived: boolean;
  createdAt: string;
}

export interface Settings {
  ledgerName: string;
  currency: string;
  lastExpenseCategory: string;
}

export interface BackupData {
  schemaVersion: 1;
  exportedAt: string;
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
}

export interface TransactionDraft {
  type: TransactionType;
  amountMinor: number;
  categoryId: string;
  date: string;
  note: string;
}

export const DEFAULT_SETTINGS: Settings = {
  ledgerName: '我的账本',
  currency: 'CNY',
  lastExpenseCategory: 'expense-canteen',
};

export const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥', fraction: 2 },
  { code: 'JPY', name: '日元', symbol: '¥', fraction: 0 },
  { code: 'USD', name: '美元', symbol: '$', fraction: 2 },
  { code: 'EUR', name: '欧元', symbol: '€', fraction: 2 },
  { code: 'GBP', name: '英镑', symbol: '£', fraction: 2 },
  { code: 'HKD', name: '港币', symbol: 'HK$', fraction: 2 },
] as const;
