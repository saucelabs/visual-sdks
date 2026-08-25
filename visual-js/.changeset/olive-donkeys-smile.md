---
"@saucelabs/wdio-sauce-visual-service": minor
---

WebdriverIO 9 support

- Requires WebdriverIO 9. `webdriverio`, `@wdio/globals`, `@wdio/logger` and `@wdio/types` are now `peerDependencies` at `^9`, so the service uses the WebdriverIO already in your project rather than installing a second copy.
- The supported Node range is now `^20.19.0 || ^22.12.0 || >=24.0.0`.
- Elements may now be passed as the chainables `$()` and `$$()` return — in `ignore`, `regions[].element`, `clipElement` and `fullPage.scrollElement` — and their `elementId` is resolved before the snapshot is sent. Awaited elements are still accepted too, so call sites passing either of those need no changes.
- `ignore`, `regions[].element` and `clipElement` no longer accept an unawaited `Promise<WebdriverIO.Element>` or `Promise<WebdriverIO.Element[]>`. WebdriverIO 9 no longer converts a chainable into an element by awaiting it, so these options take a resolved element or the chainable itself: await the promise at the call site — `ignore: [await page.getBanner()]`, `clipElement: await $('#el').getElement()`. `fullPage.scrollElement` still accepts a promise.
- Annotations in your own code may also need touching: WebdriverIO 9's `$()` is no longer a `Promise`, so `const el: Promise<WebdriverIO.Element> = $('#el')` stops compiling — type it as `ChainablePromiseElement`, or assign `await $('#el').getElement()`.
- Dropped the unused `@wdio/utils` and `exponential-backoff` dependencies.
