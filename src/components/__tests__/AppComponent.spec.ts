import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import App from '@/App.vue'
import { useNotesStore } from '@/stores/notes'

function mountApp() {
  localStorage.clear()
  const pinia = createPinia()
  setActivePinia(pinia)
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [pinia] },
  })
  return { wrapper, store: useNotesStore() }
}

function makeNote(overrides: Partial<{ id: string; text: string; color: string; createdAt: Date }> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    text: overrides.text ?? 'Test note',
    color: overrides.color ?? '#FF9EC4',
    createdAt: overrides.createdAt ?? new Date('2024-01-15'),
  }
}

describe('App.vue', () => {
  let wrapper: ReturnType<typeof mountApp>['wrapper']
  let store: ReturnType<typeof useNotesStore>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    ;({ wrapper, store } = mountApp())
  })

  afterEach(() => {
    wrapper.unmount()
    localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Initial render / empty state
  // ---------------------------------------------------------------------------
  describe('initial render', () => {
    it('renders the "Notes" heading', () => {
      expect(wrapper.find('h1').text()).toBe('Notes')
    })

    it('shows "No notes yet" empty state message', () => {
      expect(wrapper.text()).toContain('No notes yet. Click + to add one.')
    })

    it('does not render any note cards', () => {
      expect(wrapper.findAll('[style*="background-color"]')).toHaveLength(0)
    })

    it('does not render pagination controls', () => {
      expect(wrapper.text()).not.toContain('Prev')
      expect(wrapper.text()).not.toContain('Next')
    })
  })

  // ---------------------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------------------
  describe('modal', () => {
    it('modal is not visible initially', () => {
      expect(document.body.querySelector('h2')).toBeNull()
    })

    it('opens the modal when + is clicked', async () => {
      await wrapper.find('button').trigger('click')
      expect(document.body.querySelector('h2')?.textContent).toBe('New Note')
    })

    it('closes the modal when Cancel is clicked', async () => {
      await wrapper.find('button').trigger('click')
      const cancelBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Cancel',
      )
      cancelBtn?.click()
      await nextTick()
      expect(document.body.querySelector('h2')).toBeNull()
    })

    it('closes the modal when the backdrop is clicked', async () => {
      await wrapper.find('button').trigger('click')
      const backdrop = document.body.querySelector('.fixed.inset-0') as HTMLElement
      backdrop?.click()
      await nextTick()
      expect(document.body.querySelector('h2')).toBeNull()
    })

    it('Add Note button is disabled when textarea is empty', async () => {
      await wrapper.find('button').trigger('click')
      const addBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add Note',
      ) as HTMLButtonElement
      expect(addBtn.disabled).toBe(true)
    })

    it('Add Note button is disabled when textarea is only whitespace', async () => {
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = '   '
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      const addBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add Note',
      ) as HTMLButtonElement
      expect(addBtn.disabled).toBe(true)
    })

    it('Add Note button is enabled when textarea has content', async () => {
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Hello'
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      const addBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add Note',
      ) as HTMLButtonElement
      expect(addBtn.disabled).toBe(false)
    })

    it('submitting adds note to store and closes modal', async () => {
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'My note'
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      const addBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add Note',
      ) as HTMLButtonElement
      addBtn.click()
      await nextTick()
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].text).toBe('My note')
      expect(document.body.querySelector('h2')).toBeNull()
    })

    it('textarea is empty when modal reopens after submission', async () => {
      // Open, type, submit
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Some text'
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      const addBtn = Array.from(document.body.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Add Note',
      ) as HTMLButtonElement
      addBtn.click()
      await nextTick()
      // Reopen
      await wrapper.find('button').trigger('click')
      const freshTextarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      expect(freshTextarea.value).toBe('')
    })

    it('Ctrl+Enter in textarea submits the note', async () => {
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Ctrl enter note'
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      textarea.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'Enter', bubbles: true }))
      await nextTick()
      expect(store.notes).toHaveLength(1)
      expect(document.body.querySelector('h2')).toBeNull()
    })

    it('plain Enter does not submit the note', async () => {
      await wrapper.find('button').trigger('click')
      const textarea = document.body.querySelector('textarea') as HTMLTextAreaElement
      textarea.value = 'Plain enter'
      textarea.dispatchEvent(new Event('input'))
      await nextTick()
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      await nextTick()
      expect(document.body.querySelector('h2')).not.toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // Note cards
  // ---------------------------------------------------------------------------
  describe('note cards', () => {
    it('renders one card per paginatedNotes entry', async () => {
      store.notes.push(makeNote({ text: 'a' }), makeNote({ text: 'b' }), makeNote({ text: 'c' }))
      await nextTick()
      expect(wrapper.findAll('[style*="background-color"]')).toHaveLength(3)
    })

    it('displays the note text on each card', async () => {
      store.notes.push(makeNote({ text: 'Test content' }))
      await nextTick()
      expect(wrapper.text()).toContain('Test content')
    })

    it('applies the note color as inline background style', async () => {
      store.notes.push(makeNote({ color: '#87CEEB' }))
      await nextTick()
      const card = wrapper.find('[style*="background-color"]')
      // jsdom normalises hex to rgb
      expect(card.attributes('style')).toContain('rgb(135, 206, 235)')
    })

    it('renders the formatted date on the card', async () => {
      const date = new Date('2024-01-15')
      store.notes.push(makeNote({ createdAt: date }))
      await nextTick()
      expect(wrapper.text()).toContain(date.toDateString())
    })

    it('clicking × removes the note', async () => {
      store.notes.push(makeNote({ text: 'delete me' }))
      await nextTick()
      const deleteBtn = wrapper.find('button.absolute')
      await deleteBtn.trigger('click')
      expect(store.notes).toHaveLength(0)
    })

    it('shows "No notes match your search." when search yields no results', async () => {
      store.notes.push(makeNote({ text: 'apple' }))
      store.searchQuery = 'banana'
      await nextTick()
      expect(wrapper.text()).toContain('No notes match your search.')
    })
  })

  // ---------------------------------------------------------------------------
  // Search & sort
  // ---------------------------------------------------------------------------
  describe('search and sort', () => {
    it('typing in search input updates store.searchQuery', async () => {
      const input = wrapper.find('input[type="text"]')
      await input.setValue('hello')
      expect(store.searchQuery).toBe('hello')
    })

    it('changing searchQuery filters rendered note cards', async () => {
      store.notes.push(makeNote({ text: 'alpha' }), makeNote({ text: 'beta' }))
      store.searchQuery = 'alpha'
      await nextTick()
      expect(wrapper.findAll('[style*="background-color"]')).toHaveLength(1)
    })

    it('sort button shows "Newest first" when sortOrder is newest', () => {
      const sortBtn = wrapper.findAll('button').find((b) => b.text().includes('first'))
      expect(sortBtn?.text()).toContain('Newest first')
    })

    it('sort button shows "Oldest first" when sortOrder is oldest', async () => {
      store.sortOrder = 'oldest'
      await nextTick()
      const sortBtn = wrapper.findAll('button').find((b) => b.text().includes('first'))
      expect(sortBtn?.text()).toContain('Oldest first')
    })

    it('clicking the sort button toggles sortOrder', async () => {
      const sortBtn = wrapper.findAll('button').find((b) => b.text().includes('first'))!
      await sortBtn.trigger('click')
      expect(store.sortOrder).toBe('oldest')
      await sortBtn.trigger('click')
      expect(store.sortOrder).toBe('newest')
    })
  })

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('pagination controls are hidden when totalPages <= 1', async () => {
      for (let i = 0; i < 6; i++) store.notes.push(makeNote())
      await nextTick()
      expect(wrapper.text()).not.toContain('Prev')
    })

    it('pagination controls appear when there are 7 notes', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      await nextTick()
      expect(wrapper.text()).toContain('Prev')
      expect(wrapper.text()).toContain('Next')
    })

    it('Prev button is disabled on page 1', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      await nextTick()
      const prevBtn = wrapper.findAll('button').find((b) => b.text() === 'Prev')!
      expect((prevBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('Next button is disabled on the last page', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      store.currentPage = 2
      await nextTick()
      const nextBtn = wrapper.findAll('button').find((b) => b.text() === 'Next')!
      expect((nextBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('clicking Next increments currentPage', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      await nextTick()
      const nextBtn = wrapper.findAll('button').find((b) => b.text() === 'Next')!
      await nextBtn.trigger('click')
      expect(store.currentPage).toBe(2)
    })

    it('clicking Prev decrements currentPage', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      store.currentPage = 2
      await nextTick()
      const prevBtn = wrapper.findAll('button').find((b) => b.text() === 'Prev')!
      await prevBtn.trigger('click')
      expect(store.currentPage).toBe(1)
    })

    it('page counter shows "1 / 2" for 7 notes', async () => {
      for (let i = 0; i < 7; i++) store.notes.push(makeNote())
      await nextTick()
      expect(wrapper.text()).toContain('1 / 2')
    })
  })
})
