import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import facultyRoutes from "./routes/faculty.routes";
import adminRoutes from "./routes/admin.routes";
import attendanceRoutes from "./routes/attendance.routes";
import opportunityRoutes from "./routes/opportunity.routes";
import { authenticate } from "./middleware/authenticate";
import { upload } from "./middleware/upload.middleware";
import { initSocket } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 9000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGINS || CLIENT_URL)
  .split(",")
  .map((s) => s.trim());

// Connect to MongoDB
connectDB();

// Init Socket.io (must be before routes)
initSocket(server, ALLOWED_ORIGINS);

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later." },
});

// ── Health check (before any authenticated routes) ────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ── File Upload Route ─────────────────────────────────────────────────────────
app.post("/api/upload", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", opportunityRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`🚀 SCMS Server running on http://localhost:${PORT}`);
});

export default app;
