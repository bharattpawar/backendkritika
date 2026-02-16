import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const indexName = process.env.PINECONE_INDEX_NAME;
const dimension = parseInt(process.env.PINECONE_INDEX_DIMENSION || '3072', 10);
const metric = process.env.PINECONE_INDEX_METRIC || 'cosine';
const cloud = process.env.PINECONE_CLOUD || 'aws';
const region = process.env.PINECONE_REGION || process.env.PINECONE_ENVIRONMENT || 'us-east-1';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is required');
}

if (!indexName) {
  throw new Error('PINECONE_INDEX_NAME is required');
}

if (!Number.isFinite(dimension) || dimension <= 0) {
  throw new Error('PINECONE_INDEX_DIMENSION must be a positive integer');
}

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const main = async () => {
  console.log(
    `[pinecone] Recreating index "${indexName}" as dense (dimension=${dimension}, metric=${metric}, cloud=${cloud}, region=${region})`
  );

  const indexes = await pc.listIndexes();
  const exists = indexes?.indexes?.some((idx) => idx.name === indexName);

  if (exists) {
    console.log(`[pinecone] Deleting existing index "${indexName}"...`);
    await pc.deleteIndex(indexName);
    console.log('[pinecone] Existing index deleted');
  }

  console.log('[pinecone] Creating dense serverless index...');
  await pc.createIndex({
    name: indexName,
    dimension,
    metric,
    spec: {
      serverless: {
        cloud,
        region
      }
    },
    waitUntilReady: true
  });

  const description = await pc.describeIndex(indexName);
  console.log('[pinecone] Index ready:', {
    name: description?.name,
    dimension: description?.dimension,
    metric: description?.metric,
    host: description?.host,
    status: description?.status
  });
};

main().catch((error) => {
  console.error('[pinecone] Failed to recreate index:', error.message);
  process.exit(1);
});
