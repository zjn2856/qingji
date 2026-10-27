import { ChevronRight } from 'lucide-react';
import { signedAmount } from '../lib/money';
import type { Category, Transaction } from '../types';
import { CategoryIcon } from './CategoryIcon';

export function TransactionItem({ item, category, currency, onClick }: { item: Transaction; category?: Category; currency: string; onClick: () => void }) {
  const resolved = category ?? { name: '未分类', color: '#929993', icon: 'ellipsis' };
  return (
    <button className="transaction-item" onClick={onClick} aria-label={`${resolved.name} ${signedAmount(item.amountMinor, item.type, currency)}`}>
      <span className="transaction-icon" style={{ color: resolved.color, backgroundColor: `${resolved.color}18` }}><CategoryIcon icon={resolved.icon} /></span>
      <span className="transaction-copy"><strong>{resolved.name}</strong><small>{item.note || (item.type === 'income' ? '收入' : '支出')}</small></span>
      <span className={`transaction-amount ${item.type}`}>{signedAmount(item.amountMinor, item.type, currency)}</span>
      <ChevronRight className="item-chevron" size={16} />
    </button>
  );
}
