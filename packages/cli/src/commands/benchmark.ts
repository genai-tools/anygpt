/**
 * Benchmark command - Re-export from modular structure
 *
 * This file maintains backward compatibility while the actual
 * implementation is split across multiple focused modules:
 *
 * - types.ts: Type definitions
 * - model-selector.ts: Model selection logic
 * - executor.ts: Benchmark execution (parallel/sequential)
 * - reporter.ts: Results formatting and output
 * - index.ts: Main orchestration
 */

export { benchmarkCommand } from './benchmark/index.js';
export type { BenchmarkOptions, BenchmarkResult } from './benchmark/types.js';
