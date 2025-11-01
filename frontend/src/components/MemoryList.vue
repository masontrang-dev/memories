<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  memories: Array,
  memoryCount: Number,
  searchInput: String,
  isSearching: Boolean,
})

const emit = defineEmits(['update:search-input', 'search', 'delete', 'clear-search', 'update-memory'])

const editingId = ref(null)
const expandedId = ref(null)
const editText = ref('')
const editTags = ref([])
const newTagInput = ref('')

const hasMemories = computed(() => props.memories && props.memories.length > 0)

function handleSearch() {
  emit('search')
}

function handleKeyPress(e) {
  if (e.key === 'Enter') {
    handleSearch()
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }
}

function getSimilarityPercentage(similarity) {
  return Math.round(similarity * 100)
}

function startEdit(memory) {
  editingId.value = memory.id
  editText.value = memory.text
  editTags.value = [...(memory.tags || [])]
}

function cancelEdit() {
  editingId.value = null
  editText.value = ''
  editTags.value = []
  newTagInput.value = ''
}

function saveEdit(memoryId) {
  emit('update-memory', {
    id: memoryId,
    text: editText.value,
    tags: editTags.value,
  })
  editingId.value = null
}

function removeTag(index) {
  editTags.value.splice(index, 1)
}

function addTag() {
  const newTag = newTagInput.value.trim().toLowerCase()
  if (newTag && !editTags.value.includes(newTag)) {
    editTags.value.push(newTag)
    newTagInput.value = ''
  }
}
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>🧠 Your Memories</h2>
      <p>All your saved memories</p>
    </div>
    <div class="panel-content">
      <div class="search-box">
        <input
          :value="searchInput"
          @input="$emit('update:search-input', $event.target.value)"
          @keypress="handleKeyPress"
          type="text"
          placeholder="Search memories..."
        />
        <button :disabled="isSearching" @click="handleSearch">
          {{ isSearching ? '...' : 'Search' }}
        </button>
      </div>

      <div class="memories-list">
        <div v-if="!hasMemories" class="empty-state">
          <div class="empty-state-icon">🧠</div>
          <p>{{ searchInput ? 'No matching memories found' : 'No memories yet. Start by adding one!' }}</p>
        </div>

        <div v-for="memory in memories" :key="memory.id" class="memory-item">
          <!-- View Mode -->
          <div v-if="editingId !== memory.id">
            <div class="memory-header">
              <!-- Summary View (Collapsed) -->
              <div v-if="expandedId !== memory.id" class="summary-view">
                <div class="memory-summary">{{ memory.summary || memory.text }}</div>
              </div>

              <!-- Full View (Expanded) -->
              <div v-else class="full-view">
                <div class="memory-text">{{ memory.text }}</div>
              </div>

              <!-- Expand/Collapse Button -->
              <button 
                class="expand-toggle-btn"
                @click="expandedId = expandedId === memory.id ? null : memory.id"
                :title="expandedId === memory.id ? 'Collapse' : 'Expand'"
              >
                {{ expandedId === memory.id ? '▼' : '▶' }}
              </button>
            </div>

            <div v-if="memory.tags && memory.tags.length > 0" class="memory-tags">
              <span v-for="tag in memory.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="memory-meta">
              <span class="memory-date">{{ formatDate(memory.createdAt) }}</span>
              <div style="display: flex; gap: 8px; align-items: center">
                <span v-if="memory.similarity !== undefined" class="memory-similarity">
                  {{ getSimilarityPercentage(memory.similarity) }}% match
                </span>
                <button class="edit-btn" @click="startEdit(memory)">Edit</button>
                <button class="delete-btn" @click="$emit('delete', memory.id)">Delete</button>
              </div>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="edit-mode">
            <textarea v-model="editText" class="edit-textarea"></textarea>
            
            <div class="edit-tags">
              <div class="edit-tags-label">Tags</div>
              <div class="edit-tags-display">
                <span v-for="(tag, index) in editTags" :key="index" class="edit-tag">
                  {{ tag }}
                  <button class="tag-remove-btn" @click="removeTag(index)">✕</button>
                </span>
              </div>
              <div class="tag-input-group">
                <input
                  v-model="newTagInput"
                  type="text"
                  placeholder="Add tag..."
                  @keydown.enter="addTag"
                  class="tag-input"
                />
                <button @click="addTag" class="add-tag-btn">+</button>
              </div>
            </div>

            <div class="edit-actions">
              <button class="save-btn" @click="saveEdit(memory.id)">Save</button>
              <button class="cancel-btn" @click="cancelEdit">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="memory-count">{{ memoryCount }} memory{{ memoryCount !== 1 ? 'ies' : '' }} saved</div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  background: white;
  color: #333;
  padding: 20px;
  border-bottom: 1px solid #e5e5e7;
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-header p {
  font-size: 12px;
  color: #999;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d5d5d7;
  border-radius: 8px;
  font-size: 13px;
  background: #f5f5f7;
  color: #333;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #555;
  background: white;
  box-shadow: 0 0 0 2px rgba(85, 85, 85, 0.1);
}

.search-box input::placeholder {
  color: #999;
}

.search-box button {
  padding: 10px 16px;
  background: #555;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-box button:hover:not(:disabled) {
  background: #333;
}

.search-box button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.memories-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.memory-header {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.summary-view,
.full-view {
  flex: 1;
}

.memory-summary {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  word-wrap: break-word;
}

.memory-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.expand-toggle-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 2px;
}

.expand-toggle-btn:hover {
  background: #f0f0f0;
  color: #764ba2;
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag {
  background: #f5f5f7;
  color: #555;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  border: 1px solid #e5e5e7;
}

.memory-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.memory-date {
  font-size: 11px;
}

.memory-similarity {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.edit-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #1976d2;
}

.delete-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #ff5252;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.edit-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  background: white;
  color: #333;
  transition: all 0.2s;
  box-sizing: border-box;
}

.edit-textarea:focus {
  outline: none;
  border-color: #555;
  box-shadow: 0 0 0 2px rgba(85, 85, 85, 0.1);
}

.edit-tags {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-tags-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edit-tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.edit-tag {
  background: #f5f5f7;
  color: #555;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #e5e5e7;
}

.tag-remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 10px;
  opacity: 0.8;
  transition: all 0.2s;
}

.tag-remove-btn:hover {
  opacity: 1;
  color: #555;
}

.tag-input-group {
  display: flex;
  gap: 4px;
}

.tag-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  color: #333;
  transition: all 0.2s;
}

.tag-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.add-tag-btn {
  padding: 4px 8px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.add-tag-btn:hover {
  background: #764ba2;
}

.edit-actions {
  display: flex;
  gap: 6px;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #4caf50;
  color: white;
}

.save-btn:hover {
  background: #45a049;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  gap: 12px;
}

.empty-state-icon {
  font-size: 48px;
  opacity: 0.5;
}

.memory-count {
  font-size: 12px;
  color: #666;
  padding: 8px 0;
  border-top: 1px solid #eee;
  margin-top: auto;
}
</style>
