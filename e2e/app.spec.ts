import { expect, test } from '@playwright/test';
import { fixtureCache } from '../tests/fixtures';
test.beforeEach(async ({ page }) => {
  await page.route('**/data/feed.json', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
});

test('cached investment browsing, URL filters, legacy detail links and reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(
    (cache) => localStorage.setItem('__live_feed_cache', JSON.stringify(cache)),
    fixtureCache(),
  );
  await page.goto('investments?keyword=星河');
  await page.getByRole('tab', { name: '时间线' }).click();
  await expect(
    page.getByText('星河科技', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('云帆科技', { exact: true })).toHaveCount(0);
  await page.goto('investments/live-inv-0?keyword=星河');
  await expect(page.getByRole('heading', { name: '星河科技' })).toBeVisible();
  await page.getByRole('button', { name: '跟踪动态' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('__global_vc_expo_favorites') ?? '[]')
            .length,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: '星河科技' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('cached expo details use actual range and searchable exhibitors', async ({
  page,
}) => {
  await page.addInitScript(
    (cache) => localStorage.setItem('__live_feed_cache', JSON.stringify(cache)),
    fixtureCache(),
  );
  await page.goto('expos/live-expo-0');
  await expect(page.getByRole('heading', { name: 'CES 2026' })).toBeVisible();
  await expect(
    page.getByText('测试企业1', { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: '下一页' }).click();
  await expect(page.getByText('测试企业9', { exact: true })).toBeVisible();
  await page.getByPlaceholder('搜索企业名称', { exact: true }).fill('不存在');
  await expect(page.getByText('未找到匹配的参展企业')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('NaN');
});
test('blocked browser storage does not crash the application', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('investments');
  await expect(page.getByText(/实时情报获取失败/)).toBeVisible();
  expect(errors).toEqual([]);
});
test('standalone empty and corrupt caches explain data failures without crashing', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('__live_feed_cache', '{broken'),
  );
  await page.goto('investments');
  await expect(page.getByText(/实时情报获取失败/)).toBeVisible();
  await expect(page.getByRole('button', { name: '重试' })).toBeEnabled();
});
test('mobile navigation and unknown routes remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    (cache) => localStorage.setItem('__live_feed_cache', JSON.stringify(cache)),
    fixtureCache(),
  );
  await page.goto('./');
  await page
    .getByRole('link', { name: '投资事件', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/investments/);
  await page.goto('missing-route');
  await expect(page.locator('body')).toContainText('404');
});
