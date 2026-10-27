import { CURRENCIES } from '../types';
import { isValidDate } from './date';
import { MAX_AMOUNT_MINOR } from './money';
import type { BackupData, Category, Transaction } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 100 && !/[\u0000-\u001f]/.test(value);
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}

function parseCategory(value: unknown): Category {
  if (!isRecord(value)) throw new Error('分类数据格式无效');
  if (!validId(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 20) {
    throw new Error('分类 ID 或名称无效');
  }
  if (value.type !== 'income' && value.type !== 'expense') throw new Error('分类类型无效');
  if (typeof value.icon !== 'string' || !/^[a-z0-9-]{1,40}$/.test(value.icon)) throw new Error('分类图标无效');
  if (typeof value.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.color)) throw new Error('分类颜色无效');
  if (typeof value.isDefault !== 'boolean' || typeof value.archived !== 'boolean' || !validTime(value.createdAt)) {
    throw new Error('分类属性无效');
  }
  return value as unknown as Category;
}

function parseTransaction(value: unknown): Transaction {
  if (!isRecord(value)) throw new Error('账单数据格式无效');
  if (!validId(value.id) || !validId(value.categoryId)) throw new Error('账单 ID 无效');
  if (value.type !== 'income' && value.type !== 'expense') throw new Error('账单类型无效');
  if (!Number.isSafeInteger(value.amountMinor) || (value.amountMinor as number) <= 0 || (value.amountMinor as number) > MAX_AMOUNT_MINOR) {
    throw new Error('备份中包含无效金额');
  }
  if (!isValidDate(value.date)) throw new Error('备份中包含无效日期');
  if (typeof value.note !== 'string' || value.note.length > 200) throw new Error('账单备注无效');
  if (!validTime(value.createdAt) || !validTime(value.updatedAt)) throw new Error('账单时间无效');
  return value as unknown as Transaction;
}

export function validateBackup(input: unknown): BackupData {
  if (!isRecord(input) || input.schemaVersion !== 1) throw new Error('备份版本不受支持');
  if (!validTime(input.exportedAt) || !isRecord(input.settings)) throw new Error('备份信息不完整');
  const { ledgerName, currency, lastExpenseCategory } = input.settings;
  if (typeof ledgerName !== 'string' || !ledgerName.trim() || ledgerName.length > 30) throw new Error('账本名称无效');
  if (typeof currency !== 'string' || !CURRENCIES.some((item) => item.code === currency)) throw new Error('货币设置无效');
  if (!validId(lastExpenseCategory)) throw new Error('分类设置无效');
  if (!Array.isArray(input.categories) || !Array.isArray(input.transactions)) throw new Error('备份缺少账本数据');
  if (input.categories.length > 1000 || input.transactions.length > 100_000) throw new Error('备份记录数量超出限制');

  const categories = input.categories.map(parseCategory);
  const transactions = input.transactions.map(parseTransaction);
  const categoryIds = new Set<string>();
  for (const category of categories) {
    if (categoryIds.has(category.id)) throw new Error('备份中存在重复分类 ID');
    categoryIds.add(category.id);
  }
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  if (categoryMap.get(lastExpenseCategory)?.type !== 'expense') throw new Error('最近使用的支出分类无效');
  const transactionIds = new Set<string>();
  for (const item of transactions) {
    if (transactionIds.has(item.id)) throw new Error('备份中存在重复账单 ID');
    const category = categoryMap.get(item.categoryId);
    if (!category || category.type !== item.type) throw new Error('账单与分类的关联无效');
    transactionIds.add(item.id);
  }
  if (!categories.some((item) => item.type === 'expense' && !item.archived) ||
      !categories.some((item) => item.type === 'income' && !item.archived)) {
    throw new Error('备份中缺少可用的收支分类');
  }
  return {
    schemaVersion: 1,
    exportedAt: input.exportedAt,
    settings: { ledgerName, currency, lastExpenseCategory },
    categories,
    transactions,
  };
}

export async function readBackupFile(file: File): Promise<BackupData> {
  if (file.size > 30 * 1024 * 1024) throw new Error('备份文件不能超过 30 MB');
  try {
    return validateBackup(JSON.parse(await file.text()));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('文件不是有效的 JSON 备份');
    throw error;
  }
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `轻记备份-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
