import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from '../lib/date';

export function MonthNav({ month, onChange, compact = false }: { month: string; onChange: (month: string) => void; compact?: boolean }) {
  return (
    <div className={`month-nav ${compact ? 'compact' : ''}`} aria-label="切换月份">
      <button className="icon-button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="上个月">
        <ChevronLeft size={21} />
      </button>
      <strong>{monthLabel(month)}</strong>
      <button className="icon-button" onClick={() => onChange(shiftMonth(month, 1))} aria-label="下个月">
        <ChevronRight size={21} />
      </button>
    </div>
  );
}
