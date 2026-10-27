import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { addTransaction, updateTransaction } from '../lib/db';
import { localDate } from '../lib/date';
import { currencyFraction, minorToInput, parseAmount } from '../lib/money';
import type { Category, Settings, Transaction, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { Sheet } from './Sheet';

export function TransactionSheet({ categories, settings, editing, onClose, onSaved }: {
  categories: Category[];
  settings: Settings;
  editing?: Transaction;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? minorToInput(editing.amountMinor, settings.currency) : '');
  const initialCategory = editing?.categoryId ?? (settings.lastExpenseCategory || categories.find((item) => item.type === 'expense' && !item.archived)?.id || '');
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [date, setDate] = useState(editing?.date ?? localDate());
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const visibleCategories = useMemo(() => categories.filter((item) => item.type === type && (!item.archived || item.id === categoryId)), [categories, type, categoryId]);
  const currency = settings.currency;

  function changeType(next: TransactionType) {
    setType(next);
    if (categories.find((item) => item.id === categoryId)?.type !== next) {
      setCategoryId(categories.find((item) => item.type === next && !item.archived)?.id ?? '');
    }
  }

  async function submit() {
    if (submitting.current) return;
    const amountMinor = parseAmount(amount, currency);
    if (amountMinor === null) { setError(currencyFraction(currency) === 0 ? '请输入大于 0 的整数金额' : '请输入大于 0、最多两位小数的有效金额'); return; }
    if (!categoryId) { setError('请选择一个分类'); return; }
    if (!date) { setError('请选择账单日期'); return; }
    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      const draft = { type, amountMinor, categoryId, date, note };
      if (editing) await updateTransaction(editing.id, draft);
      else await addTransaction(draft);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败，请检查设备存储空间后重试');
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Sheet title={editing ? '编辑账单' : '记一笔'} onClose={onClose} className="transaction-sheet">
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="type-switch" role="group" aria-label="账单类型">
          <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => changeType('expense')}>支出</button>
          <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => changeType('income')}>收入</button>
        </div>
        <label className="amount-field">
          <span>金额 <small>{currency}</small></span>
          <div><b>{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥'}</b><input data-testid="amount-input" autoFocus inputMode={currencyFraction(currency) === 0 ? 'numeric' : 'decimal'} type="text" autoComplete="off" placeholder="0.00" value={amount} onChange={(event) => { setAmount(event.target.value); setError(''); }} aria-label="金额" /></div>
        </label>
        <fieldset className="category-field"><legend>分类</legend><div className="category-grid">
          {visibleCategories.map((category) => <button key={category.id} type="button" className={`category-option ${categoryId === category.id ? 'selected' : ''}`} onClick={() => setCategoryId(category.id)} aria-pressed={categoryId === category.id}>
            <span style={{ color: category.color, backgroundColor: `${category.color}18` }}><CategoryIcon icon={category.icon} /></span><small>{category.name}</small>{categoryId === category.id && <i><Check size={10} /></i>}
          </button>)}
        </div></fieldset>
        <div className="form-row">
          <label className="input-field"><span>日期</span><input type="date" value={date} max="2999-12-31" onChange={(event) => setDate(event.target.value)} /></label>
          <label className="input-field note-input"><span>备注 <small>选填</small></span><input type="text" value={note} maxLength={200} placeholder="补充一点细节…" onChange={(event) => setNote(event.target.value)} /><ChevronDown size={0} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary save-button" type="submit" disabled={saving}>{saving ? '正在保存…' : editing ? '保存修改' : '保存账单'}</button>
      </form>
    </Sheet>
  );
}
