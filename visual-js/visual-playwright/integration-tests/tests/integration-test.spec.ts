import { test, expect } from '../custom-test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Swag Labs/);
    await page.waitForLoadState('networkidle');
})

test('loads the login page', async ({ page, sauceVisual }) => {
    await sauceVisual.visualCheck("Before Login");
});
