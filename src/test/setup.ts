import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally for tests
globalThis.fetch = vi.fn();

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:3000/api',
  },
  writable: true,
});
