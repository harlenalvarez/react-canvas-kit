import cryto from 'crypto';
import { afterAll, beforeAll, vi } from 'vitest';

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: cryto.randomUUID
  }
})

beforeAll(() => {
  vi.stubGlobal('Path2D', vi.fn(() => ({
    rect: vi.fn(),
    roundRect: vi.fn(),
    arc: vi.fn()
  })));
});

afterAll(() => {
  vi.unstubAllGlobals();
});