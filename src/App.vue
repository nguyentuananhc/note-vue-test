<script setup lang="ts">
import { ref } from 'vue'
import { useNotesStore } from '@/stores/notes'

const store = useNotesStore()

const isModalOpen = ref(false)
const newNoteText = ref('')

function openModal() {
  newNoteText.value = ''
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function submitNote() {
  const text = newNoteText.value.trim()
  if (!text) return
  store.addNote(text)
  closeModal()
}

function toggleSort() {
  store.sortOrder = store.sortOrder === 'newest' ? 'oldest' : 'newest'
}

function formatDate(date: Date): string {
  return date.toDateString()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-8 px-6">
    <div class="w-full">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Notes</h1>
        <button
          @click="openModal"
          class="w-10 h-10 rounded-full bg-blue-500 text-white text-2xl flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          +
        </button>
      </div>

      <!-- Search + Sort -->
      <div class="flex gap-3 mb-6">
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search notes..."
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          @click="toggleSort"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          {{ store.sortOrder === 'newest' ? 'Newest first' : 'Oldest first' }}
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="store.filteredAndSorted.length === 0"
        class="text-center text-gray-400 py-16"
      >
        {{ store.notes.length === 0 ? 'No notes yet. Click + to add one.' : 'No notes match your search.' }}
      </div>

      <!-- Notes grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="note in store.paginatedNotes"
          :key="note.id"
          class="relative min-h-[150px] rounded-lg p-4 flex flex-col justify-between"
          :style="{ backgroundColor: note.color }"
        >
          <!-- Delete button -->
          <button
            @click="store.removeNote(note.id)"
            class="absolute top-2 right-2 w-7 h-7 rounded-full border-2 border-white/60 text-white/80 flex items-center justify-center hover:border-white hover:text-white transition-colors text-sm leading-none"
          >
            ×
          </button>

          <!-- Note text -->
          <p class="text-gray-800 pr-8 break-words">{{ note.text }}</p>

          <!-- Date stamp -->
          <p class="text-right font-bold text-gray-800 text-sm mt-4">
            {{ formatDate(note.createdAt) }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="store.totalPages > 1"
        class="flex items-center justify-center gap-4 mt-6"
      >
        <button
          @click="store.currentPage--"
          :disabled="store.currentPage === 1"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Prev
        </button>
        <span class="text-sm text-gray-600">
          {{ store.currentPage }} / {{ store.totalPages }}
        </span>
        <button
          @click="store.currentPage++"
          :disabled="store.currentPage === store.totalPages"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>

    </div>
  </div>

  <!-- Add Note Modal -->
  <Teleport to="body">
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 class="text-xl font-bold mb-4">New Note</h2>
        <textarea
          v-model="newNoteText"
          placeholder="Write your note here..."
          class="w-full border border-gray-300 rounded-lg px-4 py-3 h-36 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          @keydown.ctrl.enter="submitNote"
        />
        <div class="flex justify-end gap-3 mt-4">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="submitNote"
            :disabled="!newNoteText.trim()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-40 transition-colors"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
