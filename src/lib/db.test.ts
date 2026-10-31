import { beforeEach, describe, expect, it } from 'vitest';
import { addTransaction, createBackup, deleteTransaction, getCategories, getSettings, getTransactions, removeCategory, resetDBForTests, restoreBackup, saveCategory, updateTransaction } from './db';
import type { Category, TransactionDraft } from '../types';

const draft: TransactionDraft = { type: 'expense', amountMinor: 1234, categoryId: 'expense-canteen', date: '2026-01-02', note: '午餐' };

beforeEach(async () => { await resetDBForTests(); });

describe('IndexedDB 账本', () => {
  it('初始化空数据库与默认分类', async () => {
    expect(await getTransactions()).toEqual([]);
    expect(await getCategories()).toHaveLength(21);
    expect((await getSettings()).currency).toBe('CNY');
  });
  it('新增收入和支出并持久化读取', async () => {
    await addTransaction(draft);
    await addTransaction({ ...draft, type: 'income', categoryId: 'income-scholarship', amountMinor: 500000 });
    expect(await getTransactions()).toHaveLength(2);
    expect((await getSettings()).lastExpenseCategory).toBe('expense-canteen');
  });
  it('编辑与删除真实账单', async () => {
    const item = await addTransaction(draft);
    await updateTransaction(item.id, { ...draft, amountMinor: 5678, note: '修改' });
    expect((await getTransactions())[0]).toMatchObject({ amountMinor: 5678, note: '修改' });
    await deleteTransaction(item.id);
    expect(await getTransactions()).toEqual([]);
  });
  it('有关联账单的自定义分类只能归档', async () => {
    const category: Category = { id: 'custom', name: '宠物', type: 'expense', icon: 'gift', color: '#557967', isDefault: false, archived: false, createdAt: new Date().toISOString() };
    await saveCategory(category);
    await addTransaction({ ...draft, categoryId: 'custom' });
    expect(await removeCategory('custom')).toBe('archived');
    expect(await getTransactions()).toHaveLength(1);
  });
  it('导出与覆盖恢复完整数据', async () => {
    await addTransaction(draft);
    const backup = await createBackup();
    await addTransaction({ ...draft, note: '待覆盖' });
    await restoreBackup(backup);
    expect(await getTransactions()).toHaveLength(1);
    expect((await getTransactions())[0].note).toBe('午餐');
  });
  it('恢复事务失败时保留原有全部数据', async () => {
    await addTransaction(draft);
    const old = await createBackup();
    const broken = structuredClone(old);
    broken.transactions.push({} as never);
    await expect(restoreBackup(broken)).rejects.toThrow();
    expect(await getTransactions()).toEqual(old.transactions);
    expect(await getCategories()).toEqual(old.categories);
    expect(await getSettings()).toEqual(old.settings);
  });
});
