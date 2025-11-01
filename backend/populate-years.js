const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Memory storage file
const MEMORIES_FILE = path.join(__dirname, "memories.json");
const OLLAMA_API_URL = "http://localhost:11434/api";

// Load memories from file
function loadMemories() {
  try {
    if (fs.existsSync(MEMORIES_FILE)) {
      const data = fs.readFileSync(MEMORIES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading memories:", error.message);
  }
  return [];
}

// Save memories to file
function saveMemories(memories) {
  try {
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2));
    console.log("Memories saved successfully!");
  } catch (error) {
    console.error("Error saving memories:", error.message);
  }
}

// Infer year using LLM
async function inferYear(memoryText, userBirthYear, model = "llama3.1:8b") {
  const currentYear = new Date().getFullYear();
  const userCurrentAge = currentYear - userBirthYear;

  const prompt = `You are helping infer the year a memory took place based on context clues and the person's age.

User's birth year: ${userBirthYear}
User's current age: ${userCurrentAge}
Current year: ${currentYear}
Memory text: "${memoryText}"

IMPORTANT CONSTRAINTS:
- Memories can only occur when the user was at least 3 years old (earliest possible year: ${userBirthYear + 3})
- Memories cannot occur in the future
- Memories cannot occur when the user was younger than the context suggests

Based on the memory text and the user's age, infer what year this memory most likely occurred. Consider:
- Any explicit years mentioned
- Age references ("I was 10", "when I was young", etc.)
- School grades ("elementary school", "high school", etc.)
- Life events ("when I first moved", "during college", etc.)
- Time periods ("in the 90s", "back then", etc.)

Return ONLY a single 4-digit year (e.g., 1995). The year must be between ${userBirthYear + 3} and ${currentYear}. If you cannot determine a valid year, return "unknown".`;

  try {
    const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: model,
      prompt: prompt,
      stream: false,
    });

    const result = response.data.response?.trim();

    if (!result || result.toLowerCase().includes("unknown")) {
      return null;
    }

    // Try to extract a 4-digit year from the response
    const yearMatch = result.match(/\*?\*?(19|20)\d{2}\*?\*?/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0].replace(/\*/g, ""));
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        return year;
      }
    }

    return null;
  } catch (error) {
    console.error("Error inferring year:", error.message);
    return null;
  }
}

// Populate years for memories with null year
async function populateYears() {
  const memories = loadMemories();
  let updated = 0;
  let skipped = 0;

  // Get user birth year from localStorage or ask user
  // For now, we'll try to read from a config file or use a default
  let userBirthYear = null;

  try {
    const configPath = path.join(
      __dirname,
      "../frontend/src/composables/useUserProfile.js"
    );
    // Since we can't easily read user data, we'll need to prompt or use a stored value
    // For this script, we'll check if there's a way to get it
    console.log("Note: Using LLM inference with user birth year context");
    console.log("To get accurate results, please provide your birth year:");

    // For automated migration, we'll use a default or read from environment
    userBirthYear = process.env.USER_BIRTH_YEAR
      ? parseInt(process.env.USER_BIRTH_YEAR)
      : 1976;
    console.log(`Using birth year: ${userBirthYear}\n`);
  } catch (error) {
    console.log("Could not read user birth year, using default: 1976\n");
    userBirthYear = 1976;
  }

  console.log(`Found ${memories.length} memories`);
  console.log(`Processing memories with null year...`);

  for (let i = 0; i < memories.length; i++) {
    const memory = memories[i];

    console.log(
      `\n[${i + 1}/${
        memories.length
      }] Inferring year for memory: "${memory.text.substring(0, 50)}..."`
    );

    const year = await inferYear(memory.text, userBirthYear);

    if (year) {
      memory.year = year;
      updated++;
      console.log(`✓ Inferred year: ${year}`);
    } else {
      skipped++;
      console.log(`✗ Could not infer year`);
    }

    // Small delay to avoid overwhelming the LLM
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n\nMigration complete!`);
  console.log(`Updated: ${updated} memories`);
  console.log(`Skipped: ${skipped} memories (could not infer year)`);

  saveMemories(memories);
}

// Run migration
populateYears().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
