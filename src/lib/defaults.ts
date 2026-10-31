import type { Category } from '../types';

const expenseCategories: Array<[string, string, string, string]> = [
  ['canteen', '食堂', 'utensils', '#a5755c'],
  ['dining-out', '外食', 'chef-hat', '#aa7d68'],
  ['drinks-snacks', '饮品零食', 'cup-soda', '#7d9296'],
  ['daily-life', '日常生活', 'shopping-cart', '#a38b77'],
  ['transport', '交通出行', 'train-front', '#7f8a8c'],
  ['research', '学习科研', 'book-open', '#7d8992'],
  ['ai', 'AI消费', 'bot', '#8a7f96'],
  ['medical', '医疗健康', 'heart-pulse', '#a87870'],
  ['leisure-social', '休闲人情', 'clapperboard', '#a58380'],
  ['other', '其他支出', 'ellipsis', '#969088'],
];

const incomeCategories: Array<[string, string, string, string]> = [
  ['scholarship', '奖助学金', 'award', '#7e8b74'],
  ['research-grant', '科研补助', 'flask-conical', '#748d82'],
  ['parttime', '兼职实习', 'briefcase-business', '#84908a'],
  ['family', '家庭支持', 'hand-heart', '#aa946e'],
  ['reimbursement', '报销', 'receipt', '#7f928a'],
  ['investment', '投资理财', 'chart-no-axes-combined', '#828b98'],
  ['other', '其他收入', 'ellipsis', '#969088'],
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
