<script setup>
import { ref } from "vue";
import { useUserProfile } from "../composables/useUserProfile";
import { useProfileParsing } from "../composables/useProfileParsing";

const props = defineProps({
  selectedModel: String,
});

const { userProfile, setProfile, completeProfile } = useUserProfile();
const { parseProfileFromText } = useProfileParsing();

const emit = defineEmits(["complete"]);

const activeTab = ref("manual"); // 'manual' or 'ai'
const aiInput = ref("");
const aiLoading = ref(false);
const aiParsedData = ref(null);

const formData = ref({
  name: userProfile.value.name || "",
  birthYear: userProfile.value.birthYear || "",
  currentAge: userProfile.value.currentAge || "",
  country: userProfile.value.country || "",
  immigrationYear: userProfile.value.immigrationYear || "",
  immigrationCountry: userProfile.value.immigrationCountry || "",
});

const currentYear = new Date().getFullYear();
const ageOptions = Array.from({ length: 100 }, (_, i) => i + 1);
const yearOptions = Array.from({ length: 150 }, (_, i) => currentYear - 100 + i);

const handleAgeChange = (age) => {
  formData.value.currentAge = age;
  if (age) {
    formData.value.birthYear = currentYear - age;
  }
};

const handleBirthYearChange = (year) => {
  formData.value.birthYear = year;
  if (year) {
    formData.value.currentAge = currentYear - year;
  }
};

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
  
  activeTab.value = "manual";
  aiParsedData.value = null;
  aiInput.value = "";
};

const handleSave = () => {
  setProfile({
    name: formData.value.name,
    birthYear: formData.value.birthYear ? parseInt(formData.value.birthYear) : null,
    currentAge: formData.value.currentAge ? parseInt(formData.value.currentAge) : null,
    country: formData.value.country,
    immigrationYear: formData.value.immigrationYear
      ? parseInt(formData.value.immigrationYear)
      : null,
    immigrationCountry: formData.value.immigrationCountry,
  });
  completeProfile();
  emit("complete");
};

const handleSkip = () => {
  completeProfile();
  emit("complete");
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>👤 Your Profile</h2>
        <p>Help us understand your memories better (optional)</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'manual' }]"
          @click="activeTab = 'manual'"
        >
          ✏️ Manual Entry
        </button>
        <button
          :class="['tab', { active: activeTab === 'ai' }]"
          @click="activeTab = 'ai'"
        >
          🤖 AI Parse
        </button>
      </div>

      <div class="modal-body">
        <!-- Manual Entry Tab -->
        <div v-if="activeTab === 'manual'" class="tab-content">
          <div class="form-group">
            <label>Name (optional)</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Your name"
              class="input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Birth Year</label>
              <select v-model="formData.birthYear" @change="handleBirthYearChange" class="input">
                <option value="">Select year</option>
                <option v-for="year in yearOptions" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Current Age</label>
              <select v-model="formData.currentAge" @change="handleAgeChange" class="input">
                <option value="">Select age</option>
                <option v-for="age in ageOptions" :key="age" :value="age">
                  {{ age }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Current Country</label>
            <input
              v-model="formData.country"
              type="text"
              placeholder="e.g., United States"
              class="input"
            />
          </div>

          <div class="divider">Immigration Info (optional)</div>

          <div class="form-row">
            <div class="form-group">
              <label>Immigration Year</label>
              <select v-model="formData.immigrationYear" class="input">
                <option value="">Select year</option>
                <option v-for="year in yearOptions" :key="year" :value="year">
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
        </div>

        <!-- AI Parse Tab -->
        <div v-if="activeTab === 'ai'" class="tab-content">
          <div class="ai-section">
            <p class="ai-description">
              Tell us about yourself in your own words. Our AI will extract the information.
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
                  <strong>Current Age:</strong> {{ aiParsedData.currentAge }}
                </div>
                <div v-if="aiParsedData.country" class="parsed-field">
                  <strong>Country:</strong> {{ aiParsedData.country }}
                </div>
                <div v-if="aiParsedData.immigrationYear" class="parsed-field">
                  <strong>Immigration Year:</strong> {{ aiParsedData.immigrationYear }}
                </div>
                <div v-if="aiParsedData.immigrationCountry" class="parsed-field">
                  <strong>From:</strong> {{ aiParsedData.immigrationCountry }}
                </div>
              </div>
              <button @click="handleApplyParsedData" class="apply-btn">
                Apply & Continue
              </button>
            </div>
          </div>
        </div>

        <div class="info-text">
          💡 This information helps us extract dates from your memories. For example, if you say
          "I was 10 years old," we can calculate the year based on your birth year.
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleSkip" class="skip-btn">Skip for Now</button>
        <button @click="handleSave" class="save-btn">Save Profile</button>
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
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
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
  padding: 40px 40px 24px 40px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.modal-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.tab {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #333;
  background: #f0f0f0;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.modal-body {
  padding: 24px 40px;
  overflow-y: auto;
  flex: 1;
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

.info-text {
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
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
  transition: border-color 0.2s;
  box-sizing: border-box;
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

.parse-btn {
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

.parse-btn:hover:not(:disabled) {
  background: #5568d3;
}

.parse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.modal-footer {
  padding: 24px 40px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid #eee;
  background: #f9f9f9;
}

.skip-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn {
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ddd;
}

.skip-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5568d3;
}
</style>
