import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const EMBEDDING_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const EXPECTED_EMBEDDING_DIMENSION = parseInt(process.env.PINECONE_INDEX_DIMENSION || '3072', 10);

export const createEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    const values = result?.embedding?.values || [];

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`Received empty embedding from model "${EMBEDDING_MODEL}"`);
    }

    if (values.length !== EXPECTED_EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: model="${EMBEDDING_MODEL}" returned ${values.length}, expected ${EXPECTED_EMBEDDING_DIMENSION}`
      );
    }

    return values;
  } catch (error) {
    console.error(`Embedding generation failed (model=${EMBEDDING_MODEL}):`, error.message);
    throw error;
  }
};

export const createLLMResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`LLM response generation failed (model=${CHAT_MODEL}):`, error.message);
    throw error;
  }
};
