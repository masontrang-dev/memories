<script setup>
import { computed, ref } from "vue";
import { useMemoryTimeline } from "../composables/useMemoryTimeline";

const props = defineProps({
  memories: Array,
});

const expandedMemories = ref(new Set());

const toggleMemory = (memoryId) => {
  if (expandedMemories.value.has(memoryId)) {
    expandedMemories.value.delete(memoryId);
  } else {
    expandedMemories.value.add(memoryId);
  }
};

const isExpanded = (memoryId) => {
  return expandedMemories.value.has(memoryId);
};

const {
  groupMemoriesByDecade,
  getMemoryFrequency,
  getTagsByTimeframe,
  getThemesByTimeframe,
} = useMemoryTimeline();

const memoriesByTimeframe = computed(() => {
  return groupMemoriesByDecade(props.memories || []);
});

const frequency = computed(() => {
  return getMemoryFrequency(props.memories || []);
});

const tagsByTimeframe = computed(() => {
  return getTagsByTimeframe(props.memories || []);
});

const themesByTimeframe = computed(() => {
  return getThemesByTimeframe(props.memories || []);
});

const sortedTimeframes = computed(() => {
  return Object.keys(memoriesByTimeframe.value).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (isNaN(aNum)) return 1;
    if (isNaN(bNum)) return -1;
    return aNum - bNum; // Ascending order (chronological)
  });
});

const maxFrequency = computed(() => {
  const values = Object.values(frequency.value);
  return values.length > 0 ? Math.max(...values) : 1;
});

const getThemeColor = (theme) => {
  const colors = {
    immigrant_parent: "#667eea",
    immigrant_self: "#764ba2",
    general_childhood: "#f093fb",
    family_history: "#4facfe",
  };
  return colors[theme] || "#999";
};

const getThemeName = (theme) => {
  const names = {
    immigrant_parent: "Parents' Immigration",
    immigrant_self: "My Immigration",
    general_childhood: "Childhood",
    family_history: "Family History",
  };
  return names[theme] || theme;
};
</script>

<template>
  <div class="panel-header">
    <h1>📅 Memory Timeline</h1>
    <p>Explore your memories across time</p>
  </div>

  <div class="panel-content">
    <div v-if="sortedTimeframes.length === 0" class="empty-state">
      <p>No memories yet. Start creating to build your timeline!</p>
    </div>

    <div v-else class="timeline-content">
      <!-- Frequency Chart -->
      <div class="frequency-section">
        <h3>Memory Frequency</h3>
        <div class="frequency-bars">
          <div
            v-for="timeframe in sortedTimeframes"
            :key="timeframe"
            class="frequency-item"
          >
            <div class="bar-wrapper">
              <div
                class="bar"
                :style="{
                  height: `${(frequency[timeframe] / maxFrequency) * 100}%`,
                }"
              ></div>
              <span class="count">{{ frequency[timeframe] }}</span>
            </div>
            <span class="label">{{ timeframe }}</span>
          </div>
        </div>
      </div>

      <!-- Timeline Details -->
      <div class="timeline-details">
        <div
          v-for="timeframe in sortedTimeframes"
          :key="timeframe"
          class="timeframe-card"
        >
          <div class="timeframe-header">
            <h4>{{ timeframe }}</h4>
            <span class="memory-count"
              >{{ frequency[timeframe] }} memories</span
            >
          </div>

          <!-- Themes in this timeframe -->
          <div class="themes-section">
            <div class="section-label">Themes</div>
            <div class="theme-badges">
              <span
                v-for="(count, theme) in themesByTimeframe[timeframe]"
                :key="theme"
                class="theme-badge"
                :style="{ backgroundColor: getThemeColor(theme) }"
              >
                {{ getThemeName(theme) }}: {{ count }}
              </span>
            </div>
          </div>

          <!-- Top tags in this timeframe -->
          <div v-if="tagsByTimeframe[timeframe]?.length" class="tags-section">
            <div class="section-label">Top Tags</div>
            <div class="tag-list">
              <span
                v-for="tag in tagsByTimeframe[timeframe]"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Memory previews -->
          <div class="memories-preview">
            <div class="section-label">Memories</div>
            <div class="memory-items">
              <div
                v-for="memory in memoriesByTimeframe[timeframe]"
                :key="memory.id"
                class="memory-item-wrapper"
              >
                <div
                  class="memory-preview"
                  @click="toggleMemory(memory.id)"
                  :class="{ expanded: isExpanded(memory.id) }"
                >
                  <div class="memory-header">
                    <span class="expand-icon">{{
                      isExpanded(memory.id) ? "▼" : "▶"
                    }}</span>
                    <p class="memory-summary">
                      {{ memory.summary || memory.text.substring(0, 100) }}...
                    </p>
                  </div>
                  <div v-if="isExpanded(memory.id)" class="memory-full">
                    <p>{{ memory.text }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.frequency-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 24px;
}

.frequency-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #333;
}

.frequency-bars {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  min-height: 150px;
  padding: 16px 0;
}

.frequency-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar-wrapper {
  position: relative;
  height: 120px;
  width: 100%;
  background: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 80%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
  min-height: 4px;
}

.bar-wrapper:hover .bar {
  opacity: 0.8;
}

.count {
  position: absolute;
  top: -20px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.label {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.timeline-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeframe-card {
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
}

.timeframe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.timeframe-header h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.memory-count {
  font-size: 12px;
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.themes-section,
.tags-section,
.memories-preview {
  margin-bottom: 12px;
}

.theme-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.theme-badge {
  display: inline-block;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  background: white;
  border: 1px solid #ddd;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.memory-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-item-wrapper {
  display: flex;
  flex-direction: column;
}

.memory-preview {
  background: white;
  border-left: 3px solid #667eea;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  cursor: pointer;
  transition: all 0.2s;
}

.memory-preview:hover {
  background: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.memory-preview.expanded {
  background: #f0f7ff;
  border-left-color: #0066cc;
}

.memory-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.expand-icon {
  font-size: 10px;
  color: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
}

.memory-summary {
  margin: 0;
  flex: 1;
}

.memory-full {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  animation: slideDown 0.2s ease-out;
}

.memory-full p {
  margin: 0;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

@media (max-width: 768px) {
  .frequency-bars {
    gap: 8px;
  }

  .bar-wrapper {
    height: 80px;
  }

  .timeframe-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .memory-count {
    align-self: flex-start;
  }
}
</style>
