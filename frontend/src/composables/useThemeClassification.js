import { ref } from "vue";
import { useToast } from "./useToast";

const API_URL = "http://localhost:3001";

export function useThemeClassification() {
  const { error: showError } = useToast();

  const extractMemoryContext = (memoryText) => {
    // Extract key context clues from the memory text
    const context = {
      locations: [],
      keywords: [],
      timeframe: "",
    };

    // Simple keyword extraction
    const countryKeywords = [
      "vietnam",
      "china",
      "india",
      "mexico",
      "philippines",
      "korea",
      "japan",
      "thailand",
      "cambodia",
      "laos",
      "pakistan",
      "bangladesh",
      "colombia",
      "el salvador",
      "guatemala",
      "honduras",
      "usa",
      "america",
      "united states",
      "america",
    ];

    const timeframeKeywords = {
      childhood: [
        "childhood",
        "kid",
        "kids",
        "young",
        "school",
        "elementary",
        "middle school",
        "high school",
      ],
      recent: ["recently", "last year", "few years ago", "now", "today"],
      distant: ["1980s", "1990s", "2000s", "decades ago", "long ago"],
    };

    const immigrationKeywords = [
      "immigr",
      "parent",
      "mom",
      "dad",
      "mother",
      "father",
      "journey",
      "arrived",
      "came to",
      "moved to",
      "left",
      "homeland",
      "country",
      "adapt",
      "culture",
      "tradition",
    ];

    const lowerText = memoryText.toLowerCase();

    // Extract locations
    countryKeywords.forEach((country) => {
      if (lowerText.includes(country)) {
        context.locations.push(country);
      }
    });

    // Extract timeframe
    Object.entries(timeframeKeywords).forEach(([frame, keywords]) => {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        context.timeframe = frame;
      }
    });

    // Extract immigration-related keywords
    immigrationKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        context.keywords.push(keyword);
      }
    });

    return context;
  };

  const classifyMemoryTheme = async (memoryText, selectedModel) => {
    try {
      // Extract context hints from the memory
      const context = extractMemoryContext(memoryText);
      const contextHints = `Context hints: Locations mentioned: ${context.locations.join(", ") || "none"}, Timeframe: ${context.timeframe || "unknown"}, Key topics: ${context.keywords.join(", ") || "none"}`;

      const prompt = `Analyze this memory and classify it into ONE of these themes:

- "immigrant_parent": About parents' immigration journey, cultural heritage, family sacrifice, adaptation, homeland, traditions
- "immigrant_self": About personal immigration experience, identity, belonging, culture shock, resilience, growth
- "general_childhood": General childhood memories, school, friends, play, adventures, family moments
- "family_history": Multi-generational family stories, ancestors, legacy, traditions, family values

${contextHints}

Memory: "${memoryText}"

Return ONLY the theme ID (e.g., "immigrant_parent"), nothing else. No explanation, just the ID.`;

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
        throw new Error("Failed to classify memory theme");
      }

      const data = await response.json();
      const detectedTheme = data.response.trim().toLowerCase();

      // Validate it's a real theme
      const validThemes = [
        "immigrant_parent",
        "immigrant_self",
        "general_childhood",
        "family_history",
      ];

      if (validThemes.includes(detectedTheme)) {
        return { theme: detectedTheme, context };
      } else {
        // If LLM returns invalid theme, return null and let user choose
        console.warn(`Invalid theme detected: ${detectedTheme}`);
        return { theme: null, context };
      }
    } catch (err) {
      console.error("Error classifying theme:", err);
      showError("Could not auto-classify theme. You can select manually.");
      return { theme: null, context: {} };
    }
  };

  return {
    classifyMemoryTheme,
  };
}
