# 🚀 Complete Setup Guide

## Step 1: Install Node.js

Download and install Node.js 18+ from https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

## Step 2: Install MongoDB

### Option A: Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB:
```bash
mongod
```

### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 Free tier)
4. Get connection string:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codebase-qa
```

## Step 3: Setup Google Gemini API

1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

**Important**: Keep this key secret!

## Step 4: Setup Pinecone

1. Go to https://www.pinecone.io/
2. Sign up (free tier available)
3. Create new project
4. Create index:
   - Click "Create Index"
   - **Index Name**: `codebase-qa`
   - **Dimensions**: `768` (important!)
   - **Metric**: `cosine`
   - **Region**: Choose nearest (e.g., `us-east-1`)
5. Copy API key from dashboard

## Step 5: Configure Backend

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your keys:
```bash
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/codebase-qa
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/codebase-qa

# Google Gemini
GOOGLE_GEMINI_API_KEY=AIzaSyC...your_key_here

# Pinecone
PINECONE_API_KEY=pcsk_...your_key_here
PINECONE_INDEX_NAME=codebase-qa
PINECONE_ENVIRONMENT=us-east-1

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

## Step 6: Start Backend

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Pinecone connected successfully
🚀 Server running on http://localhost:5000
```

## Step 7: Test Backend

Open browser and go to:
```
http://localhost:5000
```

You should see API documentation.

Test health endpoint:
```
http://localhost:5000/api/health
```

## Step 8: Configure Frontend

1. Navigate to frontend folder:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
VITE_API_URL=http://localhost:5000
```

4. Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Step 9: Test Complete Flow

1. Open `http://localhost:3000`
2. Upload a ZIP file with code
3. Wait for processing
4. Ask a question about your code
5. Get AI-powered answer with code references!

## 🐛 Common Issues

### Issue: MongoDB connection failed
**Solution**: 
- Check if MongoDB is running: `mongod`
- Verify connection string in `.env`
- For Atlas, check IP whitelist (allow 0.0.0.0/0 for testing)

### Issue: Pinecone connection failed
**Solution**:
- Verify API key is correct
- Check index name matches `.env`
- Ensure index dimensions = 768
- Confirm metric = cosine

### Issue: Google Gemini API error
**Solution**:
- Check API key is valid
- Verify you have API quota
- Try regenerating API key

### Issue: File upload fails
**Solution**:
- Check file size < 50MB
- Ensure `uploads/` folder exists
- Verify file is valid ZIP

### Issue: CORS error
**Solution**:
- Backend should have `cors` enabled (already configured)
- Check frontend `.env` has correct backend URL

## 📊 Verify Everything Works

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "backend": { "status": "online" },
  "database": { "status": "connected" },
  "llm": { "status": "available" }
}
```

### Test 2: Upload Test
Create a test ZIP with a simple file:
```javascript
// test.js
function hello() {
  console.log("Hello World");
}
```

Upload via frontend or curl:
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test.zip"
```

### Test 3: Ask Question
```bash
curl -X POST http://localhost:5000/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{
    "codebaseId": "your-codebase-id",
    "question": "What does this code do?"
  }'
```

## 🎉 Success!

If all tests pass, your CodebaseQA system is ready!

## 📚 Next Steps

- Upload your actual codebase
- Ask questions about your code
- Explore the Q&A history
- Check system status

## 💡 Tips

1. **Large codebases**: Processing may take 1-2 minutes
2. **Better questions**: Be specific ("How does auth work?" vs "Explain code")
3. **History**: Last 10 questions are saved per codebase
4. **New upload**: Clears previous codebase data

---

Need help? Check README.md for detailed documentation!
