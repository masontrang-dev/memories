<script setup>
defineProps({
  currentView: String,
});

defineEmits(["update:currentView"]);
</script>

<template>
  <div class="view-tabs">
    <button
      :class="['tab', { active: currentView === 'memories' }]"
      @click="$emit('update:currentView', 'memories')"
    >
      📚 Memory Builder
    </button>
    <button
      :class="['tab', { active: currentView === 'timeline' }]"
      @click="$emit('update:currentView', 'timeline')"
    >
      📅 Memory Timeline
    </button>
    <button
      :class="['tab', { active: currentView === 'search' }]"
      @click="$emit('update:currentView', 'search')"
    >
      💫 Memory Bank
    </button>
  </div>
</template>

<style scoped>
.view-tabs {
  width: 100%;
  padding: 12px 24px;
  background: white;
  display: flex;
  gap: 24px;
  border-bottom: 1px solid #e5e5e7;
}

.tab {
  background: none;
  border: none;
  color: #666;
  padding: 12px 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  outline: none;
}

.tab:focus {
  outline: none;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
}
</style>
