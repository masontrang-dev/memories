import { ref } from "vue";

let debounceTimer = null;

const STATE_ABBREVIATIONS = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

const ABBR_TO_STATE = Object.fromEntries(
  Object.entries(STATE_ABBREVIATIONS).map(([state, abbr]) => [
    abbr.toLowerCase(),
    state.charAt(0).toUpperCase() + state.slice(1),
  ])
);

export function useLocationSearch() {
  const searchCity = async (query) => {
    if (!query.trim() || query.length < 2) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(query)}&country=united%20states&format=json&limit=10`
      );
      const results = await response.json();
      console.log("API results for", query, results);

      const filtered = results
        .map((result) => {
          const cityName = result.name || "";
          const displayName = result.display_name || "";
          
          // Extract state from display_name (format: "City, County, State, Country")
          const parts = displayName.split(",").map((p) => p.trim());
          let state = "";
          let stateAbbr = "";
          
          // State is usually the second-to-last part before "United States"
          if (parts.length >= 2) {
            const statePart = parts[parts.length - 2];
            state = statePart;
            stateAbbr = STATE_ABBREVIATIONS[state.toLowerCase()] || state;
          }
          
          return {
            name: cityName,
            state: state,
            abbr: stateAbbr,
          };
        })
        .filter((item) => item.name && item.abbr)
        .slice(0, 10);
      
      console.log("Filtered results:", filtered);
      return filtered;
    } catch (error) {
      console.error("Error searching cities:", error);
      return [];
    }
  };

  const debouncedSearchCity = (query, callback) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchCity(query).then(callback);
    }, 300);
  };

  const searchState = (query) => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();

    const matches = [];
    for (const [stateName, abbr] of Object.entries(STATE_ABBREVIATIONS)) {
      if (
        stateName.startsWith(lowerQuery) ||
        abbr.toLowerCase().startsWith(lowerQuery)
      ) {
        matches.push({
          name: stateName.charAt(0).toUpperCase() + stateName.slice(1),
          abbr: abbr,
        });
      }
    }
    return matches.slice(0, 10);
  };

  const parseLocationString = async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(",").map((p) => p.trim());

    if (parts.length === 2) {
      const cityName = parts[0];
      const stateInput = parts[1];

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(stateInput)}&country=united%20states&format=json&limit=1`
        );
        const results = await response.json();

        if (results.length > 0) {
          const result = results[0];
          const state = result.address.state || stateInput;
          const stateAbbr =
            STATE_ABBREVIATIONS[state.toLowerCase()] ||
            stateInput.toUpperCase();
          return {
            city: result.address.city || cityName,
            state: state,
            stateAbbr: stateAbbr,
            country: "United States",
          };
        }
      } catch (error) {
        console.error("Error parsing location:", error);
      }
    }

    return null;
  };

  return {
    searchCity,
    debouncedSearchCity,
    searchState,
    parseLocationString,
  };
}
