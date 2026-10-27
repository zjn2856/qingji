import type { Category } from '../types';

const expenseCategories: Array<[string, string, string, string]> = [
  ['food', '餐饮', 'utensils', '#a5755c'],
  ['shopping', '购物', 'shopping-bag', '#a38b77'],
  ['transport', '交通', 'train-front', '#7f8a8c'],
  ['housing', '住房', 'house', '#8a8070'],
  ['daily', '日用', 'shopping-basket', '#aa9676'],
  ['entertainment', '娱乐', 'clapperboard', '#a58380'],
  ['medical', '医疗', 'heart-pulse', '#a87870'],
  ['education', '学习', 'book-open', '#7d8992'],
  ['travel', '旅行', 'plane', '#7f928a'],
  ['other', '其他', 'ellipsis', '#969088'],
];

const incomeCategories: Array<[string, string, string, string]> = [
  ['salary', '工资', 'briefcase-business', '#7e8b74'],
  ['parttime', '兼职', 'clock-3', '#84908a'],
  ['bonus', '奖金', 'award', '#aa946e'],
  ['investment', '理财', 'chart-no-axes-combined', '#828b98'],
  ['redpacket', '红包', 'gift', '#a77e70'],
  ['other', '其他', 'ellipsis', '#969088'],
];

export function defaultCategories(now = new Date().toISOString()): Category[] {
  return [
    ...expenseCategories.map(([id, name, icon, color]) => makeCategory('expense', id, name, icon, color, now)),
    ...incomeCategories.map(([id, name, icon, color]) => makeCategory('income', id, name, icon, color, now)),
  ];
}

function makeCategory(
  type: 'income' | 'expense',
  id: string,
  name: string,
  icon: string,
  color: string,
  now: string,
): Category {
  return { id: `${type}-${id}`, name, type, icon, color, isDefault: true, archived: false, createdAt: now };
}
