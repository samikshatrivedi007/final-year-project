import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import facultyRoutes from './routes/faculty.routes';
import adminRoutes from './routes/admin.routes';
import { authenticate } from './middleware/authenticate';
import { upload } from './middleware/upload.middleware';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Connect to MongoDB
connectDB();

// Init Socket.io (must be before routes)
initSocket(server, CLIENT_URL);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static file access
}));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (accessible to authenticated users via signed URL check or just open)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting on auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
});

// ── File Upload Route ─────────────────────────────────────────────────────────
// POST /api/upload — single file, authenticated
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`🚀 SCMS Server running on http://localhost:${PORT}`);
});

export default app;
