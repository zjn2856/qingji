import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { defaultCategories } from './defaults';
import { isValidDate } from './date';
import { MAX_AMOUNT_MINOR } from './money';
import { CURRENCIES, DEFAULT_SETTINGS, type BackupData, type Category, type Settings, type Transaction, type TransactionDraft } from '../types';

interface LedgerDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { date: string; type: string; categoryId: string; 'type-date': [string, string] };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { type: string };
  };
  settings: { key: string; value: { key: string; value: unknown } };
}

let database: Promise<IDBPDatabase<LedgerDB>> | undefined;
let initialized: Promise<void> | undefined;

function getDB() {
  database ??= openDB<LedgerDB>('qingji-ledger', 1, {
    upgrade(db) {
      const transactions = db.createObjectStore('transactions', { keyPath: 'id' });
      transactions.createIndex('date', 'date');
      transactions.createIndex('type', 'type');
      transactions.createIndex('categoryId', 'categoryId');
      transactions.createIndex('type-date', ['type', 'date']);
      const categories = db.createObjectStore('categories', { keyPath: 'id' });
      categories.createIndex('type', 'type');
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });
  return database;
}

export async function initDB(): Promise<void> {
  initialized ??= (async () => {
    const db = await getDB();
    const tx = db.transaction(['categories', 'settings'], 'readwrite');
    if ((await tx.objectStore('categories').count()) === 0) {
      for (const category of defaultCategories()) await tx.objectStore('categories').put(category);
    }
    const settings = tx.objectStore('settings');
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!(await settings.get(key))) await settings.put({ key, value });
    }
    await tx.done;
  })();
  return initialized;
}

export async function getSettings(): Promise<Settings> {
  await initDB();
  const values = await (await getDB()).getAll('settings');
  const stored = Object.fromEntries(values.map((item) => [item.key, item.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await initDB();
  if (patch.ledgerName !== undefined && (!patch.ledgerName.trim() || patch.ledgerName.trim().length > 30)) {
    throw new Error('账本名称需为 1–30 个字符');
  }
  if (patch.currency !== undefined && !CURRENCIES.some((item) => item.code === patch.currency)) {
    throw new Error('不支持的货币');
  }
  const db = await getDB();
  const tx = db.transaction('settings', 'readwrite');
  for (const [key, value] of Object.entries(patch)) await tx.store.put({ key, value });
  await tx.done;
}

export async function getCategories(): Promise<Category[]> {
  await initDB();
  return (await getDB()).getAll('categories');
}

export async function saveCategory(input: Category): Promise<void> {
  await initDB();
  if (!input.name.trim() || input.name.trim().length > 20) throw new Error('分类名称需为 1–20 个字符');
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) throw new Error('分类颜色无效');
  await (await getDB()).put('categories', { ...input, name: input.name.trim() });
}

export async function removeCategory(id: string): Promise<'deleted' | 'archived'> {
  await initDB();
  const db = await getDB();
  const category = await db.get('categories', id);
  if (!category) throw new Error('分类不存在');
  const tx = db.transaction(['categories', 'transactions', 'settings'], 'readwrite');
  const related = await tx.objectStore('transactions').index('categoryId').count(id);
  const last = await tx.objectStore('settings').get('lastExpenseCategory');
  if (last?.value === id) await tx.objectStore('settings').put({ key: 'lastExpenseCategory', value: 'expense-food' });
  if (related > 0) {
    await tx.objectStore('categories').put({ ...category, archived: true });
    await tx.done;
    return 'archived';
  }
  await tx.objectStore('categories').delete(id);
  await tx.done;
  return 'deleted';
}

export async function getTransactions(): Promise<Transaction[]> {
  await initDB();
  const items = await (await getDB()).getAll('transactions');
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function validateDraft(draft: TransactionDraft): void {
  if (!Number.isSafeInteger(draft.amountMinor) || draft.amountMinor <= 0 || draft.amountMinor > MAX_AMOUNT_MINOR) {
    throw new Error('请输入有效金额');
  }
  if (!isValidDate(draft.date)) throw new Error('请选择有效日期');
  if (!['income', 'expense'].includes(draft.type)) throw new Error('账单类型无效');
  if (draft.note.length > 200) throw new Error('备注不能超过 200 个字符');
}

export async function addTransaction(draft: TransactionDraft): Promise<Transaction> {
  validateDraft(draft);
  await initDB();
  const db = await getDB();
  const category = await db.get('categories', draft.categoryId);
  if (!category || category.type !== draft.type) throw new Error('请选择有效的分类');
  const now = new Date().toISOString();
  const item: Transaction = { ...draft, id: crypto.randomUUID(), note: draft.note.trim(), createdAt: now, updatedAt: now };
  await db.add('transactions', item);
  if (item.type === 'expense') await updateSettings({ lastExpenseCategory: item.categoryId });
  return item;
}

export async function updateTransaction(id: string, draft: TransactionDraft): Promise<void> {
  validateDraft(draft);
  await initDB();
  const db = await getDB();
  const tx = db.transaction(['transactions', 'categories'], 'readwrite');
  const old = await tx.objectStore('transactions').get(id);
  if (!old) throw new Error('账单不存在或已删除');
  const category = await tx.objectStore('categories').get(draft.categoryId);
  if (!category || category.type !== draft.type) throw new Error('请选择有效的分类');
  await tx.objectStore('transactions').put({ ...old, ...draft, note: draft.note.trim(), updatedAt: new Date().toISOString() });
  await tx.done;
}

export async function deleteTransaction(id: string): Promise<void> {
  await initDB();
  await (await getDB()).delete('transactions', id);
}

export async function createBackup(): Promise<BackupData> {
  await initDB();
  const [settings, categories, transactions] = await Promise.all([getSettings(), getCategories(), getTransactions()]);
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), settings, categories, transactions };
}

export async function restoreBackup(data: BackupData): Promise<void> {
  await initDB();
  const db = await getDB();
  const tx = db.transaction(['transactions', 'categories', 'settings'], 'readwrite');
  try {
    const stores = [tx.objectStore('transactions'), tx.objectStore('categories'), tx.objectStore('settings')];
    await Promise.all(stores.map((store) => store.clear()));
    for (const item of data.transactions) await tx.objectStore('transactions').put(item);
    for (const item of data.categories) await tx.objectStore('categories').put(item);
    for (const [key, value] of Object.entries(data.settings)) await tx.objectStore('settings').put({ key, value });
    await tx.done;
  } catch (error) {
    tx.abort();
    await tx.done.catch(() => undefined);
    throw error;
  }
}

export async function resetDBForTests(): Promise<void> {
  const db = await getDB();
  db.close();
  database = undefined;
  initialized = undefined;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('qingji-ledger');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
