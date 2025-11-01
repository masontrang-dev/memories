<script setup>
import { ref } from "vue";
import ConfirmationModal from "./ConfirmationModal.vue";

const props = defineProps({
  isBuilding: Boolean,
  isReviewing: Boolean,
  currentMemory: String,
  memoryHistory: Array,
  llmResponse: String,
  summarizedMemory: String,
  generatedTags: Array,
  generatedPrompt: String,
  isLoading: Boolean,
  detectedTheme: String,
  availableThemes: Object,
});

const emit = defineEmits([
  "start",
  "add-detail",
  "finish",
  "confirm",
  "edit",
  "cancel",
  "update:generatedTags",
  "update:detectedTheme",
  "generate-prompt",
]);

const initialInput = ref("");
const detailInput = ref("");
const usePrompt = ref(false);
const isGeneratingPrompt = ref(false);
const promptSelected = ref(false);
const showCancelConfirm = ref(false);

function handleCancelClick() {
  showCancelConfirm.value = true;
}

function confirmCancel() {
  showCancelConfirm.value = false;
  emit("cancel");
}

function rejectCancel() {
  showCancelConfirm.value = false;
}

function handleStart() {
  const text = initialInput.value.trim();
  if (text) {
    emit("start", text);
    initialInput.value = "";
  }
}

function handleAddDetail() {
  const text = detailInput.value.trim();
  if (text) {
    emit("add-detail", text);
    detailInput.value = "";
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (props.isBuilding) {
      handleAddDetail();
    } else if (!usePrompt.value) {
      handleStart();
    }
  }
}

async function generatePrompt() {
  isGeneratingPrompt.value = true;
  emit("generate-prompt");
}
</script>

<template>
  <div class="builder-panel">
    <div class="panel-header">
      <h1>📚 Memory Builder</h1>
      <p>Start with a memory, then let the AI help you expand it</p>
    </div>

    <div class="panel-content">
      <!-- Review State -->
      <div v-if="isReviewing" class="review-state">
        <div class="review-header">
          <h2>✨ Review Your Memory</h2>
          <p>
            Here's how your memory has been summarized. You can edit it or save
            it.
          </p>
        </div>

        <div class="summarized-box">
          <p>{{ summarizedMemory }}</p>
        </div>

        <!-- Tags Section -->
        <div
          v-if="generatedTags && generatedTags.length > 0"
          class="tags-section"
        >
          <div class="tags-label">Tags</div>
          <div class="tags-edit">
            <div class="tags-display">
              <span
                v-for="(tag, index) in generatedTags"
                :key="index"
                class="tag-item"
              >
                {{ tag }}
                <button
                  class="tag-remove"
                  @click="
                    $emit(
                      'update:generatedTags',
                      generatedTags.filter((_, i) => i !== index)
                    )
                  "
                >
                  ✕
                </button>
              </span>
            </div>
            <input
              type="text"
              placeholder="Add tag..."
              @keypress.enter="
                (e) => {
                  const newTag = e.target.value.trim().toLowerCase();
                  if (newTag && !generatedTags.includes(newTag)) {
                    $emit('update:generatedTags', [...generatedTags, newTag]);
                  }
                  e.target.value = '';
                }
              "
              class="tag-input"
            />
          </div>
        </div>

        <!-- Theme Detection Section -->
        <div v-if="detectedTheme && availableThemes" class="theme-section">
          <div class="theme-label">Memory Type</div>
          <select
            :value="detectedTheme"
            @change="$emit('update:detectedTheme', $event.target.value)"
            class="theme-select"
          >
            <option
              v-for="(theme, id) in availableThemes"
              :key="id"
              :value="id"
            >
              {{ theme.name }}
            </option>
          </select>
          <p class="theme-hint">
            {{ availableThemes[detectedTheme]?.description }}
          </p>
        </div>

        <div class="review-buttons">
          <button
            @click="$emit('confirm')"
            class="confirm-btn"
            :disabled="isLoading"
          >
            {{ isLoading ? "Saving..." : "💾 Save Memory" }}
          </button>
          <button @click="$emit('edit')" class="edit-btn" :disabled="isLoading">
            ✏️ Edit & Add More
          </button>
          <button
            @click="handleCancelClick"
            class="cancel-btn"
            :disabled="isLoading"
          >
            ✕ Cancel
          </button>
        </div>
      </div>

      <!-- Initial Memory Input -->
      <div v-else-if="!isBuilding" class="initial-state">
        <!-- Toggle between scratch and prompt -->
        <div class="mode-toggle">
          <button
            :class="['toggle-btn', { active: !usePrompt }]"
            @click="usePrompt = false"
          >
            ✍️ Build from Scratch
          </button>
          <button
            :class="['toggle-btn', { active: usePrompt }]"
            @click="usePrompt = true"
          >
            💡 Start with Prompt
          </button>
        </div>

        <!-- Build from Scratch -->
        <div v-if="!usePrompt" class="scratch-mode">
          <div class="prompt-box">
            <p>Share a memory that's meaningful to you...</p>
          </div>

          <textarea
            v-model="initialInput"
            @keypress="handleKeyPress"
            placeholder="E.g., 'I remember playing in the park with my best friend...'"
            class="memory-input"
          ></textarea>

          <button
            @click="handleStart"
            class="start-btn"
            :disabled="!initialInput.trim()"
          >
            Start Building
          </button>
        </div>

        <!-- Start with Prompt -->
        <div v-else class="prompt-mode">
          <!-- Prompt Selection Phase -->
          <div v-if="!promptSelected" class="prompt-selection">
            <div class="prompt-box">
              <p>Get an AI-generated prompt to spark your memory...</p>
            </div>

            <div v-if="generatedPrompt" class="generated-prompt">
              <p>{{ generatedPrompt }}</p>
            </div>

            <div class="prompt-actions">
              <button
                @click="generatePrompt"
                class="generate-btn"
                :disabled="isGeneratingPrompt || isLoading"
              >
                {{
                  isGeneratingPrompt ? "Generating..." : "✨ Generate Prompt"
                }}
              </button>
              <button
                v-if="generatedPrompt"
                @click="
                  () => {
                    promptSelected = true;
                  }
                "
                class="use-prompt-btn"
                :disabled="isLoading"
              >
                Use This Prompt
              </button>
            </div>
          </div>

          <!-- Memory Input Phase -->
          <div v-else class="prompt-input">
            <div class="prompt-box">
              <p>{{ generatedPrompt }}</p>
            </div>

            <textarea
              v-model="initialInput"
              @keypress="handleKeyPress"
              placeholder="Share your memory in response to this prompt..."
              class="memory-input"
            ></textarea>

            <div class="input-actions">
              <button
                @click="handleStart"
                class="start-btn"
                :disabled="!initialInput.trim()"
              >
                Start Building
              </button>
              <button
                @click="
                  () => {
                    promptSelected = false;
                    generatedPrompt = '';
                  }
                "
                class="back-btn"
              >
                ← Back to Prompts
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory Building State -->
      <div v-else class="building-state">
        <!-- Memory History -->
        <div class="memory-history">
          <div class="history-title">Your Memory So Far:</div>
          <div class="history-content">
            <p
              v-for="(item, index) in memoryHistory"
              :key="index"
              class="history-item"
            >
              {{ item }}
            </p>
          </div>
        </div>

        <!-- LLM Follow-up Question -->
        <div class="llm-section">
          <div class="llm-avatar">🤖</div>
          <div class="llm-message">
            <p v-if="isLoading" class="loading">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </p>
            <p v-else>{{ llmResponse }}</p>
          </div>
        </div>

        <!-- Detail Input -->
        <textarea
          v-model="detailInput"
          @keypress="handleKeyPress"
          placeholder="Share more details..."
          class="detail-input"
          :disabled="isLoading"
        ></textarea>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button
            @click="handleAddDetail"
            class="add-detail-btn"
            :disabled="!detailInput.trim() || isLoading"
          >
            {{ isLoading ? "Thinking..." : "Add Detail" }}
          </button>
          <button
            @click="$emit('finish')"
            class="finish-btn"
            :disabled="isLoading"
          >
            Done Building
          </button>
          <button
            @click="handleCancelClick"
            class="cancel-btn"
            :disabled="isLoading"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      v-if="showCancelConfirm"
      title="Discard Memory?"
      message="Are you sure you want to discard this memory? All progress will be lost."
      confirm-text="Discard"
      cancel-text="Keep Working"
      :is-dangerous="true"
      @confirm="confirmCancel"
      @cancel="rejectCancel"
    />
  </div>
</template>

<style scoped>
.builder-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

/* Review State */
.review-state {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.review-header {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.review-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.review-header p {
  font-size: 12px;
  opacity: 0.9;
  margin: 0;
}

.summarized-box {
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  border-left: 4px solid #4caf50;
}

.summarized-box p {
  margin: 0;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tags-section {
  background: #f5f5f7;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 12px;
}

.tags-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.tags-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  background: #f5f5f7;
  color: #555;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #e5e5e7;
}

.tag-remove {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
  color: #555;
}

.tag-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  color: #333;
  transition: border-color 0.2s;
}

.tag-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.theme-section {
  background: #f5f5f7;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 12px;
}

.theme-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.theme-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #333;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.theme-select:hover {
  border-color: #667eea;
}

.theme-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.theme-hint {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.review-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.confirm-btn {
  flex: 1;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.edit-btn {
  background: #2196f3;
  color: white;
  flex: 1;
}

.edit-btn:hover:not(:disabled) {
  background: #1976d2;
}

.review-buttons .cancel-btn {
  background: #f44336;
  color: white;
}

.review-buttons .cancel-btn:hover:not(:disabled) {
  background: #da190b;
}

.panel-header {
  background: white;
  color: #333;
  padding: 24px;
  border-bottom: 1px solid #e5e5e7;
}

.panel-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.panel-header p {
  font-size: 14px;
  opacity: 0.9;
}

.panel-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
}

/* Initial State */
.initial-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.mode-toggle {
  display: flex;
  gap: 8px;
  background: #f0f4ff;
  padding: 4px;
  border-radius: 8px;
}

.toggle-btn {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: white;
  border-color: #667eea;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
}

.toggle-btn:hover {
  color: #667eea;
}

.scratch-mode,
.prompt-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.prompt-selection,
.prompt-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.generated-prompt {
  background: #f0f4ff;
  border: 2px solid #e0e7ff;
  border-radius: 8px;
  padding: 16px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.generated-prompt p {
  margin: 0;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
}

.prompt-actions,
.input-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-btn {
  padding: 10px 16px;
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
  border-color: #999;
}

.generate-btn,
.use-prompt-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.use-prompt-btn {
  background: #4caf50;
  color: white;
}

.use-prompt-btn:hover:not(:disabled) {
  background: #45a049;
}

.prompt-box {
  background: #f5f5f7;
  border: 1px solid #e5e5e7;
  padding: 16px;
  border-radius: 8px;
}

.prompt-box p {
  color: #666;
  font-size: 13px;
  margin: 0;
  font-weight: 500;
}

.memory-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 200px;
  transition: all 0.2s;
  background: white;
  color: #333;
  box-sizing: border-box;
}

.memory-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.start-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Building State */
.building-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.memory-history {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #667eea;
  max-height: 200px;
  overflow-y: auto;
}

.history-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.history-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0;
  padding: 8px;
  background: white;
  border-radius: 6px;
}

.llm-section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.llm-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.llm-message {
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
  padding: 12px 16px;
  border-radius: 8px;
  flex: 1;
}

.llm-message p {
  margin: 0;
  font-size: 14px;
  color: #1565c0;
  line-height: 1.5;
}

.loading {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1565c0;
  animation: bounce 1.4s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-8px);
  }
}

.detail-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  background: white;
  color: #333;
  transition: border-color 0.2s;
}

.detail-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.detail-input:disabled {
  background: #f5f5f5;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-detail-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.add-detail-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.finish-btn {
  background: #4caf50;
  color: white;
}

.finish-btn:hover:not(:disabled) {
  background: #45a049;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.cancel-btn:hover:not(:disabled) {
  background: #da190b;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .panel-header h1 {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
