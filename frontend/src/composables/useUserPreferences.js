import { ref, watch } from "vue";

const STORAGE_KEY = "memoryVault_preferences";

const preferences = ref({
  selectedTheme: "general_childhood",
});

export function useUserPreferences() {
  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        preferences.value = { ...preferences.value, ...parsed };
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    }
  };

  const savePreferences = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.value));
    } catch (err) {
      console.error("Error saving preferences:", err);
    }
  };

  const setTheme = (themeId) => {
    preferences.value.selectedTheme = themeId;
    savePreferences();
  };

  const resetPreferences = () => {
    preferences.value = {
      selectedTheme: "general_childhood",
    };
    localStorage.removeItem(STORAGE_KEY);
  };

  // Auto-save when preferences change
  watch(preferences, savePreferences, { deep: true });

  return {
    preferences,
    loadPreferences,
    setTheme,
    resetPreferences,
  };
}
