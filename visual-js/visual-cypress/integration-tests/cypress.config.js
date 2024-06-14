const { defineConfig } = require('cypress');
const { CypressSauceVisual } = require('@saucelabs/cypress-visual-plugin');

module.exports = defineConfig({
  e2e: {
    saucelabs: {
      region: 'us-west-1',
    },
    specPattern: 'cypress/src/*.cy.ts',
    setupNodeEvents(on, config) {
      CypressSauceVisual.register(on, config);
    },
  },
});
