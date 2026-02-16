import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initMongoDB } from './config/db.js';
import { initPinecone } from './config/pinecone.js';
import uploadRoutes from './routes/upload.js';
import qaRoutes from './routes/qa.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL || `http://localhost:${PORT}`;

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.FRONTEND_URL ||
  ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no browser origin header)
    if (!origin) return callback(null, true);

    // If no explicit origins are set, allow all (useful for local quick setup)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', uploadRoutes);
app.use('/api', qaRoutes);
app.use('/api', healthRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'CodebaseQA Backend API',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload',
      github: 'POST /api/upload/github',
      ask: 'POST /api/qa/ask',
      history: 'GET /api/qa/history/:codebaseId',
      health: 'GET /api/health'
    }
  });
});

const startServer = async () => {
  try {
    await initMongoDB();
    await initPinecone();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on ${PUBLIC_BACKEND_URL}`);
      console.log(`📝 API Documentation: ${PUBLIC_BACKEND_URL}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
