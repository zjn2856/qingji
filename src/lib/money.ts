import { CURRENCIES } from '../types';

export const MAX_AMOUNT_MINOR = 999_999_999_999;

export function currencyFraction(currency: string): number {
  return CURRENCIES.find((item) => item.code === currency)?.fraction ?? 2;
}

export function parseAmount(input: string, currency = 'CNY'): number | null {
  const value = input.trim();
  const fraction = currencyFraction(currency);
  const pattern = fraction === 0 ? /^\d+$/ : /^\d+(?:\.\d{1,2})?$/;
  if (!pattern.test(value)) return null;
  const [whole, decimal = ''] = value.split('.');
  const minor = Number(whole) * 10 ** fraction + Number(decimal.padEnd(fraction, '0') || 0);
  return Number.isSafeInteger(minor) && minor > 0 && minor <= MAX_AMOUNT_MINOR ? minor : null;
}

export function minorToInput(minor: number, currency = 'CNY'): string {
  const fraction = currencyFraction(currency);
  if (fraction === 0) return String(minor);
  return (minor / 10 ** fraction).toFixed(fraction).replace(/0$/, '').replace(/\.0$/, '');
}

export function formatAmount(minor: number, currency = 'CNY', withSymbol = false): string {
  const fraction = currencyFraction(currency);
  const formatted = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(minor / 10 ** fraction);
  const symbol = CURRENCIES.find((item) => item.code === currency)?.symbol ?? currency;
  return withSymbol ? `${symbol}${formatted}` : formatted;
}

export function signedAmount(minor: number, type: 'income' | 'expense', currency: string): string {
  return `${type === 'income' ? '+' : '−'}${formatAmount(minor, currency, true)}`;
}
