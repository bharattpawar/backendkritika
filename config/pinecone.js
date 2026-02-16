import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

let pineconeClient = null;
let pineconeIndex = null;

const expectedDimension = parseInt(process.env.PINECONE_INDEX_DIMENSION || '3072', 10);

export const initPinecone = async () => {
  try {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    const indexName = process.env.PINECONE_INDEX_NAME;
    const description = await pineconeClient.describeIndex(indexName);
    const actualDimension = description?.dimension;
    const vectorType = description?.vectorType || description?.spec?.vectorType;

    if (vectorType && String(vectorType).toLowerCase() !== 'dense') {
      throw new Error(
        `Pinecone index "${indexName}" is "${vectorType}". Expected a dense index for Gemini embeddings.`
      );
    }

    if (typeof actualDimension !== 'number' || Number.isNaN(actualDimension)) {
      throw new Error(
        `Pinecone index "${indexName}" does not expose a valid dense dimension. Recreate it as dense with dimension=${expectedDimension}.`
      );
    }

    if (actualDimension !== expectedDimension) {
      throw new Error(
        `Pinecone dimension mismatch for "${indexName}": index=${actualDimension}, expected=${expectedDimension}.`
      );
    }

    pineconeIndex = pineconeClient.index(indexName);
    console.log(`✅ Pinecone connected successfully (index=${indexName}, dimension=${actualDimension})`);
    return pineconeIndex;
  } catch (error) {
    console.error('❌ Pinecone connection failed:', error.message);
    throw error;
  }
};

export const getPineconeIndex = () => {
  if (!pineconeIndex) {
    throw new Error('Pinecone not initialized. Call initPinecone() first.');
  }
  return pineconeIndex;
};
