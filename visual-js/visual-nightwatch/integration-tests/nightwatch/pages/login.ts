import { PageObjectModel, EnhancedPageObject } from 'nightwatch';

interface LoginPageElements {
  username: { selector: string };
  password: { selector: string };
}

const loginPage: PageObjectModel = {
  url: 'http://www.saucedemo.com',
  elements: {},
};

export default loginPage;

export interface LoginPage extends EnhancedPageObject<LoginPageElements> {}
