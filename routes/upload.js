import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractZip, getAllFiles, readFileContent, cleanupDirectory } from '../utils/fileProcessor.js';
import { createEmbedding } from '../utils/embedding.js';
import { getPineconeIndex } from '../config/pinecone.js';
import { getDB } from '../config/db.js';

const router = express.Router();
const uploadRootDir = process.env.UPLOAD_DIR || './uploads';
const uploadRootPath = path.resolve(uploadRootDir);

const ensureUploadRootExists = () => {
  if (!fs.existsSync(uploadRootPath)) {
    fs.mkdirSync(uploadRootPath, { recursive: true });
    console.log(`[UPLOAD] Created upload directory at ${uploadRootPath}`);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadRootExists();
    cb(null, uploadRootPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const uploadStartTime = Date.now();
  const requestId = `upload-${uploadStartTime}`;
  const codebaseId = uuidv4();
  const zipPath = req.file?.path;
  const extractPath = path.join(uploadRootPath, codebaseId);

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ZIP file is required (field: file)' });
    }

    console.log(`[${requestId}] Upload started`);
    console.log(
      `[${requestId}] Incoming ZIP: name=${req.file.originalname}, size=${req.file.size} bytes, mime=${req.file.mimetype}`
    );
    console.log(`[${requestId}] ZIP temp path: ${zipPath}`);
    console.log(`[${requestId}] Extract path: ${extractPath}`);

    await extractZip(zipPath, extractPath);
    console.log(`[${requestId}] ZIP extraction complete`);

    const files = getAllFiles(extractPath);
    console.log(`[${requestId}] Found ${files.length} code files`);

    const pineconeIndex = getPineconeIndex();
    const db = getDB();
    const vectors = [];
    let processedFiles = 0;
    let skippedFiles = 0;
    let upsertedVectors = 0;
    let batchCount = 0;

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      console.log(`[${requestId}] [${i + 1}/${files.length}] Reading file: ${filePath}`);

      const content = readFileContent(filePath);
      if (!content || content.length < 10) {
        skippedFiles++;
        console.log(
          `[${requestId}] [${i + 1}/${files.length}] Skipped file (empty or too short): ${filePath}`
        );
        continue;
      }

      const relativePath = filePath.replace(extractPath, '').replace(/\\/g, '/');
      const searchableText = `File: ${relativePath}\n\nContent:\n${content}`;

      console.log(
        `[${requestId}] [${i + 1}/${files.length}] Generating embedding for ${relativePath} (chars=${searchableText.length})`
      );
      const embedding = await createEmbedding(searchableText);
      console.log(
        `[${requestId}] [${i + 1}/${files.length}] Embedding ready for ${relativePath} (dimensions=${embedding.length}, preview=[${embedding
          .slice(0, 5)
          .map((v) => Number(v).toFixed(4))
          .join(', ')}])`
      );

      vectors.push({
        id: `${codebaseId}-${Buffer.from(relativePath).toString('base64')}`,
        values: embedding,
        metadata: {
          codebaseId,
          filePath: relativePath,
          content: content.substring(0, 5000)
        }
      });
      processedFiles++;

      if (vectors.length >= 10) {
        batchCount++;
        console.log(`[${requestId}] Upserting batch ${batchCount} (${vectors.length} vectors) to Pinecone`);
        await pineconeIndex.upsert(vectors);
        upsertedVectors += vectors.length;
        console.log(`[${requestId}] Batch ${batchCount} upsert complete`);
        vectors.length = 0;
      }
    }

    if (vectors.length > 0) {
      batchCount++;
      console.log(`[${requestId}] Upserting final batch ${batchCount} (${vectors.length} vectors) to Pinecone`);
      await pineconeIndex.upsert(vectors);
      upsertedVectors += vectors.length;
      console.log(`[${requestId}] Final batch upsert complete`);
    }

    await db.collection('codebases').insertOne({
      codebaseId,
      uploadedAt: new Date(),
      fileCount: files.length
    });

    cleanupDirectory(extractPath);
    cleanupDirectory(zipPath);

    const totalMs = Date.now() - uploadStartTime;
    const summary = {
      codebaseId,
      discoveredFiles: files.length,
      processedFiles,
      skippedFiles,
      vectorsUpserted: upsertedVectors,
      upsertBatches: batchCount,
      durationMs: totalMs
    };
    console.log(`[${requestId}] Upload complete`, summary);

    res.json({ success: true, codebaseId, fileCount: files.length, processingSummary: summary });
  } catch (error) {
    console.error(`[${requestId}] Upload error:`, error);
    cleanupDirectory(extractPath);
    cleanupDirectory(zipPath);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload/github', async (req, res) => {
  res.status(501).json({ error: 'GitHub upload not implemented yet' });
});

export default router;
