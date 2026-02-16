import express from 'express';
import { createEmbedding, createLLMResponse } from '../utils/embedding.js';
import { getPineconeIndex } from '../config/pinecone.js';
import { getDB } from '../config/db.js';

const router = express.Router();

router.post('/qa/ask', async (req, res) => {
  const { codebaseId, question } = req.body;

  if (!codebaseId || !question) {
    return res.status(400).json({ error: 'codebaseId and question are required' });
  }

  try {
    const queryEmbedding = await createEmbedding(question);
    const pineconeIndex = getPineconeIndex();

    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: { codebaseId }
    });

    if (!searchResults.matches || searchResults.matches.length === 0) {
      return res.json({
        answer: 'No relevant code found for your question.',
        references: []
      });
    }

    const relevantCode = searchResults.matches.map(match => ({
      filePath: match.metadata.filePath,
      content: match.metadata.content,
      score: match.score
    }));

    const context = relevantCode.map((item, idx) => 
      `[File ${idx + 1}: ${item.filePath}]\n${item.content}\n`
    ).join('\n---\n\n');

    const prompt = `You are a code analysis assistant. A user has asked a question about their codebase.

User Question: "${question}"

Relevant Code Files:
${context}

Instructions:
1. Analyze the provided code files
2. Answer the user's question clearly and concisely
3. Reference specific files and code sections when explaining
4. If the code shows how something works, explain the flow step-by-step
5. Keep your answer focused and practical

Answer:`;

    const llmAnswer = await createLLMResponse(prompt);

    const references = relevantCode.map(item => ({
      filePath: item.filePath,
      code: item.content.substring(0, 1000),
      lineStart: 1,
      lineEnd: Math.min(50, item.content.split('\n').length)
    }));

    const db = getDB();
    await db.collection('qa_history').insertOne({
      codebaseId,
      question,
      answer: llmAnswer,
      references,
      timestamp: new Date()
    });

    res.json({
      success: true,
      answer: llmAnswer,
      references
    });

  } catch (error) {
    console.error('Q&A error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/qa/history/:codebaseId', async (req, res) => {
  try {
    const db = getDB();
    const history = await db.collection('qa_history')
      .find({ codebaseId: req.params.codebaseId })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    res.json({ success: true, history });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
