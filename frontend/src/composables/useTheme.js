import { computed } from "vue";
import { useUserPreferences } from "./useUserPreferences";
import { getTheme } from "../config/themeConfig";

export function useTheme() {
  const { preferences } = useUserPreferences();

  const currentTheme = computed(() => {
    const themeId = preferences.value.selectedTheme;
    return getTheme(themeId);
  });

  const getInitialPrompt = () => {
    return currentTheme.value.initialPrompt;
  };

  const getFollowUpPrompt = () => {
    const examples = currentTheme.value.followUpExamples;
    return examples[Math.floor(Math.random() * examples.length)];
  };

  const getTags = () => {
    return currentTheme.value.tags;
  };

  const getHeaderSubtitle = () => {
    return currentTheme.value.headerSubtitle;
  };

  const getPanelName = (panel) => {
    return currentTheme.value.panelNames[panel];
  };

  const getThemeName = () => {
    return currentTheme.value.name;
  };

  return {
    currentTheme,
    getInitialPrompt,
    getFollowUpPrompt,
    getTags,
    getHeaderSubtitle,
    getPanelName,
    getThemeName,
  };
}
