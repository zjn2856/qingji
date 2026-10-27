import type { Category } from '../types';

const expenseCategories: Array<[string, string, string, string]> = [
  ['food', '餐饮', 'utensils', '#ed8b5f'],
  ['shopping', '购物', 'shopping-bag', '#a387d8'],
  ['transport', '交通', 'train-front', '#68a4db'],
  ['housing', '住房', 'house', '#7f9c79'],
  ['daily', '日用', 'shopping-basket', '#d8a44e'],
  ['entertainment', '娱乐', 'clapperboard', '#d880a1'],
  ['medical', '医疗', 'heart-pulse', '#e47777'],
  ['education', '学习', 'book-open', '#7797c9'],
  ['travel', '旅行', 'plane', '#54aaa5'],
  ['other', '其他', 'ellipsis', '#929993'],
];

const incomeCategories: Array<[string, string, string, string]> = [
  ['salary', '工资', 'briefcase-business', '#58a47b'],
  ['parttime', '兼职', 'clock-3', '#6b9ac4'],
  ['bonus', '奖金', 'award', '#d6a54d'],
  ['investment', '理财', 'chart-no-axes-combined', '#7a92cb'],
  ['redpacket', '红包', 'gift', '#dc7973'],
  ['other', '其他', 'ellipsis', '#929993'],
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
