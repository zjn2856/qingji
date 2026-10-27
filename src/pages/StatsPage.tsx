import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChartPie, TrendingUp } from 'lucide-react';
import { currentMonth } from '../lib/date';
import { formatAmount } from '../lib/money';
import { categorySummaries, dailyExpenses, monthTransactions, summarize } from '../lib/stats';
import { DonutChart, TrendChart } from '../components/Charts';
import { MonthNav } from '../components/MonthNav';
import { CategoryIcon } from '../components/CategoryIcon';
import type { PageProps } from './HomePage';

export function StatsPage({ transactions, categories, settings }: PageProps) {
  const [month, setMonth] = useState(currentMonth());
  const monthly = useMemo(() => monthTransactions(transactions, month), [transactions, month]);
  const totals = summarize(monthly);
  const summaries = categorySummaries(monthly, categories);
  const max = Math.max(totals.income, totals.expense, 1);
  return <div className="page stats-page">
    <header className="page-header"><span className="eyebrow">读懂你的消费习惯</span><h1>统计</h1></header>
    <MonthNav month={month} onChange={setMonth} />
    <section className="stats-summary card"><div><span className="summary-icon income"><ArrowDownLeft size={18} /></span><small>总收入</small><strong>{formatAmount(totals.income, settings.currency, true)}</strong></div><div><span className="summary-icon expense"><ArrowUpRight size={18} /></span><small>总支出</small><strong>{formatAmount(totals.expense, settings.currency, true)}</strong></div><div className="net-summary"><small>月度结余</small><strong className={totals.income - totals.expense < 0 ? 'negative' : ''}>{formatAmount(totals.income - totals.expense, settings.currency, true)}</strong></div></section>
    <section className="card"><div className="section-heading"><div><h2><ChartPie size={19} /> 支出构成</h2><p>{monthly.length ? `基于本月 ${monthly.filter((item) => item.type === 'expense').length} 笔支出` : '本月暂无数据'}</p></div></div><div className="category-overview"><DonutChart items={summaries} total={totals.expense} currency={settings.currency} /><div className="category-legend">{summaries.slice(0, 5).map((item) => <div className="legend-row" key={item.category.id}><span className="legend-dot" style={{ background: item.category.color }} /><span>{item.category.name}</span><strong>{item.percentage}%</strong></div>)}</div></div></section>
    <section className="card chart-card"><div className="section-heading"><div><h2><TrendingUp size={19} /> 每日支出</h2><p>观察消费节奏</p></div></div><TrendChart values={dailyExpenses(transactions, month)} currency={settings.currency} height={145} /></section>
    <section className="card"><div className="section-heading"><div><h2>收入与支出</h2><p>本月资金流向对比</p></div></div><div className="comparison"><div><span>收入 <b>{formatAmount(totals.income, settings.currency)}</b></span><div><i className="income-bar" style={{ width: `${totals.income / max * 100}%` }} /></div></div><div><span>支出 <b>{formatAmount(totals.expense, settings.currency)}</b></span><div><i className="expense-bar" style={{ width: `${totals.expense / max * 100}%` }} /></div></div></div></section>
    <section className="card"><div className="section-heading"><div><h2>分类排行</h2><p>支出金额由高到低</p></div></div>{summaries.length ? <div className="ranking-list">{summaries.map((item, index) => <div key={item.category.id}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="rank-icon" style={{ color: item.category.color, background: `${item.category.color}18` }}><CategoryIcon icon={item.category.icon} /></span><span><strong>{item.category.name}</strong><small>{item.count} 笔 · {item.percentage}%</small></span><b>{formatAmount(item.amount, settings.currency, true)}</b></div>)}</div> : <p className="muted-empty">还没有支出排行</p>}</section>
  </div>;
}
