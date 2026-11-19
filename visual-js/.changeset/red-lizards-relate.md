---
"@saucelabs/visual": minor
"@saucelabs/wdio-sauce-visual-service": minor
"@saucelabs/cypress-visual-plugin": minor
"@saucelabs/nightwatch-sauce-visual-service": minor
"@saucelabs/visual-playwright": minor
"@saucelabs/visual-storybook": minor
---

Add the `buildFinishDelay` option: seconds to keep a build open after it's finished, so other runs with the same `customId` can still add snapshots. It requires a `customId`. Nightwatch now creates its build with `SAUCE_VISUAL_CUSTOM_ID`. Playwright and Storybook now refuse to join a completed build.
