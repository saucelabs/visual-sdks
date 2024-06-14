describe('Sauce Visual Demo', () => {
  it('should be able to open the login page', () => {
    openSauceDemoPage();
    cy.get('.login_container').should('be.visible');
    cy.sauceVisualCheck('Before Login', {});
  });

  function openSauceDemoPage() {
    // service workers can break Cypress (https://github.com/cypress-io/cypress/issues/16192)
    cy.intercept('/service-worker.js', { body: undefined });
    cy.visit('https://www.saucedemo.com/');
  }
});
