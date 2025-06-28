import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import osintRoutes from './routes/osint';
import reportRoutes from './routes/reports';
import statsRoutes from './routes/stats';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana de tiempo
  message: 'Demasiadas peticiones desde esta IP, intente de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Routes
app.use('/api/osint', osintRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0',
    service: 'infoooze-backend'
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  return res.json({
    message: 'Infoooze Web Platform API v2.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      osint: '/api/osint/tools',
      stats: '/api/stats/overview'
    }
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  return res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Infoooze Backend API v2.0 running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 OSINT Tools: http://localhost:${PORT}/api/osint/tools`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/stats/overview`);
  console.log(`📄 Reports: http://localhost:${PORT}/api/reports/list`);
});

export default app;