/// <reference types="cypress" />

Cypress.Commands.add('addNote', (text: string) => {
  cy.contains('button', '+').click()
  cy.get('textarea').type(text)
  cy.contains('button', 'Add Note').click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      addNote(text: string): Chainable<void>
    }
  }
}

export {}
