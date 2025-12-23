/**
 * KnearMe MCP Server Entry Point.
 *
 * This is the main entry point for the MCP server that powers the
 * contractor ChatGPT app integration.
 *
 * @see /docs/chatgpt-apps-sdk/ARCHITECTURE.md
 */

import 'dotenv/config';
import express from 'express';
import { createMcpHandler } from './server.js';
import { createDevToken } from './auth/token-validator.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const PORTFOLIO_API_URL = process.env.PORTFOLIO_API_URL || 'http://localhost:3000';
const IS_DEV = process.env.NODE_ENV !== 'production';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'knearme-mcp-server' });
});

// Dev token endpoint (development only)
if (IS_DEV) {
  app.post('/dev/token', async (req, res) => {
    try {
      const { contractor_id, email } = req.body;
      if (!contractor_id) {
        res.status(400).json({ error: 'contractor_id required' });
        return;
      }
      const token = await createDevToken(contractor_id, email || 'dev@test.com');
      res.json({ token, expires_in: 3600 });
    } catch (err) {
      console.error('[Dev Token] Error:', err);
      res.status(500).json({ error: 'Failed to create token' });
    }
  });
}

// MCP endpoint - handles the MCP protocol
app.post('/mcp', createMcpHandler(PORTFOLIO_API_URL));

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[MCP Server Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[MCP Server] Running on port ${PORT}`);
  console.log(`[MCP Server] Portfolio API: ${PORTFOLIO_API_URL}`);
  console.log(`[MCP Server] Mode: ${IS_DEV ? 'development' : 'production'}`);
  console.log(`[MCP Server] Endpoints:`);
  console.log(`  - GET  /health`);
  console.log(`  - POST /mcp`);
  if (IS_DEV) {
    console.log(`  - POST /dev/token (dev only)`);
  }
});
