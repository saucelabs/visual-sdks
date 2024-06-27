import { NightwatchTests } from 'nightwatch';

const home: NightwatchTests = {
  'Check Login Page': () => {
    browser.url('https://saucedemo.com').sauceVisualCheck('Login page');
  },
};

export default home;
