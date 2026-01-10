/**
 * Health check endpoint for monitoring and deployment verification.
 *
 * @endpoint GET /api/health
 * @returns {HealthResponse} Service health status and version info
 *
 * @example Response:
 * {
 *   "status": "healthy",
 *   "version": "0.1.0",
 *   "timestamp": "2024-12-09T10:30:00.000Z",
 *   "services": {
 *     "database": "connected"
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
  };
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timestamp = new Date().toISOString();
  let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    // Test database connectivity with a simple query
    const supabase = await createClient();

    const { error } = await supabase
      .from('contractors')
      .select('id')
      .limit(1);

    databaseStatus = error ? 'disconnected' : 'connected';
  } catch {
    databaseStatus = 'disconnected';
  }

  const overallStatus: HealthResponse['status'] =
    databaseStatus === 'connected' ? 'healthy' : 'degraded';

  return NextResponse.json({
    status: overallStatus,
    version: process.env.npm_package_version || '0.1.0',
    timestamp,
    services: {
      database: databaseStatus,
    },
  });
}
