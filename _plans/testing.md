# Plan: Write Tests for vue3-notes App

## Context
The app is fully implemented (add/remove notes, search, sort, pagination, modal, colors, dates) but has zero test coverage. Vitest + @vue/test-utils and Cypress are already installed. The goal is to add comprehensive unit tests for the Pinia store, component tests for App.vue, and E2E tests in Cypress.

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `src/components/__tests__/notes.spec.ts` | **Create** — Pinia store unit tests |
| `src/components/__tests__/AppComponent.spec.ts` | **Create** — Vue component tests |
| `cypress/e2e/notes.cy.ts` | **Create** — E2E tests |
| `cypress/e2e/example.cy.ts` | **Delete** — stale placeholder |
| `cypress/support/commands.ts` | **Modify** — add `cy.addNote()` custom command |

---

## Part 1: Store Unit Tests (`notes.spec.ts`)

Setup: `setActivePinia(createPinia())` in `beforeEach`. Use `vi.useFakeTimers()` + `vi.setSystemTime(fixedDate)` for date control; clean up with `vi.useRealTimers()` in `afterEach`. Use `vi.spyOn(crypto, 'randomUUID')` for deterministic IDs.

Test groups and cases:

**`addNote`**
- adds a note with the correct text
- assigns the mocked UUID as id
- assigns a `createdAt` equal to the fake system time
- assigns a color from the known 8-color `COLORS` palette
- appends multiple notes in insertion order

**`removeNote`**
- removes the correct note by id
- is a no-op when id doesn't exist
- results in an empty array when the last note is removed

**`filteredAndSorted` — filtering**
- returns all notes when `searchQuery` is empty
- filters case-insensitively
- returns empty array when nothing matches
- is reactive (re-filters when `searchQuery` changes)

**`filteredAndSorted` — sorting**
- newest-first by default (push notes with explicit `createdAt`)
- oldest-first when `sortOrder = 'oldest'`

**`totalPages`**
- 0 for empty
- 1 for 1–6 notes
- 2 for 7 notes
- reflects filtered count, not raw `notes.length`

**`paginatedNotes`**
- page 1 returns first 6
- page 2 returns remainder
- returns `[]` when `currentPage` exceeds `totalPages`

**watcher**
- resets `currentPage` to 1 when `searchQuery` changes (`await nextTick()`)
- resets `currentPage` to 1 when `sortOrder` changes
- does NOT reset `currentPage` when only `notes` array changes

---

## Part 2: Component Tests (`AppComponent.spec.ts`)

Setup: `mount(App, { attachTo: document.body, global: { plugins: [pinia] } })`. Call `wrapper.unmount()` in `afterEach`. Teleport renders into `document.body` — use `document.body.querySelector(...)` for modal assertions.

**Initial render / empty state**
- renders `<h1>` with "Notes"
- shows "No notes yet. Click + to add one."
- no note cards rendered
- no pagination rendered

**Modal**
- modal not visible initially
- `+` button opens modal (assert "New Note" heading in `document.body`)
- Cancel closes modal
- backdrop click closes modal (trigger click on outer fixed div, not inner card)
- clicking inside modal card does not close it
- Add Note button is disabled when textarea is empty
- Add Note button is disabled when textarea is only whitespace (tests `:disabled="!newNoteText.trim()"`)
- Add Note button is enabled when textarea has content
- submitting adds note to store and closes modal
- textarea is empty when modal reopens
- `Ctrl+Enter` in textarea calls `submitNote` (trigger `keydown` with `{ ctrlKey: true, key: 'Enter' }`)

**Note cards**
- one card per `paginatedNotes` entry
- card `<p>` contains note text
- card background style matches `note.color`
- card footer contains formatted date (`toDateString()`)
- clicking `×` calls `store.removeNote` with correct id

**Search & sort**
- search input `v-model` updates `store.searchQuery`
- changing `searchQuery` filters rendered cards
- sort button text is "Newest first" when `sortOrder === 'newest'`
- sort button text is "Oldest first" when `sortOrder === 'oldest'`
- clicking sort button toggles `store.sortOrder`
- "No notes match your search." message shown when filtered list is empty

**Pagination**
- controls hidden when `totalPages <= 1`
- controls shown when `totalPages > 1` (seed 7 notes directly into `store.notes`)
- Prev disabled on page 1
- Next disabled on last page
- clicking Next increments `store.currentPage`
- clicking Prev decrements `store.currentPage`
- page counter text is `"1 / 2"` for 7 notes

---

## Part 3: E2E Tests (`notes.cy.ts`)

Add custom command in `commands.ts`:
```typescript
Cypress.Commands.add('addNote', (text: string) => {
  cy.contains('button', '+').click()
  cy.get('textarea').type(text)
  cy.contains('button', 'Add Note').click()
})
// declare in Chainable interface: addNote(text: string): Chainable<void>
```

Each `describe` block uses `beforeEach(() => cy.visit('/'))` — page reload resets in-memory store.

**Initial state**
- `h1` contains "Notes"
- empty state message visible
- modal not present

**Adding notes**
- `+` button opens modal
- Add Note button disabled with empty textarea
- typing and clicking Add Note creates a card
- card shows today's `toDateString()` date
- `{ctrl+enter}` submits the note
- textarea is empty when modal reopens
- Cancel does not add a note

**Deleting notes**
- `×` removes the note and shows empty state
- deletes correct note when multiple exist

**Search**
- typing in search filters cards
- no-results message shown when query matches nothing
- clearing search restores all cards
- search is case-insensitive

**Sort order**
- button shows "Newest first" by default
- toggles to "Oldest first" on click
- newest note appears first by default
- after toggle, oldest appears first (use `cy.clock()` to give each note a different timestamp)

**Pagination**
- no Prev/Next with ≤ 6 notes
- Prev/Next appear with 7 notes
- Prev disabled on page 1
- Next disabled on last page
- clicking Next navigates to page 2
- page counter shows "1 / 2"
- typing a search query resets to page 1

---

## Tricky Implementation Notes

- **`crypto.randomUUID` in Vitest/jsdom**: spy with `vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('uuid-1')`
- **Date mocking in store**: use `vi.useFakeTimers()` + `vi.setSystemTime(new Date('2024-01-15'))`; or push directly to `store.notes` with literal `createdAt` dates for sort tests
- **Watcher is async**: `import { nextTick } from 'vue'` and `await nextTick()` before asserting `currentPage`
- **Teleport in component tests**: `attachTo: document.body` in mount options; `document.body.querySelector(...)` for modal DOM
- **`@pinia/testing` not installed**: use standard `createPinia()` only
- **Sort in E2E**: add notes with `cy.clock()` to control timestamps, or accept DOM-order assertion within the same second

---

## Verification

1. **Unit tests**: `npm run test:unit` — all suites pass with no errors
2. **Component tests**: same command (Vitest picks up all `*.spec.ts` under `src/`)
3. **E2E (dev)**: `npm run dev` in one terminal, `npm run test:e2e:dev` in another — all Cypress specs pass
4. **Type-check**: `npm run type-check` — no TypeScript errors in test files
