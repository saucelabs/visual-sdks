import { JestEnvironment } from '@jest/environment';
import { Global } from '@jest/globals';

declare module 'jest-playwright-preset' {
  export class PlaywrightEnvironment extends JestEnvironment {
    global: Global.Global;
  }
  export = PlaywrightEnvironment;
}
