import { useToast } from "./useToast";

const API_URL = "http://localhost:3001";

export function useProfileParsing() {
  const { error: showError } = useToast();

  const parseProfileFromText = async (text, selectedModel) => {
    try {
      const prompt = `Extract personal information from this text and return ONLY a JSON object (no markdown, no explanation):
{
  "name": "person's name or null",
  "birthYear": number or null,
  "currentAge": number or null,
  "country": "current country or null",
  "immigrationYear": number or null,
  "immigrationCountry": "country they immigrated from or null"
}

Text: "${text}"

Return ONLY valid JSON, nothing else.`;

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
        throw new Error("Failed to parse profile");
      }

      const data = await response.json();
      const responseText = data.response.trim();

      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and clean data
      return {
        name: parsed.name || "",
        birthYear: parsed.birthYear ? parseInt(parsed.birthYear) : null,
        currentAge: parsed.currentAge ? parseInt(parsed.currentAge) : null,
        country: parsed.country || "",
        immigrationYear: parsed.immigrationYear ? parseInt(parsed.immigrationYear) : null,
        immigrationCountry: parsed.immigrationCountry || "",
      };
    } catch (err) {
      console.error("Error parsing profile:", err);
      showError("Could not parse profile. Please enter manually.");
      return null;
    }
  };

  return {
    parseProfileFromText,
  };
}
