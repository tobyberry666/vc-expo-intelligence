import { expect, test } from '@playwright/test';
test('open pages automatically recheck snapshots without manual reload', async ({
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  await page.route('**/data/feed.json', async (route) => {
    requests++;
    const response = await route.fetch();
    const data = await response.json();
    data.updatedAt = Date.now(); // This polling test controls freshness independently of the seed age.
    if (requests > 1) data.warning = '测试更新提示：第二次快照已载入';
    await route.fulfill({ json: data });
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Vesta 完成/ })).toBeVisible();
  await page.clock.runFor(5 * 60000);
  await expect(page.getByText('测试更新提示：第二次快照已载入')).toBeVisible();
  expect(requests).toBe(2);
});

test('fresh browser loads actual public snapshot and opens attributed details', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: /Vesta 完成/ })).toBeVisible();
  await expect(
    page.getByText('CES 2027', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    '实时情报需在妙搭平台运行',
  );
  await page.goto('investments?keyword=Vesta');
  await page.getByRole('tab', { name: '时间线' }).click();
  await page.getByText('Vesta', { exact: true }).first().click();
  await expect(
    page.getByRole('heading', { name: 'Vesta', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /查看原文/ })).toHaveAttribute(
    'href',
    /https:\/\/techcrunch.com\//,
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Vesta', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^(刷新|重试)$/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Vesta', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('stale snapshots retain records and visibly warn instead of pretending to be current', async ({
  page,
}) => {
  await page.route('**/data/feed.json', async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    data.updatedAt = Date.now() - 4 * 3600000;
    await route.fulfill({ json: data });
  });
  await page.goto('./');
  await expect(page.getByText(/数据已超过 3 小时未采集/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Vesta 完成/ })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '重试', exact: true }),
  ).toBeEnabled();
});
