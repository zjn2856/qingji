import { describe, expect, it } from 'vitest';
import { categorySummaries, dailyExpenses, monthTransactions, summarize } from './stats';
import type { Transaction } from '../types';

const base = { id: '1', categoryId: 'expense-food', date: '2026-01-01', note: '', createdAt: '', updatedAt: '' };
const transactions: Transaction[] = [
  { ...base, type: 'expense', amountMinor: 10 },
  { ...base, id: '2', type: 'expense', amountMinor: 20, date: '2026-01-31' },
  { ...base, id: '3', type: 'income', amountMinor: 1000, categoryId: 'income-salary' },
  { ...base, id: '4', type: 'expense', amountMinor: 99, date: '2025-12-31' },
];

describe('统计计算', () => {
  it('收支与结余使用整数累加', () => {
    expect(summarize(transactions)).toEqual({ income: 1000, expense: 129 });
    expect(summarize([])).toEqual({ income: 0, expense: 0 });
  });
  it('按月份和本地日期严格筛选', () => {
    expect(monthTransactions(transactions, '2026-01')).toHaveLength(3);
    expect(dailyExpenses(transactions, '2026-01')).toHaveLength(31);
    expect(dailyExpenses(transactions, '2026-01')[0]).toBe(10);
    expect(dailyExpenses(transactions, '2026-01')[30]).toBe(20);
  });
  it('空分类占比与排序正确', () => {
    expect(categorySummaries([], [])).toEqual([]);
    expect(categorySummaries(transactions, [], 'income')[0]).toMatchObject({ amount: 1000, percentage: 100, count: 1 });
  });
});
