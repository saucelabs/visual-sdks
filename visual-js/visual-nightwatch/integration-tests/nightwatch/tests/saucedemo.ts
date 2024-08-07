import { NightwatchTests } from 'nightwatch';

const home: NightwatchTests = {
  'Check Login Page - clipped': () => {
    browser.url('https://saucedemo.com').sauceVisualCheck('Login page', {
      clipElement: browser.element('input[data-test="login-button"]'),
    });
  },
};

export default home;
