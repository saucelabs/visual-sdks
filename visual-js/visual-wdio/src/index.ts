import SauceVisualService from './SauceVisualService.js';
import { DiffingMethod } from '@saucelabs/visual';

export { SauceVisualService, DiffingMethod };

// exposing default exports as documented here: https://webdriver.io/docs/customservices/
export default SauceVisualService;
export const launcher = SauceVisualService;
