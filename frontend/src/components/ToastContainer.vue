<script setup>
import { useToast } from "../composables/useToast";
import Toast from "./Toast.vue";

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="toast-container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="removeToast(toast.id)"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

@media (max-width: 768px) {
  .toast-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }

  .toast-container > * {
    max-width: 100%;
  }
}
</style>
