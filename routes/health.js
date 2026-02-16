import express from 'express';
import { getDB } from '../config/db.js';
import { getPineconeIndex } from '../config/pinecone.js';
import { createEmbedding } from '../utils/embedding.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const status = {
    backend: { status: 'online', message: 'Backend is running' },
    database: { status: 'checking', message: '' },
    llm: { status: 'checking', message: '' }
  };

  try {
    const db = getDB();
    await db.admin().ping();
    status.database = { status: 'connected', message: 'MongoDB connected' };
  } catch (error) {
    status.database = { status: 'error', message: error.message };
  }

  try {
    await createEmbedding('test');
    status.llm = { status: 'available', message: 'Google Gemini API working' };
  } catch (error) {
    status.llm = { status: 'error', message: error.message };
  }

  res.json(status);
});

export default router;
