/**
 * Benchmark command types and interfaces
 */

export interface BenchmarkOptions {
  provider?: string;
  model?: string;
  models?: string;
  prompt?: string;
  maxTokens?: number;
  iterations?: number;
  json?: boolean;
  output?: string;
  all?: boolean;
  stdin?: boolean;
  filterTags?: string; // Comma-separated tags, use ! prefix for exclusion
  parallel?: boolean; // Run models in parallel
  concurrency?: number; // Max parallel requests (default: 3)
}

export interface BenchmarkResult {
  provider: string;
  model: string;
  status: 'success' | 'error';
  responseTime: number;
  responseSize: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: string;
  error?: string;
  response?: string;
}

export interface ModelToTest {
  provider: string;
  model: string;
}
