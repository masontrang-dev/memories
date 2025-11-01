import { ref, watch } from "vue";

const PROFILE_STORAGE_KEY = "memoryVault_userProfile";

const userProfile = ref({
  name: "",
  birthDate: null,
  city: "",
  state: "",
  country: "United States",
  immigrationYear: null,
  immigrationCountry: "",
  completedProfile: false,
});

export function useUserProfile() {
  const loadProfile = () => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        userProfile.value = { ...userProfile.value, ...parsed };
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const saveProfile = () => {
    try {
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(userProfile.value)
      );
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  const setProfile = (profileData) => {
    userProfile.value = { ...userProfile.value, ...profileData };
    saveProfile();
  };

  const getCurrentAge = () => {
    if (!userProfile.value.birthDate) return null;

    const birthDate = new Date(userProfile.value.birthDate);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn't occurred yet this year
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const setCountry = (country) => {
    userProfile.value.country = country;
    saveProfile();
  };

  const setImmigrationInfo = (year, country) => {
    userProfile.value.immigrationYear = year;
    userProfile.value.immigrationCountry = country;
    saveProfile();
  };

  const completeProfile = () => {
    userProfile.value.completedProfile = true;
    saveProfile();
  };

  const resetProfile = () => {
    userProfile.value = {
      name: "",
      birthDate: null,
      city: "",
      state: "",
      country: "United States",
      immigrationYear: null,
      immigrationCountry: "",
      completedProfile: false,
    };
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  const getBirthYear = () => {
    if (!userProfile.value.birthDate) return null;
    const birthDate = new Date(userProfile.value.birthDate);
    return birthDate.getFullYear();
  };

  const getAgeAtYear = (year) => {
    const birthYear = getBirthYear();
    if (!birthYear || !year) return null;
    return year - birthYear;
  };

  // Auto-save when profile changes
  watch(userProfile, saveProfile, { deep: true });

  return {
    userProfile,
    loadProfile,
    saveProfile,
    setProfile,
    getCurrentAge,
    setCountry,
    setImmigrationInfo,
    completeProfile,
    resetProfile,
    getBirthYear,
    getAgeAtYear,
  };
}
