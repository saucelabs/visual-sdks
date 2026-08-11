---
"@saucelabs/wdio-sauce-visual-service": minor
---

WebdriverIO 9 support

- Requires WebdriverIO 9. `webdriverio`, `@wdio/globals`, `@wdio/logger` and `@wdio/types` are now `peerDependencies` at `^9`, so the service uses the WebdriverIO already in your project rather than installing a second copy.
- The supported Node range is now `^20.19.0 || ^22.12.0 || >=24.0.0`.
- Elements may now be passed as the chainables `$()` and `$$()` return — in `ignore`, `regions[].element`, `clipElement` and `fullPage.scrollElement` — and their `elementId` is resolved before the snapshot is sent. Existing call sites need no changes; awaited elements and `Promise<WebdriverIO.Element>` are still accepted. Only annotations in your own code may need touching: WebdriverIO 9's `$()` is no longer a `Promise`, so `const el: Promise<WebdriverIO.Element> = $('#el')` stops compiling — type it as `ChainablePromiseElement`, or assign `await $('#el').getElement()`.
- Dropped the unused `@wdio/utils` and `exponential-backoff` dependencies.
