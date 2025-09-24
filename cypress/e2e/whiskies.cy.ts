/// <reference types="cypress" />

describe('Whiskies - Data Loading Reliability', () => {
  beforeEach(() => {
    cy.visit('/whiskies')
  })

  it('shows list after initial load', () => {
    cy.get('[data-testid="whisky-grid"]').should('exist')
  })

  it('search debounce keeps previous data and shows mini skeleton', () => {
    // Type quickly to trigger debounce and multiple requests
    cy.get('input[placeholder]').first().type('mac')
    cy.get('input[placeholder]').first().clear().type('macallan')

    // Mini skeleton appears while refetching
    cy.get('[data-testid="whisky-skeleton-mini"]').should('exist')

    // Grid remains visible (keep-previous-data)
    cy.get('[data-testid="whisky-grid"]').should('exist')
  })

  it('filters and server-side pagination work', () => {
    cy.get('#countrySelect').select(1, { force: true }) // pick any country
    cy.get('#typeSelect').select(1, { force: true }) // pick any type

    cy.get('#itemsPerPageSelectGrid').select('24')

    // Page info exists
    cy.contains(' / ').should('exist')

    // Grid visible
    cy.get('[data-testid="whisky-grid"]').should('exist')
  })
})
