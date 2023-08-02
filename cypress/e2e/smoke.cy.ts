describe('smoke tests', () => {
  it('works', () => {
    cy.visit('/');
    cy.findByText(/welcome to remix!/i);
  });
});
