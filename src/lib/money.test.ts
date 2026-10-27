import { describe, expect, it } from 'vitest';
import { formatAmount, minorToInput, parseAmount } from './money';

 describe('金额与货币', () => {
  it.each([
    ['1', 100], ['0.01', 1], ['12.30', 1230], ['999.99', 99999],
  ])('将 %s 精确转换为最小货币单位', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '0', '0.00', '-1', '1.234', '1e3', 'abc', 'NaN', '1,000', '9999999999999'])('拒绝非法金额 %s', (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it('正确处理零小数位日元', () => {
    expect(parseAmount('1200', 'JPY')).toBe(1200);
    expect(parseAmount('12.5', 'JPY')).toBeNull();
    expect(formatAmount(1200, 'JPY', true)).toBe('¥1,200');
    expect(minorToInput(1230)).toBe('12.3');
  });
});
