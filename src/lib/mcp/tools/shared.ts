import { PortfolioClient } from '../portfolio-client';
import type { AuthContext } from '../types';

export type ToolResult<T> = { success: true; result: T } | { success: false; error: string };

export function createClient(auth: AuthContext, baseUrl: string): PortfolioClient {
  return new PortfolioClient({ baseUrl, accessToken: auth.accessToken });
}
