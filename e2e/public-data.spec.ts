import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Vesta', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
