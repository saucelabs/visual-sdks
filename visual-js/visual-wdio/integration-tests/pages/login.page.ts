import { PAGES } from '../configs/e2e.constants.ts';
import Page from './page.ts';

/**
 * sub page containing specific selectors and methods for a specific page
 */
class LoginPage extends Page {
  constructor() {
    super('#login_button_container');
  }

  /**
   * overwrite specific options to adapt it to page object
   */
  public open() {
    return super.open(PAGES.LOGIN);
  }
}

export default new LoginPage();
