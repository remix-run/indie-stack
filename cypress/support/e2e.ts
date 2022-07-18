import "@testing-library/cypress/add-commands";
import "./commands";

beforeEach(() => {
  cy.on("uncaught:exception", (err) => {
    // Cypress and React Hydrating the document don't get along
    // for some unknown reason. Hopefully we figure out why eventually
    // so we can remove this.
    if (/hydrat/i.test(err.message)) {
      return false;
    }
  });
});
