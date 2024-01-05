import { test, expect } from '@playwright/test';
const { version } =  require('../package.json');

test('pages', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Matches').click();
  await expect(page.locator('.match-wrapper')).toBeVisible();
  await page.getByLabel('Train').click();
  await expect(page.locator('.train-wrapper')).toBeVisible();
  await page.getByLabel('Config').click();
  await expect(page.locator('.ace_content')).toBeVisible({ timeout: 15000 });
  await page.getByLabel('Logs').click();
  await expect(page.locator('pre')).toBeVisible();
});
test('right-menu', async ({ page }) => {
  await page.goto('./');
  await page.getByText('Double Take').click();
  await expect(page.getByLabel('v'+version).locator('a')).toBeVisible();
  await page.locator('#pv_id_1_0_2 a').click();
  await page.getByText('Double Take').click();
  await expect(page.locator('#pv_id_1_0_2 a')).toBeVisible();
});
