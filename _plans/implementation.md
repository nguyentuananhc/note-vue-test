# Vue 3 Note-Taking App — Implementation Plan

## Reference
- Screenshot: https://rwazi-public.s3.amazonaws.com/interview/rwazi-vue-notes-interview.png
- Video: https://rwazi-public.s3.amazonaws.com/interview/vue-notes-interview-project.webm

## UI Design (from screenshot)
- Dark/black outer background, white centered container (~600px wide)
- Header: bold "Notes" title (left) + blue circular "+" button (right)
- 2-column responsive grid of note cards
- Note cards: bright/pastel random background color, note text (top-left), circular "×" delete button (top-right), bold date stamp (bottom-right, format: "Tue Feb 28 2023")
- Search input + sort toggle below header, above the grid
- Pagination controls at the bottom (when notes > 6)

---

## Files to Create / Modify

### 1. `src/stores/notes.ts` ← NEW
Pinia setup store (`defineStore` with function syntax).

**Interface:**
```ts
interface Note {
  id: string       // crypto.randomUUID()
  text: string
  color: string    // from COLORS palette
  createdAt: Date
}
```

**State:**
- `notes: Ref<Note[]>`
- `searchQuery: Ref<string>`
- `sortOrder: Ref<'newest' | 'oldest'>`
- `currentPage: Ref<number>`
- `PAGE_SIZE = 6` (constant)

**Color palette** (matches screenshot):
```ts
const COLORS = [
  '#FF9EC4', // pink
  '#FF6ED8', // hot pink / magenta
  '#87CEEB', // light blue
  '#7DEFF5', // cyan
  '#9B8FE8', // purple
  '#FF8FAB', // salmon / coral
  '#B39DDB', // lavender
  '#F48FB1', // rose
]
```

**Actions:**
- `addNote(text: string)` — creates Note with random color + `new Date()`
- `removeNote(id: string)`

**Computed:**
- `filteredAndSorted` — filter by `searchQuery` (case-insensitive on `text`), sort by `createdAt`
- `totalPages` — `Math.ceil(filteredAndSorted.length / PAGE_SIZE)`
- `paginatedNotes` — current page slice of `filteredAndSorted`

**Side effect:**
- `watch([searchQuery, sortOrder], () => currentPage.value = 1)` — reset page on filter/sort change

---

### 2. `src/App.vue` ← REWRITE (replace scaffold)
`<script setup lang="ts">` using the notes store.

**Template layout:**
```
div.min-h-screen.bg-gray-900              ← dark outer background
  div.max-w-2xl.mx-auto.bg-white.p-6     ← white centered container
    header                                ← "Notes" + "+" button
    div (search + sort bar)               ← search input | sort toggle
    div.grid.grid-cols-2.gap-4            ← 2-col note grid
      div (v-for paginatedNotes)          ← note card (inline, no sub-component)
        span (note text)                  ← top-left
        button ×                          ← top-right circle, calls removeNote
        span (date)                       ← bottom-right, bold
    div (pagination)                      ← prev / page x of y / next
    div (modal overlay)                   ← v-if="isModalOpen"
      textarea + "Add" button + cancel
```

**Note card:**
- `:style="{ backgroundColor: note.color }"` for random bg
- `min-h-[150px]` for card height
- Date formatted via `note.createdAt.toDateString()` → `"Tue Feb 28 2023"`

**Add note modal:**
- `isModalOpen` ref toggled by "+" button
- Textarea (`newNoteText` ref) + "Add Note" submit button
- On submit: `store.addNote(newNoteText)`, reset text, close modal
- Cancel button or click-outside closes modal

**Sort toggle:**
- Single button, cycles `'newest' ↔ 'oldest'`

**Pagination:**
- Only shown when `store.totalPages > 1`
- Prev/Next buttons disabled at boundaries

---

## Implementation Order
1. Create `src/stores/notes.ts`
2. Rewrite `src/App.vue`
3. Run `npm run dev`, open in browser and verify all requirements

## Verification Checklist
- [ ] Add notes → colored cards appear in grid with date stamp
- [ ] Delete note → card removed
- [ ] Search → live filters cards
- [ ] Sort toggle → newest/oldest order changes
- [ ] 7+ notes → pagination controls appear and work
- [ ] Narrow viewport → grid collapses to 1 column (responsive)
- [ ] Random colors → each new note gets a different background
