<script setup>
defineProps({
  modelValue: String,
  isLoading: Boolean,
  statusMessage: String,
  statusType: String,
})

defineEmits(['update:modelValue', 'save'])
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>📝 Add Memory</h2>
      <p>Save a memory from your childhood</p>
    </div>
    <div class="panel-content">
      <div class="input-group">
        <textarea
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="Write a memory... e.g., 'Playing in the backyard with my friends on a sunny afternoon...'"
        ></textarea>
        <button :disabled="isLoading" @click="$emit('save')">
          {{ isLoading ? 'Saving...' : 'Save Memory' }}
        </button>
      </div>
      <div v-if="statusMessage" :class="['status-message', statusType]">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: #f5f3f0;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-header p {
  font-size: 12px;
  opacity: 0.9;
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f3f0;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea::placeholder {
  color: #999;
}

button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-message {
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
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

.status-message.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.status-message.error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.status-message.loading {
  background: #e3f2fd;
  color: #1565c0;
  border: 1px solid #bbdefb;
}
</style>
