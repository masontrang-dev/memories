import { ref } from "vue";

const toasts = ref([]);
let toastId = 0;

export function useToast() {
  const addToast = (message, type = "info", duration = 4000) => {
    const id = toastId++;
    const toast = { id, message, type, duration };
    toasts.value.push(toast);
    return id;
  };

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (message, duration = 4000) => {
    return addToast(message, "success", duration);
  };

  const error = (message, duration = 5000) => {
    return addToast(message, "error", duration);
  };

  const info = (message, duration = 4000) => {
    return addToast(message, "info", duration);
  };

  const warning = (message, duration = 4000) => {
    return addToast(message, "warning", duration);
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
