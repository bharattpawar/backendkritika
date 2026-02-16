# CodebaseQA Backend

AI-powered codebase Q&A system with vector embeddings and semantic search.

## 🎯 Features

- **ZIP Upload**: Extract and process code files
- **Vector Embeddings**: Convert code to 768-dimensional vectors using Google Gemini
- **Semantic Search**: Find relevant code using Pinecone vector database
- **LLM Responses**: Generate answers using Google Gemini Pro
- **Question History**: Store and retrieve past Q&A sessions

## 🏗️ Architecture

```
User uploads ZIP → Extract files → Generate embeddings → Store in Pinecone
User asks question → Query embedding → Vector search → LLM generates answer
```

## 📦 Tech Stack

- **Node.js + Express** - Backend server
- **MongoDB** - Store codebase metadata & Q&A history
- **Pinecone** - Vector database for semantic search
- **Google Gemini** - Embeddings (768-dim) & LLM responses
- **Multer** - File upload handling
- **AdmZip** - ZIP extraction

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/codebase-qa

# Google Gemini API Key
# Get from: https://makersuite.google.com/app/apikey
GOOGLE_GEMINI_API_KEY=your_key_here

# Pinecone API Key
# Get from: https://www.pinecone.io/
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=codebase-qa
PINECONE_ENVIRONMENT=us-east-1
```

### 3. Setup Pinecone Index

1. Go to https://www.pinecone.io/
2. Create new index:
   - **Name**: `codebase-qa`
   - **Dimensions**: `768`
   - **Metric**: `cosine`
   - **Region**: `us-east-1`

### 4. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 5. Run Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📡 API Endpoints

### Upload ZIP File
```http
POST /api/upload
Content-Type: multipart/form-data

Body: file (ZIP file)

Response:
{
  "success": true,
  "codebaseId": "uuid",
  "fileCount": 42
}
```

### Ask Question
```http
POST /api/qa/ask
Content-Type: application/json

Body:
{
  "codebaseId": "uuid",
  "question": "How does authentication work?"
}

Response:
{
  "success": true,
  "answer": "Authentication is implemented using...",
  "references": [
    {
      "filePath": "/src/auth.js",
      "code": "...",
      "lineStart": 1,
      "lineEnd": 50
    }
  ]
}
```

### Get Question History
```http
GET /api/qa/history/:codebaseId

Response:
{
  "success": true,
  "history": [
    {
      "question": "...",
      "answer": "...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Health Check
```http
GET /api/health

Response:
{
  "backend": { "status": "online", "message": "..." },
  "database": { "status": "connected", "message": "..." },
  "llm": { "status": "available", "message": "..." }
}
```

## 🔄 How It Works

### 1. File Upload & Processing

```javascript
// User uploads ZIP
// ↓
// Extract all code files (.js, .py, .java, etc.)
// ↓
// For each file:
//   - Read content
//   - Create searchable text: "File: path\n\nContent: code"
//   - Generate embedding (768 numbers)
//   - Store in Pinecone with metadata
// ↓
// Save codebase info in MongoDB
```

### 2. Question Answering

```javascript
// User asks question
// ↓
// Convert question to embedding
// ↓
// Search Pinecone for similar code (top 5 matches)
// ↓
// Build context from matched files
// ↓
// Send to LLM: "Given this code, answer: [question]"
// ↓
// Return LLM answer + code references
// ↓
// Save Q&A in history
```

## 📊 Vector Embeddings Explained

**What are embeddings?**
- Text → Array of 768 numbers
- Similar meaning = Similar numbers
- Example:
  ```
  "authentication function" → [0.23, -0.45, 0.67, ...]
  "login handler"          → [0.21, -0.43, 0.69, ...]  (similar!)
  "database connection"    → [0.89, 0.12, -0.34, ...]  (different)
  ```

**Why use embeddings?**
- Semantic search (meaning-based, not keyword-based)
- Find relevant code even if exact words don't match
- Fast similarity search with Pinecone

## 🗂️ Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── pinecone.js        # Pinecone client
├── routes/
│   ├── upload.js          # File upload & processing
│   ├── qa.js              # Question answering
│   └── health.js          # Health check
├── utils/
│   ├── embedding.js       # Google Gemini API
│   └── fileProcessor.js   # ZIP extraction & file reading
├── uploads/               # Temporary file storage
├── .env                   # Environment variables
├── server.js              # Main server
└── package.json
```

## 🔐 Security Notes

- Never commit `.env` file
- Implement rate limiting in production
- Validate file types and sizes
- Sanitize user inputs
- Use authentication for production

## 📈 Performance

- **File processing**: ~1-2 seconds per file
- **Embedding generation**: ~200-500ms per file
- **Vector search**: ~50-150ms
- **LLM response**: ~2-5 seconds

## 🐛 Troubleshooting

### MongoDB connection failed
```bash
# Check if MongoDB is running
mongod --version

# Or use MongoDB Atlas connection string
```

### Pinecone errors
- Verify API key is correct
- Check index name matches `.env`
- Ensure index dimensions = 768
- Confirm metric = cosine

### Google Gemini API errors
- Check API key is valid
- Verify API quota/limits
- Check internet connection

## 📚 Resources

- [Google Gemini API](https://ai.google.dev/docs)
- [Pinecone Docs](https://docs.pinecone.io/)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [Vector Search Explained](https://www.pinecone.io/learn/vector-search/)

## 🎓 Key Concepts

### Semantic Search
Search by meaning, not keywords. "authentication" finds "login", "auth", "user verification".

### Vector Database
Stores embeddings and finds similar vectors using cosine similarity (0-1 score).

### RAG (Retrieval Augmented Generation)
1. Retrieve relevant code (vector search)
2. Augment LLM prompt with code
3. Generate answer based on actual code

---

Made with ❤️ for CodebaseQA
