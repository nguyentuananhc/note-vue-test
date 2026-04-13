describe('Notes App', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
  })

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  describe('initial state', () => {
    it('displays the "Notes" heading', () => {
      cy.get('h1').should('contain', 'Notes')
    })

    it('shows the empty state message on first visit', () => {
      cy.contains('No notes yet. Click + to add one.').should('be.visible')
    })

    it('modal is not visible on load', () => {
      cy.contains('New Note').should('not.exist')
    })
  })

  // ---------------------------------------------------------------------------
  // Adding notes
  // ---------------------------------------------------------------------------
  describe('adding notes', () => {
    it('opens the modal when + is clicked', () => {
      cy.contains('button', '+').click()
      cy.contains('New Note').should('be.visible')
    })

    it('Add Note button is disabled when textarea is empty', () => {
      cy.contains('button', '+').click()
      cy.contains('button', 'Add Note').should('be.disabled')
    })

    it('typing and clicking Add Note creates a note card', () => {
      cy.addNote('My first note')
      cy.contains('My first note').should('be.visible')
    })

    it('note card shows today\'s date', () => {
      cy.addNote('dated note')
      cy.contains(new Date().toDateString()).should('be.visible')
    })

    it('Ctrl+Enter submits the note', () => {
      cy.contains('button', '+').click()
      cy.get('textarea').type('ctrl enter note')
      cy.get('textarea').type('{ctrl+enter}')
      cy.contains('ctrl enter note').should('be.visible')
      cy.contains('New Note').should('not.exist')
    })

    it('textarea is empty when modal reopens after submission', () => {
      cy.addNote('first note')
      cy.contains('button', '+').click()
      cy.get('textarea').should('have.value', '')
    })

    it('Cancel does not add a note', () => {
      cy.contains('button', '+').click()
      cy.get('textarea').type('draft text')
      cy.contains('button', 'Cancel').click()
      cy.contains('draft text').should('not.exist')
      cy.contains('No notes yet. Click + to add one.').should('be.visible')
    })
  })

  // ---------------------------------------------------------------------------
  // Closing the modal
  // ---------------------------------------------------------------------------
  describe('closing the modal', () => {
    it('closes the modal when clicking the backdrop', () => {
      cy.contains('button', '+').click()
      cy.get('.fixed.inset-0').click({ force: true })
      cy.contains('New Note').should('not.exist')
    })
  })

  // ---------------------------------------------------------------------------
  // Deleting notes
  // ---------------------------------------------------------------------------
  describe('deleting notes', () => {
    it('× button removes the note and shows empty state', () => {
      cy.addNote('delete me')
      cy.get('button.absolute').click()
      cy.contains('No notes yet. Click + to add one.').should('be.visible')
    })

    it('deletes the correct note when multiple exist', () => {
      cy.addNote('Keep this')
      cy.addNote('Delete this')
      cy.contains('Delete this').parents('[style*="background-color"]').find('button.absolute').click()
      cy.contains('Keep this').should('be.visible')
      cy.contains('Delete this').should('not.exist')
    })
  })

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------
  describe('search', () => {
    beforeEach(() => {
      cy.addNote('Apple pie')
      cy.addNote('Banana split')
    })

    it('filters note cards as the user types', () => {
      cy.get('input[placeholder="Search notes..."]').type('apple')
      cy.contains('Apple pie').should('be.visible')
      cy.contains('Banana split').should('not.exist')
    })

    it('shows no-results message when query matches nothing', () => {
      cy.get('input[placeholder="Search notes..."]').type('mango')
      cy.contains('No notes match your search.').should('be.visible')
    })

    it('restores all cards when search is cleared', () => {
      cy.get('input[placeholder="Search notes..."]').type('apple').clear()
      cy.contains('Apple pie').should('be.visible')
      cy.contains('Banana split').should('be.visible')
    })

    it('search is case-insensitive', () => {
      cy.get('input[placeholder="Search notes..."]').type('APPLE')
      cy.contains('Apple pie').should('be.visible')
    })
  })

  // ---------------------------------------------------------------------------
  // Sort order
  // ---------------------------------------------------------------------------
  describe('sort order', () => {
    it('sort button shows "Newest first" by default', () => {
      cy.contains('button', 'Newest first').should('be.visible')
    })

    it('toggles to "Oldest first" on click', () => {
      cy.contains('button', 'Newest first').click()
      cy.contains('button', 'Oldest first').should('be.visible')
    })

    it('newest note appears first by default', () => {
      cy.clock()
      cy.tick(0)
      cy.addNote('First note')
      cy.tick(1000)
      cy.addNote('Second note')
      cy.get('[style*="background-color"]').first().should('contain', 'Second note')
    })

    it('oldest note appears first after toggling sort', () => {
      cy.clock()
      cy.tick(0)
      cy.addNote('First note')
      cy.tick(1000)
      cy.addNote('Second note')
      cy.contains('button', 'Newest first').click()
      cy.get('[style*="background-color"]').first().should('contain', 'First note')
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('pagination controls are not shown with 6 or fewer notes', () => {
      for (let i = 1; i <= 6; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Prev').should('not.exist')
      cy.contains('button', 'Next').should('not.exist')
    })

    it('pagination controls appear when 7th note is added', () => {
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Prev').should('be.visible')
      cy.contains('button', 'Next').should('be.visible')
    })

    it('"Prev" is disabled on page 1', () => {
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Prev').should('be.disabled')
    })

    it('"Next" is disabled on the last page', () => {
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Next').click()
      cy.contains('button', 'Next').should('be.disabled')
    })

    it('clicking Next shows page 2 content', () => {
      // Add 7 notes — with newest-first sort, the 7th added is on page 1
      // oldest note ends up on page 2; add it first so it's pushed to page 2
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Newest first').click() // oldest first
      cy.contains('button', 'Next').click()
      cy.contains('Note 7').should('be.visible')
    })

    it('page counter reads "1 / 2" for 7 notes', () => {
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('1 / 2').should('be.visible')
    })

    it('typing a search query resets to page 1', () => {
      for (let i = 1; i <= 7; i++) cy.addNote(`Note ${i}`)
      cy.contains('button', 'Next').click()
      cy.contains('2 / 2').should('be.visible')
      cy.get('input[placeholder="Search notes..."]').type('Note')
      cy.contains('1 /').should('be.visible')
    })
  })
})
