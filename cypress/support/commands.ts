export {};
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in with a random user. Yields the user and adds an alias to the user
       *
       * @returns {typeof login}
       * @memberof Chainable
       * @example
       *    cy.login()
       */
      login: typeof login;
    }
  }
}

function login() {
  return 'logged in';
}

Cypress.Commands.add('login', login);
