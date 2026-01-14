/**
 * KnearMe Platform - Main Application Entry Point
 * Cloudflare Workers application for contractor story platform
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Route handlers
import { contractorRoutes } from './routes/contractors.js';
import { storyRoutes } from './routes/stories.js';
import { apiRoutes } from './routes/api.js';
import { publicRoutes } from './routes/public.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://knearme.co', 'https://www.knearme.co'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', prettyJSON());
app.use('*', rateLimitMiddleware);

// Public routes (no auth required)
app.route('/', publicRoutes);

// API routes (require authentication)
app.use('/api/*', authMiddleware);
app.route('/api/contractors', contractorRoutes);
app.route('/api/stories', storyRoutes);
app.route('/api', apiRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'knearme-platform',
    version: '1.0.0'
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message 
  }, 500);
});

export default app;