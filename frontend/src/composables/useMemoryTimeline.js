import { useUserProfile } from "./useUserProfile";

const API_URL = "http://localhost:3001";

export function useMemoryTimeline() {
  const { userProfile, getBirthYear } = useUserProfile();

  const inferYearWithLLM = async (memoryText, userBirthYear, selectedModel = "llama3.1:8b") => {
    if (!userBirthYear || !memoryText.trim()) return null;

    const currentYear = new Date().getFullYear();

    const prompt = `You are helping infer the year a memory took place based on context clues and the person's birth year.

User's birth year: ${userBirthYear}
Current year: ${currentYear}
Memory text: "${memoryText}"

Based on the memory text, infer what year this memory most likely occurred. Consider:
- Any explicit years mentioned
- Age references ("I was 10", "when I was young", etc.)
- School grades ("elementary school", "high school", etc.)
- Life events ("when I first moved", "during college", etc.)
- Time periods ("in the 90s", "back then", etc.)

Return ONLY a single 4-digit year (e.g., 1995). If you cannot determine the year, return "unknown".`;

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to infer year from LLM");
      }

      const data = await response.json();
      const result = data.response?.trim();

      if (!result || result.toLowerCase().includes("unknown")) {
        return null;
      }

      // Try to extract a 4-digit year from the response
      // Look for patterns like "2003", "**2003**", "year 2003", etc.
      const yearMatch = result.match(/\*?\*?(19|20)\d{2}\*?\*?/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0].replace(/\*/g, ''));
        if (!isNaN(year) && year >= 1900 && year <= 2100) {
          return year;
        }
      }

      return null;
    } catch (error) {
      console.error("Error inferring year with LLM:", error);
      return null;
    }
  };

  const extractYearFromText = (text, userBirthYear = null) => {
    // Try to find a specific year (1900-2100)
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return parseInt(yearMatch[0]);
    }

    if (!userBirthYear) return null;

    const currentYear = new Date().getFullYear();
    const userCurrentAge = currentYear - userBirthYear;

    // Try to extract age and calculate year
    const ageMatch = text.match(/\b(i was|was|age|aged|when i was|at age|around|about)\s+(\d+)\b/i);
    if (ageMatch) {
      const age = parseInt(ageMatch[2]);
      if (age > 0 && age < 150) {
        return userBirthYear + age;
      }
    }

    // Try to extract school grade and approximate age
    const gradeMatch = text.match(/\b(elementary|primary|middle|junior high|high school|kindergarten|preschool|grade\s+\d+)\b/i);
    if (gradeMatch) {
      const grade = gradeMatch[1].toLowerCase();
      let approximateAge = null;

      if (grade.includes("kindergarten") || grade.includes("preschool")) {
        approximateAge = 5;
      } else if (grade.includes("elementary") || grade.includes("primary")) {
        approximateAge = 8; // Middle of elementary school
      } else if (grade.includes("middle") || grade.includes("junior high")) {
        // If user is older, they went to middle school in the past
        // Estimate middle school was around age 12-13
        approximateAge = userCurrentAge > 20 ? 12 : 12;
      } else if (grade.includes("high school")) {
        approximateAge = 15;
      } else if (grade.match(/grade\s+(\d+)/i)) {
        const gradeNum = parseInt(grade.match(/\d+/)[0]);
        approximateAge = gradeNum + 5; // Approximate age based on grade
      }

      if (approximateAge) {
        return userBirthYear + approximateAge;
      }
    }

    return null;
  };

  const getDecadeFromYear = (year) => {
    if (!year) return null;
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
  };

  const groupMemoriesByTimeframe = (memories) => {
    const grouped = {};

    memories.forEach((memory) => {
      const timeframe = memory.timeframe || "unknown";
      if (!grouped[timeframe]) {
        grouped[timeframe] = [];
      }
      grouped[timeframe].push(memory);
    });

    return grouped;
  };

  const groupMemoriesByDecade = (memories) => {
    const grouped = {};
    const { getBirthYear } = useUserProfile();
    const birthYear = getBirthYear();

    memories.forEach((memory) => {
      let decade = "unknown";
      let year = null;

      // First, check if year is stored with the memory
      if (memory.year) {
        year = memory.year;
      } else {
        // Try to extract year from memory text (with profile data)
        // This handles old memories that don't have year field
        year = extractYearFromText(memory.text, birthYear);
      }

      if (year) {
        decade = getDecadeFromYear(year);
      } else if (memory.timeframe) {
        // Use extracted timeframe if available
        decade = memory.timeframe;
      }

      if (!grouped[decade]) {
        grouped[decade] = [];
      }
      grouped[decade].push(memory);
    });

    return grouped;
  };

  const getMemoryFrequency = (memories) => {
    const grouped = groupMemoriesByDecade(memories);
    const frequency = {};

    Object.entries(grouped).forEach(([decade, mems]) => {
      frequency[decade] = mems.length;
    });

    return frequency;
  };

  const getTagsByTimeframe = (memories) => {
    const grouped = groupMemoriesByTimeframe(memories);
    const tagsByTimeframe = {};

    Object.entries(grouped).forEach(([timeframe, mems]) => {
      const tagCounts = {};

      mems.forEach((memory) => {
        if (memory.tags && Array.isArray(memory.tags)) {
          memory.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Get top 5 tags
      tagsByTimeframe[timeframe] = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
    });

    return tagsByTimeframe;
  };

  const getThemesByTimeframe = (memories) => {
    const grouped = groupMemoriesByTimeframe(memories);
    const themesByTimeframe = {};

    Object.entries(grouped).forEach(([timeframe, mems]) => {
      const themeCounts = {};

      mems.forEach((memory) => {
        const theme = memory.theme || "unknown";
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });

      themesByTimeframe[timeframe] = themeCounts;
    });

    return themesByTimeframe;
  };

  const getChartData = (memories) => {
    const frequency = getMemoryFrequency(memories);

    // Sort by decade
    const sortedDecades = Object.keys(frequency).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      return aNum - bNum;
    });

    return {
      labels: sortedDecades,
      datasets: [
        {
          label: "Memories per Decade",
          data: sortedDecades.map((decade) => frequency[decade]),
          backgroundColor: "rgba(102, 126, 234, 0.6)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 2,
          borderRadius: 4,
        },
      ],
    };
  };

  const getMemoriesByThemeAndTimeframe = (memories) => {
    const grouped = groupMemoriesByTimeframe(memories);
    const result = {};

    Object.entries(grouped).forEach(([timeframe, mems]) => {
      result[timeframe] = {};

      mems.forEach((memory) => {
        const theme = memory.theme || "unknown";
        if (!result[timeframe][theme]) {
          result[timeframe][theme] = [];
        }
        result[timeframe][theme].push(memory);
      });
    });

    return result;
  };

  return {
    inferYearWithLLM,
    extractYearFromText,
    getDecadeFromYear,
    groupMemoriesByTimeframe,
    groupMemoriesByDecade,
    getMemoryFrequency,
    getTagsByTimeframe,
    getThemesByTimeframe,
    getChartData,
    getMemoriesByThemeAndTimeframe,
  };
}
