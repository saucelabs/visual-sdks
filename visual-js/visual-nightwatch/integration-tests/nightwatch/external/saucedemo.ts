import { NightwatchTests } from 'nightwatch';

/*
 * The assertions for this test are located in the tests folder at the project root. Modify accordingly.
 */
const home: NightwatchTests = {
  'Check Login Page': () => {
    browser.url('https://saucedemo.com').sauceVisualCheck('Login page');
  },
};

export default home;
