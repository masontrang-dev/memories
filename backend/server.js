const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Default Ollama API URL (assuming default port 11434)
const OLLAMA_API_URL = "http://localhost:11434/api";

// Memory storage file
const MEMORIES_FILE = path.join(__dirname, "memories.json");

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
  } catch (error) {
    console.error("Error saving memories:", error.message);
  }
}

let memories = loadMemories();

// List available models
app.get("/api/models", async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/tags`);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching models:", error.message);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Get embeddings from Ollama
async function getEmbedding(text) {
  try {
    const response = await axios.post(`${OLLAMA_API_URL}/embeddings`, {
      model: "nomic-embed-text",
      prompt: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error("Error getting embedding:", error.message);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate tags for a memory using LLM
async function generateTags(text, model = "mistral") {
  try {
    const prompt = `Analyze this memory and extract 2-4 relevant category tags. Return ONLY the tags as a comma-separated list, nothing else. Examples of tags: childhood, cultural traditions, family, school, adventure, friendship, holiday, food, travel, learning, etc.\n\nMemory:\n${text}\n\nTags:`;
    
    const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: model,
      prompt: prompt,
      stream: false,
    });

    const tagsText = response.data.response || "";
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 4);

    return tags;
  } catch (error) {
    console.error("Error generating tags:", error.message);
    return [];
  }
}

// Generate a short summary of a memory
async function generateSummary(text, model = "mistral") {
  try {
    const prompt = `Return ONLY a brief 1-2 sentence summary of this memory. Do not include any prefix, explanation, or preamble. Just the summary itself. Keep it under 100 characters and make it engaging.\n\nMemory:\n${text}\n\nSummary:`;
    
    const response = await axios.post(`${OLLAMA_API_URL}/generate`, {
      model: model,
      prompt: prompt,
      stream: false,
    });

    let summary = (response.data.response || text).trim();
    
    // Remove common prefixes if they exist
    summary = summary.replace(/^(Here is|Here's|This is|The summary|Summary:)\s*/i, '');
    
    return summary.substring(0, 150);
  } catch (error) {
    console.error("Error generating summary:", error.message);
    return text.substring(0, 150);
  }
}

// Save a new memory
app.post("/api/memories", async (req, res) => {
  const { text, tags = null, model = "mistral", year = null, theme = null } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Memory text is required" });
  }

  try {
    const embedding = await getEmbedding(text);
    
    // Generate tags if not provided
    let memoryTags = tags;
    if (!memoryTags || memoryTags.length === 0) {
      memoryTags = await generateTags(text, model);
    }

    // Generate summary
    const summary = await generateSummary(text, model);

    const memory = {
      id: Date.now().toString(),
      text: text.trim(),
      summary: summary,
      embedding: embedding,
      tags: memoryTags,
      year: year || null,
      theme: theme || null,
      createdAt: new Date().toISOString(),
    };

    memories.push(memory);
    saveMemories(memories);

    res.json({
      success: true,
      memory: {
        id: memory.id,
        text: memory.text,
        summary: memory.summary,
        tags: memory.tags,
        year: memory.year,
        theme: memory.theme,
        createdAt: memory.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving memory:", error.message);
    res.status(500).json({
      error: "Failed to save memory",
      details: error.message,
    });
  }
});

// Get all memories
app.get("/api/memories", (req, res) => {
  const memoryList = memories.map((m) => ({
    id: m.id,
    text: m.text,
    summary: m.summary || m.text.substring(0, 150),
    tags: m.tags || [],
    year: m.year || null,
    theme: m.theme || null,
    createdAt: m.createdAt,
  }));
  res.json({ memories: memoryList });
});

// Search memories by semantic similarity
app.post("/api/memories/search", async (req, res) => {
  const { query, limit = 5 } = req.body;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const queryEmbedding = await getEmbedding(query);

    const results = memories
      .map((memory) => ({
        id: memory.id,
        text: memory.text,
        summary: memory.summary || memory.text.substring(0, 150),
        tags: memory.tags || [],
        createdAt: memory.createdAt,
        similarity: cosineSimilarity(queryEmbedding, memory.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    res.json({ results });
  } catch (error) {
    console.error("Error searching memories:", error.message);
    res.status(500).json({
      error: "Failed to search memories",
      details: error.message,
    });
  }
});

// Update memory text and/or tags
app.patch("/api/memories/:id", async (req, res) => {
  const { id } = req.params;
  const { text, tags } = req.body;

  const memory = memories.find((m) => m.id === id);

  if (!memory) {
    return res.status(404).json({ error: "Memory not found" });
  }

  try {
    // Update text if provided
    if (text && text.trim().length > 0) {
      memory.text = text.trim();
      // Regenerate embedding for updated text
      memory.embedding = await getEmbedding(memory.text);
    }

    // Update tags if provided (always update, even if empty array)
    if (tags !== undefined && Array.isArray(tags)) {
      memory.tags = tags.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0);
    }

    saveMemories(memories);

    res.json({
      success: true,
      memory: {
        id: memory.id,
        text: memory.text,
        tags: memory.tags,
        createdAt: memory.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating memory:", error.message);
    res.status(500).json({
      error: "Failed to update memory",
      details: error.message,
    });
  }
});

// Update memory tags (deprecated, use PATCH /api/memories/:id instead)
app.patch("/api/memories/:id/tags", (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;

  if (!Array.isArray(tags)) {
    return res.status(400).json({ error: "Tags must be an array" });
  }

  const memory = memories.find((m) => m.id === id);

  if (!memory) {
    return res.status(404).json({ error: "Memory not found" });
  }

  memory.tags = tags.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag.length > 0);
  saveMemories(memories);

  res.json({
    success: true,
    memory: {
      id: memory.id,
      tags: memory.tags,
    },
  });
});

// Delete a memory
app.delete("/api/memories/:id", (req, res) => {
  const { id } = req.params;
  const index = memories.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Memory not found" });
  }

  memories.splice(index, 1);
  saveMemories(memories);

  res.json({ success: true });
});

// Generate completions
app.post("/api/generate", async (req, res) => {
  const { model = "phi3", prompt, options = {} } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/generate`,
      {
        model,
        prompt,
        stream: false,
        options,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error generating completion:", error.message);
    res.status(500).json({
      error: "Failed to generate completion",
      details: error.response?.data || error.message,
    });
  }
});

// Serve memories app as default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "memories.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Memory Vault: http://localhost:${PORT}`);
  console.log(`Make sure Ollama is running on ${OLLAMA_API_URL}`);
});

module.exports = app;
