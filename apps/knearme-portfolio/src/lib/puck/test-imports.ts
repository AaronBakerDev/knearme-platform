/**
 * Puck Editor Import Test
 *
 * This file verifies that @puckeditor/core is properly installed and
 * TypeScript types are available. It tests the core imports needed
 * for the visual page builder integration.
 *
 * @see PUCK-001 in PRD for acceptance criteria
 */

import { Puck, Render, type Config, type Data } from '@puckeditor/core';

// Type-check: Verify Config type is available and has expected shape
type TestConfig = Config<{
  TestBlock: {
    title: string;
    description: string;
  };
}>;

// Type-check: Verify Data type is available
type TestData = Data;

// Export to prevent "unused" warnings and confirm imports work
export { Puck, Render };
export type { TestConfig, TestData };

// Simple runtime check - this will be tree-shaken in production
export const PUCK_INSTALLED = true;
