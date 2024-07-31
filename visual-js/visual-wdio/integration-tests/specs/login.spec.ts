import { browser } from '@wdio/globals';
import LoginPage from '../pages/login.page.ts';

describe('LoginPage', () => {
  beforeEach(async () => {
    await browser.url('');
    await LoginPage.waitForIsShown();
  });

  it('should be able to test loading of login page', async () => {
    await expect(await LoginPage.waitForIsShown()).toBeTruthy();
    await browser.sauceVisualCheck('Before Login');
  });
});
