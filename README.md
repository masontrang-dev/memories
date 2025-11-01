# Memory Vault - Vue 3 + Node.js Backend

A semantic memory storage application built with Vue 3 frontend and Node.js/Express backend, using Ollama for vector embeddings.

## Project Structure

```
.
├── frontend/          # Vue 3 Vite application
│   ├── src/
│   │   ├── App.vue           # Main app component
│   │   ├── components/
│   │   │   ├── MemoryForm.vue    # Add memory form
│   │   │   └── MemoryList.vue    # Display and search memories
│   │   └── main.js
│   └── package.json
└── backend/           # Node.js/Express API
    ├── server.js      # Main server with API endpoints
    ├── memories.json  # Persistent memory storage
    └── package.json
```

## Prerequisites

- Node.js (v14+)
- Ollama installed and running locally (http://localhost:11434)
- Models needed: `nomic-embed-text` (for embeddings)

## Setup & Running

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

Backend runs on: `http://localhost:3001`

### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Features

### Add Memory
- Write memories from your childhood
- Automatically converted to vector embeddings
- Stored persistently in `memories.json`

### Search Memories
- Semantic search using cosine similarity
- Find memories by meaning, not just keywords
- Results ranked by similarity score (0-100%)

### Manage Memories
- View all saved memories with timestamps
- Delete individual memories
- Real-time status updates

## API Endpoints

### Backend API (http://localhost:3001)

- `POST /api/memories` - Save a new memory
  ```json
  { "text": "memory text" }
  ```

- `GET /api/memories` - Get all memories

- `POST /api/memories/search` - Search memories semantically
  ```json
  { "query": "search query", "limit": 5 }
  ```

- `DELETE /api/memories/:id` - Delete a memory

## How It Works

1. **Memory Storage**: Memories are saved to `memories.json` with embeddings
2. **Embeddings**: Uses Ollama's `nomic-embed-text` model to convert text to vectors
3. **Search**: Calculates cosine similarity between query and stored memories
4. **Frontend**: Vue 3 app with real-time updates and smooth animations

## Technologies

- **Frontend**: Vue 3, Vite, CSS3
- **Backend**: Node.js, Express, Axios
- **Embeddings**: Ollama (nomic-embed-text)
- **Storage**: JSON file-based persistence

## Notes

- Make sure Ollama is running before starting the backend
- The backend must be running for the frontend to work
- CORS is enabled for frontend-backend communication
- Memories are stored locally in `backend/memories.json`
