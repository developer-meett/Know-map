import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRouter    from './routes/auth.js';
import quizRouter    from './routes/quiz.js';
import adminRouter   from './routes/admin.js';
import reportsRouter from './routes/reports.js';
import userRouter    from './routes/user.js';

const app = express();
const PORT = process.env.PORT ?? 5001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────

// Docker Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).send('Knowmap API is running successfully!');
});

// API Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Feature routers
app.use('/api/auth',     authRouter);
app.use('/api/users',    userRouter);
app.use('/api/quizzes',  quizRouter);
app.use('/api/admin',    adminRouter);
app.use('/api/reports',  reportsRouter);

// ─── 404 catch-all ───────────────────────────────────────────────────────────

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── Boot ────────────────────────────────────────────────────────────────────

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
