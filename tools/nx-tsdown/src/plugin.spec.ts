import { describe, it, expect } from 'vitest';
import { createNodesV2 } from './plugin.js';

describe('createNodesV2', () => {
  it('provides glob pattern for tsdown configs', () => {
    const [glob] = createNodesV2;
    expect(glob).toBe('**/tsdown.config.ts');
  });
});
