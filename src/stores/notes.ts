import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

interface Note {
  id: string
  text: string
  color: string
  createdAt: Date
}

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

const PAGE_SIZE = 6
const STORAGE_KEY = 'vue3-notes'

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { id: string; text: string; color: string; createdAt: string }[]
    return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }))
  } catch {
    return []
  }
}

function saveNotes(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>(loadNotes())
  const searchQuery = ref('')
  const sortOrder = ref<'newest' | 'oldest'>('newest')
  const currentPage = ref(1)

  function addNote(text: string) {
    notes.value.push({
      id: crypto.randomUUID(),
      text,
      color: randomColor(),
      createdAt: new Date(),
    })
    saveNotes(notes.value)
  }

  function removeNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    saveNotes(notes.value)
  }

  const filteredAndSorted = computed(() => {
    const q = searchQuery.value.toLowerCase()
    const filtered = q ? notes.value.filter((n) => n.text.toLowerCase().includes(q)) : notes.value
    return [...filtered].sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime()
      return sortOrder.value === 'newest' ? -diff : diff
    })
  })

  const totalPages = computed(() => Math.ceil(filteredAndSorted.value.length / PAGE_SIZE))

  const paginatedNotes = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE
    return filteredAndSorted.value.slice(start, start + PAGE_SIZE)
  })

  watch([searchQuery, sortOrder], () => {
    currentPage.value = 1
  })

  return {
    notes,
    searchQuery,
    sortOrder,
    currentPage,
    totalPages,
    filteredAndSorted,
    paginatedNotes,
    addNote,
    removeNote,
  }
})
