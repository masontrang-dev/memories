<script setup>
import { ref } from "vue";
import { getAllThemes } from "../config/themeConfig";
import { useUserPreferences } from "../composables/useUserPreferences";

const { setTheme, completeOnboarding } = useUserPreferences();
const selectedTheme = ref(null);
const themes = getAllThemes();

const handleSelectTheme = (themeId) => {
  selectedTheme.value = themeId;
};

const handleConfirm = () => {
  if (selectedTheme.value) {
    setTheme(selectedTheme.value);
    completeOnboarding();
    emit("complete");
  }
};

const emit = defineEmits(["complete"]);
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Welcome to Memory Vault</h2>
        <p>What type of memories would you like to preserve?</p>
      </div>

      <div class="themes-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          :class="['theme-card', { selected: selectedTheme === theme.id }]"
          @click="handleSelectTheme(theme.id)"
        >
          <div class="theme-icon">
            <span v-if="theme.id === 'immigrant_parent'">👨‍👩‍👧</span>
            <span v-else-if="theme.id === 'immigrant_self'">🌍</span>
            <span v-else-if="theme.id === 'general_childhood'">🎈</span>
            <span v-else-if="theme.id === 'family_history'">🌳</span>
          </div>
          <h3>{{ theme.name }}</h3>
          <p>{{ theme.description }}</p>
          <div v-if="selectedTheme === theme.id" class="checkmark">✓</div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          @click="handleConfirm"
          :disabled="!selectedTheme"
          class="confirm-btn"
        >
          Get Started
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 40px;
}

.modal-header h2 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
}

.modal-header p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.theme-card {
  background: #f8f9fa;
  border: 2px solid #e5e5e7;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  text-align: center;
}

.theme-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.theme-card.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.theme-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.theme-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 0 8px 0;
}

.theme-card p {
  font-size: 13px;
  margin: 0;
  opacity: 0.8;
  line-height: 1.4;
}

.theme-card.selected p {
  opacity: 0.95;
}

.checkmark {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  color: #667eea;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 24px;
  }

  .modal-header h2 {
    font-size: 24px;
  }

  .themes-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
