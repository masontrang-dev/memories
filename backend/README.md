# Ollama Backend

A simple Express.js backend to interact with Ollama's local API.

## Prerequisites

1. Node.js (v14 or later)
2. Ollama installed and running locally (default: http://localhost:11434)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

## API Endpoints

### List available models
```
GET /api/models
```

### Generate text
```
POST /api/generate
{
  "model": "llama2",  // optional, defaults to 'llama2'
  "prompt": "Your prompt here",
  "options": {
    // optional generation parameters
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 100
  }
}
```

## Example Usage with curl

List models:
```bash
curl http://localhost:3001/api/models
```

Generate text:
```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me a short story about AI"}'
```
