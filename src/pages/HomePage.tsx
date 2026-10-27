import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { currentMonth, monthLabel } from '../lib/date';
import { formatAmount } from '../lib/money';
import { categorySummaries, dailyExpenses, monthTransactions, summarize } from '../lib/stats';
import { CURRENCIES, type Category, type Settings, type Transaction } from '../types';
import { DonutChart, TrendChart } from '../components/Charts';
import { EmptyState } from '../components/EmptyState';
import { MonthNav } from '../components/MonthNav';
import { TransactionItem } from '../components/TransactionItem';

export interface PageProps {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  refresh: () => Promise<void>;
  notify: (message: string) => void;
}

export function HomePage({ transactions, categories, settings, onAdd, onViewCategory, onViewAll }: PageProps & {
  onAdd: () => void; onViewCategory: (categoryId: string, month: string) => void; onViewAll: () => void;
}) {
  const [month, setMonth] = useState(currentMonth());
  const monthly = useMemo(() => monthTransactions(transactions, month), [transactions, month]);
  const totals = summarize(monthly);
  const summaries = categorySummaries(monthly, categories);
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const balance = totals.income - totals.expense;
  return (
    <div className="page home-page">
      <header className="home-header"><div><span className="eyebrow"><Sparkles size={14} /> {settings.ledgerName}</span><h1>每一笔，都心中有数</h1></div><div className="header-mark">轻</div></header>
      <MonthNav month={month} onChange={setMonth} />
      <section className="balance-card">
        <div className="balance-heading"><span>本月结余</span><span>{monthLabel(month)}</span></div>
        <strong className="balance-number"><small>{CURRENCIES.find((item) => item.code === settings.currency)?.symbol}</small>{formatAmount(balance, settings.currency).replace('-', '−')}</strong>
        <div className="balance-breakdown">
          <div><span className="summary-icon income"><ArrowDownLeft size={17} /></span><span><small>收入</small><b>{formatAmount(totals.income, settings.currency, true)}</b></span></div>
          <div><span className="summary-icon expense"><ArrowUpRight size={17} /></span><span><small>支出</small><b>{formatAmount(totals.expense, settings.currency, true)}</b></span></div>
        </div>
      </section>
      {monthly.length === 0 ? <EmptyState title="这个月还没有记录" description="从一笔小账开始，让生活更有掌控感。" action={onAdd} /> : <>
        <section className="card chart-card"><div className="section-heading"><div><h2>支出趋势</h2><p>每一天，都清晰可见</p></div><span className="soft-badge">日支出</span></div><TrendChart values={dailyExpenses(transactions, month)} currency={settings.currency} /></section>
        <section className="card"><div className="section-heading"><div><h2>支出去哪儿了</h2><p>点击分类查看明细</p></div></div>
          <div className="category-overview"><DonutChart items={summaries} total={totals.expense} currency={settings.currency} /><div className="category-legend">{summaries.slice(0, 4).map((item) => <button key={item.category.id} onClick={() => onViewCategory(item.category.id, month)}><span className="legend-dot" style={{ background: item.category.color }} /><span>{item.category.name}</span><strong>{item.percentage}%</strong><ChevronRight size={13} /></button>)}</div></div>
        </section>
      </>}
      <section className="recent-section"><div className="section-heading"><h2>最近账单</h2>{monthly.length > 0 && <button className="text-button" onClick={onViewAll}>查看全部 <ChevronRight size={15} /></button>}</div>
        <div className="transaction-list card">{monthly.slice(0, 5).map((item) => <TransactionItem key={item.id} item={item} category={categoryMap.get(item.categoryId)} currency={settings.currency} onClick={onViewAll} />)}</div>
      </section>
      <button className="button primary add-main" onClick={onAdd}><Plus size={21} /> 记一笔</button>
    </div>
  );
}
