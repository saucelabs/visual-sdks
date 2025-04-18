import { browser } from '@wdio/globals';
import LoginPage from '../pages/login.page.ts';
import { DiffingMethodSensitivity } from '@saucelabs/visual';

describe('LoginPage', () => {
  beforeEach(async () => {
    await browser.url('');
    await LoginPage.waitForIsShown();
  });

  it('should be able to test loading of login page', async () => {
    await expect(await LoginPage.waitForIsShown()).toBeTruthy();
    await browser.sauceVisualCheck('Before Login');
  });

  it('should be able to pass diffing options', async () => {
    await expect(await LoginPage.waitForIsShown()).toBeTruthy();
    await browser.sauceVisualCheck('Before Login (Diff Settings)', {
      diffingMethodTolerance: {
        minChangeSize: 10,
        color: .05,
        antiAliasing: .4,
        brightness: .1,
      },
      diffingMethodSensitivity: DiffingMethodSensitivity.Low,
    });
  });
});
