# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fully implemented single-page note-taking app built with Vue 3 Composition API. Features: add/remove notes via modal, search, sort (newest/oldest), pagination (6 per page), random pastel background colors per note, date stamps, and localStorage persistence.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check (`vue-tsc`) then build for production
- `npm run test:unit` — Run unit tests with Vitest (watch mode)
- `npm run test:unit -- --run` — Run unit tests once (CI mode)
- `npm run test:e2e:dev` — Open Cypress e2e tests against dev server
- `npm run test:e2e` — Run Cypress e2e tests against production build (requires `npm run build` first)
- `npm run lint` — ESLint with auto-fix
- `npm run format` — Prettier formatting for `src/`
- `npm run type-check` — Type-check only (`vue-tsc`)

## Architecture

All application logic lives in two files:

- **`src/stores/notes.ts`** — Pinia setup store holding all state and logic: `notes`, `searchQuery`, `sortOrder`, `currentPage`, computed `filteredAndSorted`/`totalPages`/`paginatedNotes`, `addNote`/`removeNote` actions, and localStorage persistence under key `vue3-notes`. Page size is 6. Note colors are picked from a fixed 8-color pastel palette.
- **`src/App.vue`** — Single component that consumes the store directly. Contains the notes grid, search/sort bar, pagination controls, and the "Add Note" modal rendered via `<Teleport to="body">`. No child components are used.

Other details:
- **Framework:** Vue 3 `<script setup lang="ts">`
- **State:** Pinia setup stores (function-based `defineStore`)
- **Styling:** Tailwind CSS via PostCSS
- **Build:** Vite with `@/` alias → `src/`
- **Testing:** Vitest + jsdom for unit tests; Cypress for e2e. A custom `cy.addNote()` command is defined in `cypress/support/commands.ts`.

## Key Conventions

- Use Vue 3 Composition API (`<script setup>`) — do not use Options API
- Use Pinia setup stores (function-based `defineStore`) rather than options stores
- Unit tests go in `src/components/__tests__/` with `.spec.ts` extension; they test the store directly (no component mounting)
- E2e tests go in `cypress/e2e/` with `.cy.ts` extension
