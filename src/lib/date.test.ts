import { describe, expect, it } from 'vitest';
import { currentMonth, daysInMonth, isValidDate, localDate, shiftMonth } from './date';

describe('本地日期与月份', () => {
  it('使用本地年月日而非 UTC 日期', () => {
    expect(localDate(new Date(2026, 0, 2, 23, 59))).toBe('2026-01-02');
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
  it('正确跨年和计算月末、闰年', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
  });
  it('拒绝不存在的日期', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
  });
});
