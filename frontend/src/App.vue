<script setup>
import { ref, computed, onMounted } from "vue";
import MemoryBuilder from "./components/MemoryBuilder.vue";
import MemoryList from "./components/MemoryList.vue";
import AppHeader from "./components/AppHeader.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useToast } from "./composables/useToast";
import { useUserPreferences } from "./composables/useUserPreferences";
import { useTheme } from "./composables/useTheme";
import { useThemeClassification } from "./composables/useThemeClassification";
import { themes } from "./config/themeConfig";

const API_URL = "http://localhost:3001";
const selectedModel = ref("llama3.1:8b");
const availableModels = [
  { value: "phi3", label: "Phi3 (Fast)" },
  { value: "mistral", label: "Mistral (Balanced)" },
  { value: "llama3.1:8b", label: "Llama3.1 (Best Quality)" },
];

const { success, error, info } = useToast();
const { preferences, loadPreferences } = useUserPreferences();
const { currentTheme, getInitialPrompt, getFollowUpPrompt, getTags } =
  useTheme();
const { classifyMemoryTheme } = useThemeClassification();

const detectedMemoryTheme = ref(null);

const currentMemory = ref("");
const memoryHistory = ref([]);
const llmResponse = ref("");
const isLoading = ref(false);
const isBuilding = ref(false);
const isReviewing = ref(false);
const summarizedMemory = ref("");
const generatedTags = ref([]);
const generatedPrompt = ref("");
const allMemories = ref([]);
const displayedMemories = ref([]);
const searchInput = ref("");
const isSearching = ref(false);

const memoryCount = computed(() => allMemories.value.length);

onMounted(() => {
  loadPreferences();
  loadMemories();
});

async function loadMemories() {
  try {
    const response = await fetch(`${API_URL}/api/memories`);
    if (!response.ok) throw new Error("Failed to load memories");
    const data = await response.json();
    allMemories.value = data.memories;
    displayedMemories.value = data.memories;
  } catch (err) {
    console.error("Error loading memories:", err);
    error("Failed to load memories. Please check your connection.");
  }
}

async function startMemory(initialMemory) {
  currentMemory.value = initialMemory;
  memoryHistory.value = [initialMemory];
  isBuilding.value = true;
  llmResponse.value = "";

  // Get initial follow-up question from LLM
  await getFollowUpQuestion();
}

async function getFollowUpQuestion() {
  isLoading.value = true;

  try {
    const fullMemory = memoryHistory.value.join("\n\n");
    const prompt = `You are helping someone expand on a childhood memory. The memory so far is:\n\n"${fullMemory}"\n\nAsk ONE specific follow-up question to help them add more vivid details or context to this memory. Keep it conversational and brief. Examples of good questions: "What did it smell like?", "Who else was there?", "How did it make you feel?", "What happened next?"`;

    const response = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel.value,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get follow-up question");
    }

    const data = await response.json();
    llmResponse.value = data.response || "Tell me more about this memory...";
  } catch (err) {
    llmResponse.value = "Tell me more about this memory...";
    console.error("Error:", err);
  } finally {
    isLoading.value = false;
  }
}

async function addDetail(detail) {
  if (!detail.trim()) return;

  memoryHistory.value.push(detail);

  // Get next follow-up question
  await getFollowUpQuestion();
}

async function finishMemory() {
  isLoading.value = true;

  try {
    const fullMemory = memoryHistory.value.join("\n\n");

    // Determine length-appropriate word limit based on input
    const inputLength = fullMemory.length;
    let wordLimit = 150;
    if (inputLength > 500) {
      wordLimit = 300;
    } else if (inputLength > 300) {
      wordLimit = 250;
    }

    const prompt = `You are a storyteller preserving precious childhood memories. Transform this memory into a personal narrative that captures not just what happened, but the feeling, the sensations, and the significance. Keep it under ${wordLimit} words but make every word count. Keep the voice of how the memory details were written. Do not add any additional details or context. \n\nMemory details:\n${fullMemory}\n\nNarrative:`;

    const response = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel.value,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to summarize memory");
    }

    const data = await response.json();
    summarizedMemory.value = data.response || fullMemory;

    // Generate tags for the memory
    const tagsPrompt = `Analyze this memory and extract 2-4 relevant category tags. Return ONLY the tags as a comma-separated list, nothing else. Examples: childhood, cultural traditions, family, school, adventure, friendship, holiday, food, travel, learning.\n\nMemory:\n${summarizedMemory.value}\n\nTags:`;

    const tagsResponse = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel.value,
        prompt: tagsPrompt,
      }),
    });

    if (tagsResponse.ok) {
      const tagsData = await tagsResponse.json();
      const tagsText = tagsData.response || "";
      const tags = tagsText
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
        .slice(0, 4);
      generatedTags.value = tags;
    }

    // Classify theme based on memory content with context hints
    const { theme: classified, context } = await classifyMemoryTheme(
      summarizedMemory.value,
      selectedModel.value
    );
    detectedMemoryTheme.value = classified || preferences.value.selectedTheme;
    // Context is extracted but not stored yet (can be used for future features)

    isBuilding.value = false;
    isReviewing.value = true;
  } catch (err) {
    console.error("Error:", err);
    error(`Error summarizing memory: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
}

async function confirmMemory() {
  isLoading.value = true;

  try {
    const response = await fetch(`${API_URL}/api/memories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: summarizedMemory.value,
        tags: generatedTags.value,
        model: selectedModel.value,
        theme: detectedMemoryTheme.value,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save memory");
    }

    // Reset form
    currentMemory.value = "";
    memoryHistory.value = [];
    llmResponse.value = "";
    summarizedMemory.value = "";
    generatedTags.value = [];
    isReviewing.value = false;

    // Reload memories
    await loadMemories();
    success("Memory saved successfully!");
  } catch (err) {
    console.error("Error:", err);
    error(`Error saving memory: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
}

function editMemory() {
  isReviewing.value = false;
  isBuilding.value = true;
}

function cancelMemory() {
  currentMemory.value = "";
  memoryHistory.value = [];
  llmResponse.value = "";
  summarizedMemory.value = "";
  generatedTags.value = [];
  detectedMemoryTheme.value = null;
  isBuilding.value = false;
  isReviewing.value = false;
}

async function searchMemories() {
  const query = searchInput.value.trim();

  if (!query) {
    displayedMemories.value = allMemories.value;
    return;
  }

  isSearching.value = true;

  try {
    const response = await fetch(`${API_URL}/api/memories/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit: 10 }),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();
    displayedMemories.value = data.results;
    info(`Found ${data.results.length} matching memories`);
  } catch (err) {
    console.error("Error:", err);
    error("Search failed. Please try again.");
  } finally {
    isSearching.value = false;
  }
}

async function updateMemory(memoryData) {
  try {
    const response = await fetch(`${API_URL}/api/memories/${memoryData.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: memoryData.text,
        tags: memoryData.tags,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update memory");
    }

    await loadMemories();
    success("Memory updated successfully!");
  } catch (err) {
    console.error("Error:", err);
    error(`Error updating memory: ${err.message}`);
  }
}

async function deleteMemory(id) {
  if (!confirm("Are you sure you want to delete this memory?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/memories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete memory");
    }

    await loadMemories();
    success("Memory deleted successfully!");
  } catch (err) {
    console.error("Error:", err);
    error(`Error deleting memory: ${err.message}`);
  }
}

function clearSearch() {
  searchInput.value = "";
  displayedMemories.value = allMemories.value;
}

async function generateMemoryPrompt() {
  isLoading.value = true;

  try {
    const promptRequest = `Generate a creative, open-ended prompt to help someone recall a childhood memory. The prompt should be warm, nostalgic, and specific enough to spark memories but open enough for any memory. Return ONLY the prompt, nothing else. Examples: "What's a memory that makes you smile when you think about it?", "Describe a place from your childhood that felt magical to you."`;

    const response = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel.value,
        prompt: promptRequest,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate prompt");
    }

    const data = await response.json();
    generatedPrompt.value = data.response || "";
  } catch (err) {
    console.error("Error:", err);
    error(`Error generating prompt: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="app">
    <AppHeader
      :memory-count="memoryCount"
      :selected-model="selectedModel"
      :available-models="availableModels"
      @update:selected-model="selectedModel = $event"
    />
    <ToastContainer />
    <div class="main-container">
      <!-- Memory Builder (Main) -->
      <MemoryBuilder
        :is-building="isBuilding"
        :is-reviewing="isReviewing"
        :current-memory="currentMemory"
        :memory-history="memoryHistory"
        :llm-response="llmResponse"
        :summarized-memory="summarizedMemory"
        :generated-tags="generatedTags"
        :generated-prompt="generatedPrompt"
        :is-loading="isLoading"
        :detected-theme="detectedMemoryTheme"
        :available-themes="themes"
        @start="startMemory"
        @add-detail="addDetail"
        @finish="finishMemory"
        @confirm="confirmMemory"
        @edit="editMemory"
        @cancel="cancelMemory"
        @update:generated-tags="generatedTags = $event"
        @update:detected-theme="detectedMemoryTheme = $event"
        @generate-prompt="generateMemoryPrompt"
      />

      <!-- Memories List (Sidebar) -->
      <MemoryList
        :memories="displayedMemories"
        :memory-count="memoryCount"
        :search-input="searchInput"
        :is-searching="isSearching"
        @update:search-input="searchInput = $event"
        @search="searchMemories"
        @update-memory="updateMemory"
        @delete="deleteMemory"
        @clear-search="clearSearch"
      />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue",
    sans-serif;
  display: flex;
  flex-direction: column;
}

.main-container {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .main-container {
    grid-template-columns: 1fr;
  }
}
</style>
