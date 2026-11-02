import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import fs from 'fs';
import connectDB from './config/db.js';
// Firebase Admin is initialized as a side-effect on import
import './config/firebaseAdmin.js';
import { initSocket } from './config/socket.js';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Global Middleware ───────────────────────────────────────────────

// CORS — allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost dev servers
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    // Allow ngrok tunnels
    if (origin.endsWith('.ngrok-free.dev')) return callback(null, true);
    // Allow Vercel preview and production deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly configured origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Reject unknown origins in production, allow in development
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,                   // Max 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Please try again later.' },
});
app.use(limiter);

// Serve uploaded files statically
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ─── API Routes ──────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────

const httpServer = http.createServer(app);
initSocket(httpServer, allowedOrigins);

const start = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Event Nexus API Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { httpServer, app };
export default app;
