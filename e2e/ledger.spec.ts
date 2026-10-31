import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function addExpense(page: import('@playwright/test').Page, amount: string, note: string) {
  await page.getByRole('button', { name: '记一笔', exact: true }).first().click();
  await page.getByTestId('amount-input').fill(amount);
  await page.getByPlaceholder('补充一点细节…').fill(note);
  await page.getByRole('button', { name: '保存账单' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('新增支出、编辑、筛选与删除，刷新后数据仍在', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('这个月还没有记录')).toBeVisible();
  await addExpense(page, '12.30', '自动化午餐');
  await expect(page.getByText('自动化午餐')).toBeVisible();
  await page.screenshot({ path: 'test-results/qingji-home.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: '账单', exact: true }).click();
  await page.getByLabel('搜索备注').fill('自动化');
  await page.getByLabel('按分类筛选').selectOption('expense-canteen');
  await expect(page.getByText('自动化午餐')).toBeVisible();
  await page.getByLabel('按分类筛选').selectOption('expense-transport');
  await expect(page.getByText('没有符合条件的账单')).toBeVisible();
  await page.getByLabel('按分类筛选').selectOption('expense-canteen');
  await page.getByRole('button', { name: /食堂 −¥12.30/ }).click();
  await page.getByRole('button', { name: '编辑', exact: true }).click();
  await page.getByTestId('amount-input').fill('45.67');
  await page.getByRole('button', { name: '保存修改' }).click();
  await expect(page.getByText('−¥45.67')).toBeVisible();
  await page.getByRole('button', { name: /食堂 −¥45.67/ }).click();
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await page.getByRole('button', { name: '确认删除' }).click();
  await expect(page.getByText('没有符合条件的账单')).toBeVisible();
});

test('新增收入、金额校验与月份切换', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '记一笔', exact: true }).first().click();
  await page.getByRole('button', { name: '收入', exact: true }).click();
  await page.getByTestId('amount-input').fill('0.001');
  await page.getByRole('button', { name: '保存账单' }).click();
  await expect(page.getByRole('alert')).toContainText('最多两位小数');
  await page.getByTestId('amount-input').fill('8000');
  await page.getByRole('button', { name: '保存账单' }).click();
  await expect(page.getByText('+¥8,000.00')).toBeVisible();
  await page.getByRole('button', { name: '下个月' }).click();
  await expect(page.getByText('这个月还没有记录')).toBeVisible();
  await page.getByRole('button', { name: '上个月', exact: true }).click();
  await expect(page.getByText('+¥8,000.00')).toBeVisible();
});

test('导出完整 JSON、拒绝无效文件并覆盖恢复', async ({ page }) => {
  await page.goto('/');
  await addExpense(page, '88.66', '备份测试');
  await page.getByRole('button', { name: '设置', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /导出备份/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/轻记备份-.*\.json/);
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(data.transactions).toHaveLength(1);
  expect(data.schemaVersion).toBe(1);
  await page.getByTestId('backup-file-input').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('status')).toContainText('不是有效的 JSON');
  await page.getByTestId('backup-file-input').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await expect(page.getByRole('dialog', { name: '恢复这个备份？' })).toContainText('1 笔账单');
  await page.getByRole('button', { name: '覆盖并恢复' }).click();
  await expect(page.getByRole('status')).toContainText('已恢复 1 笔账单');
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await expect(page.getByText('备份测试')).toBeVisible();
});

test('Service Worker 注册后可离线刷新并记账', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('每一笔，都心中有数')).toBeVisible();
  await addExpense(page, '6.00', '离线账单');
  await expect(page.getByText('离线账单')).toBeVisible();
});
