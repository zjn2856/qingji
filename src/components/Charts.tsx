import { useId } from 'react';
import { formatAmount } from '../lib/money';
import type { CategorySummary } from '../lib/stats';

export function TrendChart({ values, currency, height = 128 }: { values: number[]; currency: string; height?: number }) {
  const id = useId();
  const width = 600;
  const padding = 8;
  const chartHeight = 88;
  const max = Math.max(...values, 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return <div className="chart-empty"><span>本月还没有支出记录</span></div>;
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = chartHeight - (value / max) * (chartHeight - 12);
    return { x, y, value };
  });
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1)?.x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="本月每日支出趋势图" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#557967" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#557967" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((position) => <line key={position} x1="0" x2={width} y1={chartHeight * position} y2={chartHeight * position} className="chart-grid" />)}
        <path d={area} fill={`url(#${id})`} />
        <path d={line} className="trend-line" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => point.value > 0 && <circle key={index} cx={point.x} cy={point.y} r="2.8" className="trend-dot"><title>{index + 1}日：{formatAmount(point.value, currency, true)}</title></circle>)}
        <text x="0" y={height - 5}>1日</text>
        <text x={width / 2} y={height - 5} textAnchor="middle">{Math.ceil(values.length / 2)}日</text>
        <text x={width} y={height - 5} textAnchor="end">{values.length}日</text>
      </svg>
    </div>
  );
}

export function DonutChart({ items, total, currency }: { items: CategorySummary[]; total: number; currency: string }) {
  if (total === 0) return <div className="donut-empty"><div><span>暂无支出</span><small>记一笔后查看占比</small></div></div>;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" role="img" aria-label="支出分类占比图">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#edf0eb" strokeWidth="16" />
        {items.map((item) => {
          const length = (item.amount / total) * circumference;
          const circle = <circle key={item.category.id} cx="70" cy="70" r={radius} fill="none" stroke={item.category.color} strokeWidth="16" strokeDasharray={`${Math.max(length - 1.5, 0)} ${circumference}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)"><title>{item.category.name} {item.percentage}%</title></circle>;
          offset += length;
          return circle;
        })}
      </svg>
      <div className="donut-center"><strong>{formatAmount(total, currency)}</strong><span>总支出</span></div>
    </div>
  );
}
