import { beforeEach, describe, expect, it } from 'vitest';
import { createBackup } from './db';
import { validateBackup } from './backup';

let valid: unknown;
beforeEach(async () => { valid = await createBackup(); });

describe('备份结构校验', () => {
  it('接受当前版本的完整备份', () => {
    expect(validateBackup(valid)).toMatchObject({ schemaVersion: 1, transactions: [] });
  });
  it('拒绝无效版本、结构和金额', () => {
    expect(() => validateBackup(null)).toThrow();
    expect(() => validateBackup({ ...valid as object, schemaVersion: 2 })).toThrow('版本');
    const data = structuredClone(valid) as ReturnType<typeof validateBackup>;
    data.transactions = [{ id: 'x', type: 'expense', amountMinor: 0.1, categoryId: 'expense-food', date: '2026-01-01', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    expect(() => validateBackup(data)).toThrow('金额');
  });
  it('拒绝重复 ID 与悬空分类关联', () => {
    const data = structuredClone(valid) as ReturnType<typeof validateBackup>;
    data.categories.push(data.categories[0]);
    expect(() => validateBackup(data)).toThrow('重复');
    data.categories.pop();
    data.transactions = [{ id: 'x', type: 'expense', amountMinor: 100, categoryId: 'missing', date: '2026-01-01', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    expect(() => validateBackup(data)).toThrow('关联');
  });
});
