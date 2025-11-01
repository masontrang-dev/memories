<script setup>
import { computed } from "vue";

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: "info",
    validator: (value) => ["success", "error", "info", "warning"].includes(value),
  },
  duration: {
    type: Number,
    default: 4000,
  },
});

const emit = defineEmits(["close"]);

const iconMap = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const icon = computed(() => iconMap[props.type]);

const handleClose = () => {
  emit("close");
};

// Auto-close after duration
if (props.duration > 0) {
  setTimeout(() => {
    handleClose();
  }, props.duration);
}
</script>

<template>
  <transition name="toast-slide">
    <div v-if="message" :class="['toast', `toast-${type}`]">
      <div class="toast-content">
        <span class="toast-icon">{{ icon }}</span>
        <p class="toast-message">{{ message }}</p>
      </div>
      <button class="toast-close" @click="handleClose" aria-label="Close notification">
        ✕
      </button>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInUp 0.3s ease-out;
  max-width: 400px;
  min-width: 280px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.toast-icon {
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.toast-message {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast Types */
.toast-success {
  background: #4caf50;
  color: white;
}

.toast-error {
  background: #f44336;
  color: white;
}

.toast-info {
  background: #2196f3;
  color: white;
}

.toast-warning {
  background: #ff9800;
  color: white;
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
