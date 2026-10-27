import { useMemo, useState } from 'react';
import { CalendarDays, Pencil, Search, Trash2, X } from 'lucide-react';
import { dateLabel, weekdayLabel } from '../lib/date';
import { formatAmount, signedAmount } from '../lib/money';
import { monthTransactions, summarize } from '../lib/stats';
import { deleteTransaction } from '../lib/db';
import { currentMonth } from '../lib/date';
import { EmptyState } from '../components/EmptyState';
import { MonthNav } from '../components/MonthNav';
import { ConfirmDialog, Sheet } from '../components/Sheet';
import { TransactionItem } from '../components/TransactionItem';
import { CategoryIcon } from '../components/CategoryIcon';
import type { PageProps } from './HomePage';
import type { Transaction, TransactionType } from '../types';

export function HistoryPage({ transactions, categories, settings, refresh, notify, initialCategory, onEdit, onAdd }: PageProps & {
  initialCategory?: { id: string; month: string }; onEdit: (item: Transaction) => void; onAdd: () => void;
}) {
  const [month, setMonth] = useState(initialCategory?.month ?? currentMonth());
  const [type, setType] = useState<'all' | TransactionType>('all');
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? 'all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const filtered = useMemo(() => monthTransactions(transactions, month).filter((item) =>
    (type === 'all' || item.type === type) && (categoryId === 'all' || item.categoryId === categoryId) &&
    (!query.trim() || item.note.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
  ), [transactions, month, type, categoryId, query]);
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filtered.forEach((item) => map.set(item.date, [...(map.get(item.date) ?? []), item]));
    return [...map.entries()];
  }, [filtered]);
  const selected = transactions.find((item) => item.id === selectedId);
  const selectedCategory = selected ? categoryMap.get(selected.categoryId) : undefined;

  async function confirmRemove() {
    if (!selected || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(selected.id);
      await refresh();
      setConfirmDelete(false);
      setSelectedId(undefined);
      notify('账单已删除');
    } catch { notify('删除失败，请稍后重试'); }
    finally { setDeleting(false); }
  }

  return <div className="page history-page">
    <header className="page-header"><span className="eyebrow">每一笔都有迹可循</span><h1>账单</h1></header>
    <MonthNav month={month} onChange={setMonth} />
    <div className="search-box"><Search size={18} /><input type="search" placeholder="搜索备注" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索备注" />{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={16} /></button>}</div>
    <div className="filter-row"><div className="segmented small">{(['all', 'expense', 'income'] as const).map((value) => <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{value === 'all' ? '全部' : value === 'expense' ? '支出' : '收入'}</button>)}</div>
      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="按分类筛选"><option value="all">全部分类</option>{categories.filter((item) => type === 'all' || item.type === type).map((item) => <option key={item.id} value={item.id}>{item.name}{item.archived ? '（已归档）' : ''}</option>)}</select>
    </div>
    <p className="result-count">共 {filtered.length} 笔 · {month}</p>
    {groups.length === 0 ? <EmptyState title="没有符合条件的账单" description={transactions.length ? '试试更换月份或筛选条件。' : '你的第一笔账，会出现在这里。'} action={!transactions.length ? onAdd : undefined} /> : <div className="history-groups">{groups.map(([date, items]) => {
      const totals = summarize(items);
      return <section key={date} className="date-group"><div className="date-heading"><div><CalendarDays size={16} /><strong>{dateLabel(date)}</strong><span>{weekdayLabel(date)} · {date.slice(5).replace('-', '/')}</span></div><small>{totals.expense > 0 && `支出 ${formatAmount(totals.expense, settings.currency, true)}`}{totals.income > 0 && `　收入 ${formatAmount(totals.income, settings.currency, true)}`}</small></div><div className="transaction-list card">{items.map((item) => <TransactionItem key={item.id} item={item} category={categoryMap.get(item.categoryId)} currency={settings.currency} onClick={() => setSelectedId(item.id)} />)}</div></section>;
    })}</div>}
    {selected && <Sheet title="账单详情" onClose={() => setSelectedId(undefined)} className="detail-sheet"><div className="detail-amount"><span className="detail-category-icon" style={{ color: selectedCategory?.color, backgroundColor: `${selectedCategory?.color ?? '#999'}18` }}><CategoryIcon icon={selectedCategory?.icon ?? 'ellipsis'} size={27} /></span><small>{selectedCategory?.name ?? '未分类'}</small><strong className={selected.type}>{signedAmount(selected.amountMinor, selected.type, settings.currency)}</strong></div><dl className="detail-list"><div><dt>类型</dt><dd>{selected.type === 'expense' ? '支出' : '收入'}</dd></div><div><dt>日期</dt><dd>{selected.date}</dd></div><div><dt>备注</dt><dd>{selected.note || '无'}</dd></div><div><dt>最后修改</dt><dd>{new Date(selected.updatedAt).toLocaleString('zh-CN')}</dd></div></dl><div className="detail-actions"><button className="button danger-soft" onClick={() => setConfirmDelete(true)}><Trash2 size={18} /> 删除</button><button className="button primary" onClick={() => { onEdit(selected); setSelectedId(undefined); }}><Pencil size={18} /> 编辑</button></div></Sheet>}
    {confirmDelete && <ConfirmDialog title="删除这笔账单？" description="删除后无法撤销，月度统计会同步更新。建议定期导出备份。" confirmText={deleting ? '正在删除…' : '确认删除'} danger onClose={() => !deleting && setConfirmDelete(false)} onConfirm={() => void confirmRemove()} />}
  </div>;
}
