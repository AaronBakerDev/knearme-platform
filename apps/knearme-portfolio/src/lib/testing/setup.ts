/**
 * Vitest setup file for component tests.
 *
 * Imports jest-dom matchers for DOM assertions like:
 * - toBeInTheDocument()
 * - toHaveTextContent()
 * - toBeVisible()
 * - etc.
 *
 * Also mocks commonly used browser APIs not available in jsdom.
 *
 * @see https://testing-library.com/docs/ecosystem-jest-dom/
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock clipboard API (not available in jsdom)
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock ResizeObserver (used by many UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver (used for lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords() {
    return [];
  }
};

// Mock matchMedia (used for responsive hooks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo (used by scroll animations)
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
