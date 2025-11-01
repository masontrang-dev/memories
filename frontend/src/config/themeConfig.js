export const GENERIC_INITIAL_PROMPT = "Share a memory that's meaningful to you...";

export const themes = {
  immigrant_parent: {
    id: "immigrant_parent",
    name: "My Parents' Immigrant Story",
    description: "Preserve your parents' journey and experiences",
    headerSubtitle: "Preserve your family's immigrant legacy",
    panelNames: {
      builder: "Story Builder",
      list: "Family Stories",
    },
    tags: [
      "immigration",
      "cultural_heritage",
      "family_sacrifice",
      "adaptation",
      "homeland",
      "traditions",
      "language_barrier",
      "resilience",
    ],
    initialPrompt:
      "Tell me about your parents' journey to a new country or a significant memory from their experience...",
    followUpExamples: [
      "What did they miss most from their homeland?",
      "How did they adapt to their new life?",
      "What traditions did they keep alive?",
      "What sacrifices did they make?",
      "How did this experience shape your family?",
    ],
  },

  immigrant_self: {
    id: "immigrant_self",
    name: "My Immigrant Story",
    description: "Document your own immigration journey",
    headerSubtitle: "Preserve your immigrant story",
    panelNames: {
      builder: "Memory Builder",
      list: "My Memories",
    },
    tags: [
      "immigration",
      "culture_shock",
      "belonging",
      "identity",
      "resilience",
      "family",
      "home",
      "growth",
      "adaptation",
    ],
    initialPrompt:
      "Share a memory from your immigration journey or experience adapting to a new country...",
    followUpExamples: [
      "How did this moment change your perspective?",
      "Who was with you during this experience?",
      "What did you learn from this?",
      "How did you feel at that moment?",
      "What made this memory significant?",
    ],
  },

  general_childhood: {
    id: "general_childhood",
    name: "Childhood Memories",
    description: "Capture your favorite childhood moments",
    headerSubtitle: "Preserve your precious moments",
    panelNames: {
      builder: "Memory Builder",
      list: "Memory Bank",
    },
    tags: [
      "childhood",
      "family",
      "school",
      "adventure",
      "friendship",
      "holiday",
      "food",
      "travel",
      "learning",
      "play",
    ],
    initialPrompt:
      "Start by sharing a memory from your childhood that stands out to you...",
    followUpExamples: [
      "What did it smell like?",
      "Who else was there?",
      "How did it make you feel?",
      "What happened next?",
      "Why does this memory matter to you?",
    ],
  },

  family_history: {
    id: "family_history",
    name: "Family History",
    description: "Document your family's stories across generations",
    headerSubtitle: "Preserve your family's history",
    panelNames: {
      builder: "Story Builder",
      list: "Family Archive",
    },
    tags: [
      "family",
      "ancestors",
      "traditions",
      "legacy",
      "heritage",
      "generations",
      "values",
      "stories",
      "milestones",
    ],
    initialPrompt:
      "Share a family story or memory that has been passed down or is important to your family...",
    followUpExamples: [
      "Who in your family should know this story?",
      "What makes this story important?",
      "How does this connect to your family's values?",
      "What generation does this involve?",
      "How has this story influenced your family?",
    ],
  },
};

export const getTheme = (themeId) => {
  return themes[themeId] || themes.general_childhood;
};

export const getAllThemes = () => {
  return Object.values(themes);
};
