<script setup>
import { ref, computed } from "vue";
import { useUserProfile } from "../composables/useUserProfile";
import { useProfileParsing } from "../composables/useProfileParsing";
import { useLocationSearch } from "../composables/useLocationSearch";

const props = defineProps({
  selectedModel: String,
});

const emit = defineEmits(["close"]);

const { userProfile, setProfile } = useUserProfile();
const { parseProfileFromText } = useProfileParsing();
const { debouncedSearchCity, searchState, parseLocationString } = useLocationSearch();

const activeSection = ref("profile");
const aiInput = ref("");
const aiLoading = ref(false);
const aiParsedData = ref(null);
const saveSuccess = ref(false);
const showLocationSuggestions = ref(false);
const locationSuggestions = ref([]);
const locationSearchLoading = ref(false);

const handleLocationInput = (value) => {
  // Extract just the city name (before the comma if there is one)
  const cityName = value.split(",")[0].trim();
  formData.value.city = cityName;
  
  if (!cityName || cityName.length < 2) {
    locationSuggestions.value = [];
    formData.value.state = "";
    formData.value.country = "";
    return;
  }
  locationSearchLoading.value = true;
  debouncedSearchCity(cityName, (results) => {
    locationSuggestions.value = results;
    locationSearchLoading.value = false;
  });
};

const selectLocation = (city) => {
  formData.value.city = city.name;
  formData.value.state = city.abbr;
  formData.value.country = "United States";
  showLocationSuggestions.value = false;
  // Update the input to show full location
  locationInputDisplay.value = `${city.name}, ${city.abbr}`;
};

const formData = ref({
  name: userProfile.value.name || "",
  birthDate: userProfile.value.birthDate || "",
  city: userProfile.value.city || "",
  state: userProfile.value.state || "",
  country: userProfile.value.country || "",
  immigrationYear: userProfile.value.immigrationYear || "",
  immigrationCountry: userProfile.value.immigrationCountry || "",
});

const locationInputDisplay = ref(
  formData.value.city && formData.value.state
    ? `${formData.value.city}, ${formData.value.state}`
    : ""
);

const currentYear = new Date().getFullYear();
const ageOptions = Array.from({ length: 100 }, (_, i) => i + 1);
const yearOptions = Array.from(
  { length: 150 },
  (_, i) => currentYear - 100 + i
);

const handleParseAI = async () => {
  if (!aiInput.value.trim()) return;

  aiLoading.value = true;
  const result = await parseProfileFromText(aiInput.value, props.selectedModel);
  aiLoading.value = false;

  if (result) {
    aiParsedData.value = result;
  }
};

const handleApplyParsedData = () => {
  if (!aiParsedData.value) return;

  formData.value = {
    name: aiParsedData.value.name || "",
    birthYear: aiParsedData.value.birthYear || "",
    currentAge: aiParsedData.value.currentAge || "",
    country: aiParsedData.value.country || "",
    immigrationYear: aiParsedData.value.immigrationYear || "",
    immigrationCountry: aiParsedData.value.immigrationCountry || "",
  };

  aiParsedData.value = null;
  aiInput.value = "";
};


const handleSaveProfile = () => {
  setProfile({
    name: formData.value.name,
    birthDate: formData.value.birthDate || null,
    city: formData.value.city,
    state: formData.value.state,
    country: formData.value.country,
    immigrationYear: formData.value.immigrationYear
      ? parseInt(formData.value.immigrationYear)
      : null,
    immigrationCountry: formData.value.immigrationCountry,
  });
  saveSuccess.value = true;
  setTimeout(() => {
    saveSuccess.value = false;
  }, 2000);
};
</script>

<template>
  <div class="settings-modal-overlay" @click="emit('close')">
    <div class="settings-modal" @click.stop>
      <!-- Header -->
      <div class="settings-header">
        <button class="close-btn" @click="emit('close')" title="Close">
          ✕
        </button>
        <h1>⚙️ Settings</h1>
        <div style="width: 40px"></div>
      </div>

      <div class="settings-container">
        <!-- Sidebar Navigation -->
        <div class="settings-sidebar">
          <button
            :class="['nav-item', { active: activeSection === 'profile' }]"
            @click="activeSection = 'profile'"
          >
            👤 Profile
          </button>
          <button
            :class="['nav-item', { active: activeSection === 'preferences' }]"
            @click="activeSection = 'preferences'"
          >
            🎨 Preferences
          </button>
          <button
            :class="['nav-item', { active: activeSection === 'data' }]"
            @click="activeSection = 'data'"
          >
            💾 Data
          </button>
          <button
            :class="['nav-item', { active: activeSection === 'about' }]"
            @click="activeSection = 'about'"
          >
            ℹ️ About
          </button>
        </div>

        <!-- Content Area -->
        <div class="settings-content">
          <!-- Profile Section -->
          <div v-if="activeSection === 'profile'" class="section">
            <div class="section-header">
              <h2>👤 Profile Information</h2>
              <p>Manage your personal information</p>
            </div>

            <!-- Tabs for Manual/AI -->
            <div class="tabs">
              <button
                :class="['tab', { active: !aiParsedData }]"
                @click="aiParsedData = null"
              >
                ✏️ Manual Entry
              </button>
              <button
                :class="['tab', { active: aiParsedData }]"
                @click="aiParsedData = aiParsedData || true"
              >
                🤖 AI Parse
              </button>
            </div>

            <!-- Manual Entry -->
            <div v-if="!aiParsedData" class="tab-content">
              <div class="form-group">
                <label>Name</label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="Your name"
                  class="input"
                />
              </div>

              <div class="form-group">
                <label>Birth Date</label>
                <input v-model="formData.birthDate" type="date" class="input" />
              </div>

              <div class="form-group">
                <label>Location</label>
                <p class="location-hint">Enter city name (e.g., San Diego)</p>
                <div class="autocomplete-wrapper">
                  <input
                    :value="locationInputDisplay || formData.city"
                    type="text"
                    placeholder="e.g., San Diego"
                    class="input"
                    @input="handleLocationInput($event.target.value); locationInputDisplay = ''"
                    @focus="showLocationSuggestions = true"
                    @blur="setTimeout(() => showLocationSuggestions = false, 200)"
                  />
                  <div v-if="showLocationSuggestions && (locationSuggestions.length || locationSearchLoading)" class="suggestions">
                    <div v-if="locationSearchLoading" class="suggestion-item loading">
                      Searching...
                    </div>
                    <div
                      v-for="city in locationSuggestions"
                      :key="city.name + city.abbr"
                      class="suggestion-item"
                      @click="selectLocation(city)"
                    >
                      {{ city.name }}, {{ city.abbr }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="divider">Immigration Info</div>

              <div class="form-row">
                <div class="form-group">
                  <label>Immigration Year</label>
                  <select
                    :value="formData.immigrationYear"
                    @change="
                      formData.immigrationYear = $event.target.value
                        ? parseInt($event.target.value)
                        : ''
                    "
                    class="input"
                  >
                    <option value="">Select year</option>
                    <option
                      v-for="year in yearOptions"
                      :key="year"
                      :value="year"
                    >
                      {{ year }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>From Country</label>
                  <input
                    v-model="formData.immigrationCountry"
                    type="text"
                    placeholder="e.g., Vietnam"
                    class="input"
                  />
                </div>
              </div>

              <button @click="handleSaveProfile" :class="['save-btn', { 'save-success': saveSuccess }]">
                {{ saveSuccess ? '✅ Saved!' : '💾 Save Profile' }}
              </button>
            </div>

            <!-- AI Parse -->
            <div v-else class="tab-content">
              <div class="ai-section">
                <p class="ai-description">
                  Tell us about yourself in your own words. Our AI will extract
                  the information.
                </p>

                <textarea
                  v-model="aiInput"
                  placeholder="E.g., 'I was born in 1975 in Vietnam and moved to the US in 1995. I'm 48 years old now.'"
                  class="ai-textarea"
                  :disabled="aiLoading"
                ></textarea>

                <button
                  @click="handleParseAI"
                  :disabled="!aiInput.trim() || aiLoading"
                  class="parse-btn"
                >
                  {{ aiLoading ? "Parsing..." : "Parse with AI" }}
                </button>

                <!-- Parsed Data Review -->
                <div v-if="aiParsedData" class="parsed-data">
                  <div class="parsed-header">✅ Information Extracted</div>
                  <div class="parsed-fields">
                    <div v-if="aiParsedData.name" class="parsed-field">
                      <strong>Name:</strong> {{ aiParsedData.name }}
                    </div>
                    <div v-if="aiParsedData.birthYear" class="parsed-field">
                      <strong>Birth Year:</strong> {{ aiParsedData.birthYear }}
                    </div>
                    <div v-if="aiParsedData.currentAge" class="parsed-field">
                      <strong>Current Age:</strong>
                      {{ aiParsedData.currentAge }}
                    </div>
                    <div v-if="aiParsedData.country" class="parsed-field">
                      <strong>Country:</strong> {{ aiParsedData.country }}
                    </div>
                    <div
                      v-if="aiParsedData.immigrationYear"
                      class="parsed-field"
                    >
                      <strong>Immigration Year:</strong>
                      {{ aiParsedData.immigrationYear }}
                    </div>
                    <div
                      v-if="aiParsedData.immigrationCountry"
                      class="parsed-field"
                    >
                      <strong>From:</strong>
                      {{ aiParsedData.immigrationCountry }}
                    </div>
                  </div>
                  <button @click="handleApplyParsedData" class="apply-btn">
                    Apply & Continue
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Preferences Section (Future) -->
          <div v-if="activeSection === 'preferences'" class="section">
            <div class="section-header">
              <h2>🎨 Preferences</h2>
              <p>Customize your experience</p>
            </div>
            <div class="placeholder">
              <p>Theme preferences and other customizations coming soon...</p>
            </div>
          </div>

          <!-- Data Section (Future) -->
          <div v-if="activeSection === 'data'" class="section">
            <div class="section-header">
              <h2>💾 Data Management</h2>
              <p>Export, backup, and manage your data</p>
            </div>
            <div class="placeholder">
              <p>Export and backup options coming soon...</p>
            </div>
          </div>

          <!-- About Section -->
          <div v-if="activeSection === 'about'" class="section">
            <div class="section-header">
              <h2>ℹ️ About</h2>
              <p>Information about Memory Vault</p>
            </div>
            <div class="about-content">
              <div class="about-item">
                <strong>Memory Vault</strong>
                <p>
                  Preserve your precious moments with AI-powered memory
                  management.
                </p>
              </div>
              <div class="about-item">
                <strong>Version</strong>
                <p>1.0.0</p>
              </div>
              <div class="about-item">
                <strong>Features</strong>
                <p>
                  • AI-powered memory classification<br />
                  • Timeline visualization<br />
                  • Theme-based organization<br />
                  • Automatic tagging
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
  pointer-events: auto;
}

.settings-modal {
  background: white;
  border-radius: 16px;
  width: 80%;
  max-width: 900px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  pointer-events: auto;
  z-index: 1001;
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

.settings-header {
  background: white;
  border-bottom: 1px solid #e5e5e7;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px 16px 0 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.settings-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  flex: 1;
  text-align: center;
}

.settings-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  flex: 1;
  width: 100%;
  overflow: hidden;
}

.settings-sidebar {
  background: white;
  border-right: 1px solid #e5e5e7;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
}

.nav-item {
  background: none;
  border: none;
  padding: 12px 24px;
  text-align: left;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: #f9f9f9;
  color: #333;
}

.nav-item.active {
  background: #f0f7ff;
  color: #667eea;
  border-left-color: #667eea;
  font-weight: 500;
}

.settings-content {
  padding: 32px;
  overflow-y: auto;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.section-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.section-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.tab {
  background: none;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #333;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 500;
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.autocomplete-wrapper {
  position: relative;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
  padding: 10px 12px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f0f7ff;
  color: #667eea;
}

.suggestion-item.loading {
  color: #999;
  cursor: default;
}

.suggestion-item.loading:hover {
  background-color: white;
  color: #999;
}

.location-hint {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px 0;
  font-weight: normal;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  color: #333;
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input::placeholder {
  color: #999;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.divider {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 24px 0 16px 0;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.info-note {
  font-size: 12px;
  color: #666;
  background: #f0f7ff;
  border-left: 3px solid #667eea;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.ai-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-description {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.ai-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  color: #333;
  background: white;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.ai-textarea::placeholder {
  color: #999;
}

.ai-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-textarea:disabled {
  background: #f5f5f5;
  color: #999;
}

.parse-btn,
.save-btn {
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.parse-btn:hover:not(:disabled),
.save-btn:hover {
  background: #5568d3;
}

.parse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn.save-success {
  background: #10b981;
}

.save-btn.save-success:hover {
  background: #059669;
}

.parsed-data {
  background: #f0f7ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  padding: 16px;
}

.parsed-header {
  font-size: 13px;
  font-weight: 600;
  color: #0066cc;
  margin-bottom: 12px;
}

.parsed-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.parsed-field {
  font-size: 13px;
  color: #333;
  padding: 6px 0;
}

.parsed-field strong {
  color: #0066cc;
  margin-right: 6px;
}

.apply-btn {
  padding: 10px 16px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.apply-btn:hover {
  background: #0052a3;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.about-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.about-item strong {
  display: block;
  color: #333;
  margin-bottom: 6px;
}

.about-item p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .settings-container {
    grid-template-columns: 1fr;
  }

  .settings-sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e5e7;
    padding: 0;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
  }

  .nav-item {
    border-left: none;
    border-bottom: 3px solid transparent;
    padding: 12px 16px;
    white-space: nowrap;
  }

  .nav-item.active {
    border-left: none;
    border-bottom-color: #667eea;
  }

  .settings-content {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
