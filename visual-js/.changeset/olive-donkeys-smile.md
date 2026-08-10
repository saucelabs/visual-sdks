---
"@saucelabs/wdio-sauce-visual-service": minor
---

WebdriverIO 9 support

- Upgrade `webdriverio`, `@wdio/globals`, `@wdio/logger` and `@wdio/types` from pinned 8.x to `^9`, replacing the removed `RemoteCapability`/`RemoteCapabilities` types with `RequestedStandaloneCapabilities`/`TestrunnerCapabilities`.
- Drop the unused `@wdio/utils` and `exponential-backoff` dependencies.
- Raise the supported Node range to `^20.19.0 || ^22.12.0 || >=24.0.0`. Node 16 and 18 are end-of-life and WebdriverIO 9 requires Node >= 18.20.
- Accept the chainables returned by `$()` and `$$()` everywhere an element is taken: `ignore`, `regions[].element`, `clipElement` and `fullPage.scrollElement`, on both `sauceVisualCheck()` and the service options. In WebdriverIO 9 those chainables are no longer typed as promises, so `element: $('#selector')` did not compile without an explicit `.getElement()`.
- Fix `clipElement` dropping a pending promise into the snapshot payload when given a WebdriverIO 9 chainable: its `elementId` is only available once the chainable resolves, and it was read synchronously.
