import { daysInMonth } from './date';
import type { Category, Transaction, TransactionType } from '../types';

export function summarize(transactions: Transaction[]) {
  return transactions.reduce(
    (result, item) => {
      result[item.type] += item.amountMinor;
      return result;
    },
    { income: 0, expense: 0 },
  );
}

export function monthTransactions(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((item) => item.date.startsWith(`${month}-`));
}

export function dailyExpenses(transactions: Transaction[], month: string): number[] {
  const daily = Array.from({ length: daysInMonth(month) }, () => 0);
  monthTransactions(transactions, month).forEach((item) => {
    if (item.type === 'expense') daily[Number(item.date.slice(8)) - 1] += item.amountMinor;
  });
  return daily;
}

export interface CategorySummary {
  category: Category;
  amount: number;
  percentage: number;
  count: number;
}

export function categorySummaries(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType = 'expense',
): CategorySummary[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const values = new Map<string, { amount: number; count: number }>();
  transactions.filter((item) => item.type === type).forEach((item) => {
    const current = values.get(item.categoryId) ?? { amount: 0, count: 0 };
    values.set(item.categoryId, { amount: current.amount + item.amountMinor, count: current.count + 1 });
  });
  const total = [...values.values()].reduce((sum, item) => sum + item.amount, 0);
  return [...values.entries()]
    .map(([id, value]) => ({
      category: categoryMap.get(id) ?? {
        id, name: '未分类', type, icon: 'ellipsis', color: '#929993', isDefault: false, archived: true, createdAt: '',
      },
      ...value,
      percentage: total === 0 ? 0 : Math.round((value.amount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);
}
