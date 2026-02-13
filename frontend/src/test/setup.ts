import '@testing-library/jest-dom/vitest';

class ResizeObserverMock {
  observe(): void {
    // no-op for test environment
  }

  unobserve(): void {
    // no-op for test environment
  }

  disconnect(): void {
    // no-op for test environment
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
