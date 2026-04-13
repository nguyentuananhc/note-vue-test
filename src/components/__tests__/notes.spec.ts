import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useNotesStore } from '@/stores/notes'

const COLORS = [
  '#FF9EC4',
  '#FF6ED8',
  '#87CEEB',
  '#7DEFF5',
  '#9B8FE8',
  '#FF8FAB',
  '#B39DDB',
  '#F48FB1',
]

const FIXED_DATE = new Date('2024-01-15T12:00:00.000Z')

describe('useNotesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_DATE)
  })

  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // addNote
  // ---------------------------------------------------------------------------
  describe('addNote', () => {
    it('adds a note with the provided text', () => {
      const store = useNotesStore()
      store.addNote('Hello')
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].text).toBe('Hello')
    })

    it('assigns the mocked UUID as id', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('test-uuid' as `${string}-${string}-${string}-${string}-${string}`)
      const store = useNotesStore()
      store.addNote('Hello')
      expect(store.notes[0].id).toBe('test-uuid')
    })

    it('assigns a createdAt equal to the fake system time', () => {
      const store = useNotesStore()
      store.addNote('Hello')
      expect(store.notes[0].createdAt).toEqual(FIXED_DATE)
    })

    it('assigns a color from the allowed palette', () => {
      const store = useNotesStore()
      store.addNote('Hello')
      expect(COLORS).toContain(store.notes[0].color)
    })

    it('appends multiple notes in insertion order', () => {
      const store = useNotesStore()
      store.addNote('first')
      store.addNote('second')
      expect(store.notes[0].text).toBe('first')
      expect(store.notes[1].text).toBe('second')
    })
  })

  // ---------------------------------------------------------------------------
  // removeNote
  // ---------------------------------------------------------------------------
  describe('removeNote', () => {
    it('removes the correct note by id', () => {
      vi.spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce('a' as `${string}-${string}-${string}-${string}-${string}`)
        .mockReturnValueOnce('b' as `${string}-${string}-${string}-${string}-${string}`)
      const store = useNotesStore()
      store.addNote('first')
      store.addNote('second')
      store.removeNote('a')
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].id).toBe('b')
    })

    it('is a no-op when id does not exist', () => {
      const store = useNotesStore()
      store.addNote('hello')
      store.removeNote('nonexistent')
      expect(store.notes).toHaveLength(1)
    })

    it('results in an empty array when the last note is removed', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('a' as `${string}-${string}-${string}-${string}-${string}`)
      const store = useNotesStore()
      store.addNote('only note')
      store.removeNote('a')
      expect(store.notes).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------
  // filteredAndSorted — filtering
  // ---------------------------------------------------------------------------
  describe('filteredAndSorted — filtering', () => {
    it('returns all notes when searchQuery is empty', () => {
      const store = useNotesStore()
      store.addNote('alpha')
      store.addNote('beta')
      store.addNote('gamma')
      expect(store.filteredAndSorted).toHaveLength(3)
    })

    it('filters notes by searchQuery case-insensitively', () => {
      const store = useNotesStore()
      store.addNote('Hello World')
      store.addNote('foo bar')
      store.addNote('HELLO again')
      store.searchQuery = 'hello'
      expect(store.filteredAndSorted).toHaveLength(2)
      const texts = store.filteredAndSorted.map((n) => n.text)
      expect(texts).toContain('Hello World')
      expect(texts).toContain('HELLO again')
    })

    it('returns an empty array when no notes match the query', () => {
      const store = useNotesStore()
      store.addNote('Vue')
      store.searchQuery = 'React'
      expect(store.filteredAndSorted).toHaveLength(0)
    })

    it('is reactive: updates filteredAndSorted when searchQuery changes', () => {
      const store = useNotesStore()
      store.addNote('hello')
      store.searchQuery = 'xyz'
      expect(store.filteredAndSorted).toHaveLength(0)
      store.searchQuery = ''
      expect(store.filteredAndSorted).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // filteredAndSorted — sorting
  // ---------------------------------------------------------------------------
  describe('filteredAndSorted — sorting', () => {
    it('sorts newest first by default', () => {
      const store = useNotesStore()
      store.notes.push(
        { id: '1', text: 'oldest', color: '#fff', createdAt: new Date('2024-01-01') },
        { id: '2', text: 'middle', color: '#fff', createdAt: new Date('2024-01-02') },
        { id: '3', text: 'newest', color: '#fff', createdAt: new Date('2024-01-03') },
      )
      expect(store.filteredAndSorted[0].text).toBe('newest')
    })

    it('sorts oldest first when sortOrder is "oldest"', () => {
      const store = useNotesStore()
      store.notes.push(
        { id: '1', text: 'oldest', color: '#fff', createdAt: new Date('2024-01-01') },
        { id: '2', text: 'middle', color: '#fff', createdAt: new Date('2024-01-02') },
        { id: '3', text: 'newest', color: '#fff', createdAt: new Date('2024-01-03') },
      )
      store.sortOrder = 'oldest'
      expect(store.filteredAndSorted[0].text).toBe('oldest')
    })
  })

  // ---------------------------------------------------------------------------
  // totalPages
  // ---------------------------------------------------------------------------
  describe('totalPages', () => {
    it('returns 0 when no notes exist', () => {
      const store = useNotesStore()
      expect(store.totalPages).toBe(0)
    })

    it('returns 1 for 1 to 6 notes', () => {
      const store = useNotesStore()
      for (let i = 0; i < 6; i++) store.addNote(`note ${i}`)
      expect(store.totalPages).toBe(1)
    })

    it('returns 2 for 7 notes', () => {
      const store = useNotesStore()
      for (let i = 0; i < 7; i++) store.addNote(`note ${i}`)
      expect(store.totalPages).toBe(2)
    })

    it('returns 2 for 12 notes', () => {
      const store = useNotesStore()
      for (let i = 0; i < 12; i++) store.addNote(`note ${i}`)
      expect(store.totalPages).toBe(2)
    })

    it('reflects filtered count, not total notes count', () => {
      const store = useNotesStore()
      for (let i = 0; i < 7; i++) store.addNote('alpha')
      store.addNote('beta')
      store.searchQuery = 'beta'
      expect(store.totalPages).toBe(1)
    })
  })

  // ---------------------------------------------------------------------------
  // paginatedNotes
  // ---------------------------------------------------------------------------
  describe('paginatedNotes', () => {
    it('returns the first 6 notes on page 1', () => {
      const store = useNotesStore()
      for (let i = 0; i < 8; i++) store.addNote(`note ${i}`)
      expect(store.paginatedNotes).toHaveLength(6)
    })

    it('returns the remaining notes on page 2', () => {
      const store = useNotesStore()
      for (let i = 0; i < 8; i++) store.addNote(`note ${i}`)
      store.currentPage = 2
      expect(store.paginatedNotes).toHaveLength(2)
    })

    it('returns an empty array when currentPage exceeds totalPages', () => {
      const store = useNotesStore()
      for (let i = 0; i < 6; i++) store.addNote(`note ${i}`)
      store.currentPage = 2
      expect(store.paginatedNotes).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------
  // watcher: currentPage reset
  // ---------------------------------------------------------------------------
  describe('watcher — currentPage reset', () => {
    it('resets currentPage to 1 when searchQuery changes', async () => {
      const store = useNotesStore()
      for (let i = 0; i < 7; i++) store.addNote(`note ${i}`)
      store.currentPage = 2
      store.searchQuery = 'note'
      await nextTick()
      expect(store.currentPage).toBe(1)
    })

    it('resets currentPage to 1 when sortOrder changes', async () => {
      const store = useNotesStore()
      for (let i = 0; i < 7; i++) store.addNote(`note ${i}`)
      store.currentPage = 2
      store.sortOrder = 'oldest'
      await nextTick()
      expect(store.currentPage).toBe(1)
    })

    it('does NOT reset currentPage when only notes array changes', async () => {
      const store = useNotesStore()
      for (let i = 0; i < 12; i++) store.addNote(`note ${i}`)
      store.currentPage = 2
      store.addNote('extra note')
      await nextTick()
      expect(store.currentPage).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // localStorage persistence
  // ---------------------------------------------------------------------------
  describe('localStorage persistence', () => {
    it('persists notes to localStorage when a note is added', () => {
      const store = useNotesStore()
      store.addNote('persisted note')
      const raw = localStorage.getItem('vue3-notes')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].text).toBe('persisted note')
    })

    it('persists notes to localStorage when a note is removed', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('a' as `${string}-${string}-${string}-${string}-${string}`)
      const store = useNotesStore()
      store.addNote('to remove')
      store.removeNote('a')
      const parsed = JSON.parse(localStorage.getItem('vue3-notes')!)
      expect(parsed).toHaveLength(0)
    })

    it('serialises createdAt as an ISO string', () => {
      const store = useNotesStore()
      store.addNote('date test')
      const parsed = JSON.parse(localStorage.getItem('vue3-notes')!)
      expect(typeof parsed[0].createdAt).toBe('string')
      expect(new Date(parsed[0].createdAt).getTime()).toBe(FIXED_DATE.getTime())
    })

    it('loads existing notes from localStorage on store initialisation', () => {
      // Pre-seed localStorage before the store is created
      const seed = [
        { id: 'seed-1', text: 'loaded note', color: '#FF9EC4', createdAt: FIXED_DATE.toISOString() },
      ]
      localStorage.setItem('vue3-notes', JSON.stringify(seed))
      setActivePinia(createPinia())
      const store = useNotesStore()
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].text).toBe('loaded note')
    })

    it('restores createdAt as a Date object (not a string)', () => {
      const seed = [
        { id: 'seed-1', text: 'date check', color: '#87CEEB', createdAt: FIXED_DATE.toISOString() },
      ]
      localStorage.setItem('vue3-notes', JSON.stringify(seed))
      setActivePinia(createPinia())
      const store = useNotesStore()
      expect(store.notes[0].createdAt).toBeInstanceOf(Date)
      expect(store.notes[0].createdAt.getTime()).toBe(FIXED_DATE.getTime())
    })

    it('starts with empty notes when localStorage is empty', () => {
      const store = useNotesStore()
      expect(store.notes).toHaveLength(0)
    })

    it('recovers gracefully when localStorage contains invalid JSON', () => {
      localStorage.setItem('vue3-notes', 'not valid json')
      setActivePinia(createPinia())
      const store = useNotesStore()
      expect(store.notes).toHaveLength(0)
    })
  })
})
