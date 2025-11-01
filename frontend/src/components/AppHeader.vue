<script setup>
import { computed } from "vue";

defineProps({
  memoryCount: Number,
  selectedModel: String,
  availableModels: Array,
});

defineEmits(["update:selectedModel"]);

const modelLabel = computed(() => {
  const model = defineProps.availableModels?.find(
    (m) => m.value === defineProps.selectedModel
  );
  return model?.label || "Select Model";
});
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Branding -->
      <div class="branding">
        <div class="logo">📚</div>
        <div class="brand-text">
          <h1>Memory Vault</h1>
          <p>Preserve your precious moments</p>
        </div>
      </div>

      <!-- Center: Stats -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Memories Saved</span>
          <span class="stat-value">{{ memoryCount }}</span>
        </div>
      </div>

      <!-- Right: Model Selector -->
      <div class="model-selector">
        <label for="header-model-select">AI Model:</label>
        <select
          id="header-model-select"
          :value="selectedModel"
          @change="$emit('update:selectedModel', $event.target.value)"
        >
          <option
            v-for="model in availableModels"
            :key="model.value"
            :value="model.value"
          >
            {{ model.label }}
          </option>
        </select>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.branding {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo {
  font-size: 32px;
  line-height: 1;
}

.brand-text h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.brand-text p {
  font-size: 12px;
  opacity: 0.9;
  margin: 2px 0 0 0;
  font-weight: 400;
}

.stats {
  display: flex;
  gap: 32px;
  flex: 1;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.model-selector label {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.model-selector select {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.model-selector select:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.model-selector select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.25);
  border-color: white;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.model-selector select option {
  background: #333;
  color: white;
}

@media (max-width: 1024px) {
  .header-container {
    gap: 16px;
    padding: 12px 16px;
  }

  .stats {
    gap: 16px;
  }

  .brand-text h1 {
    font-size: 20px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    gap: 12px;
  }

  .branding {
    width: 100%;
    justify-content: center;
  }

  .stats {
    width: 100%;
  }

  .model-selector {
    width: 100%;
    justify-content: center;
  }

  .model-selector select {
    flex: 1;
    max-width: 200px;
  }
}
</style>
