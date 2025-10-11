/**
 * Benchmark execution logic (parallel and sequential)
 */

import { Readable } from 'stream';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveModelConfig } from '@anygpt/config';
import type { CLIContext } from '../../utils/cli-context.js';
import type {
  BenchmarkOptions,
  BenchmarkResult,
  ModelToTest,
} from './types.js';

/**
 * Execute benchmark for a single model with iterations
 */
export async function benchmarkModel(
  context: CLIContext,
  provider: string,
  model: string,
  prompt: string,
  options: BenchmarkOptions,
  outputDir?: string
): Promise<BenchmarkResult> {
  const { router, providers } = context;
  const iterations = options.iterations || 1;
  const maxTokens = options.maxTokens;
  const iterationResults: BenchmarkResult[] = [];

  for (let i = 0; i < iterations; i++) {
    if (!options.json && iterations > 1) {
      process.stdout.write(`⏳ ${model} (${i + 1}/${iterations}) `);
    } else if (!options.json) {
      process.stdout.write(`⏳ ${model} `);
    }

    const startTime = Date.now();
    let result: BenchmarkResult;

    try {
      // Resolve model configuration using rule matching
      const providerConfig = providers[provider];
      const globalRules = context.defaults?.modelRules;
      const modelConfig = resolveModelConfig(
        model,
        provider,
        providerConfig,
        globalRules
      );

      // CLI flag takes precedence over model config for max_tokens
      const effectiveMaxTokens = maxTokens ?? modelConfig.max_tokens;

      // Debug logging
      if (process.env.DEBUG_BENCHMARK) {
        console.log(`\n[DEBUG] Calling router.chatCompletion with:`);
        console.log(`  provider: ${provider}`);
        console.log(`  model: ${model}`);
        console.log(`  prompt: ${prompt}`);
        console.log(`  max_tokens: ${effectiveMaxTokens}`);
        console.log(`  reasoning: ${JSON.stringify(modelConfig?.reasoning)}`);
      }

      const response = await router.chatCompletion({
        provider,
        model,
        messages: [{ role: 'user', content: prompt }],
        ...(effectiveMaxTokens !== undefined && {
          max_tokens: effectiveMaxTokens,
        }),
        ...(modelConfig.reasoning && { reasoning: modelConfig.reasoning }),
        ...(modelConfig.extra_body && { extra_body: modelConfig.extra_body }),
      });

      const responseTime = Date.now() - startTime;
      const responseContent = response.choices[0]?.message?.content || '';
      const responseSize = responseContent.length;

      result = {
        provider,
        model,
        status: 'success',
        responseTime,
        responseSize,
        tokenUsage: response.usage
          ? {
              prompt: response.usage.prompt_tokens,
              completion: response.usage.completion_tokens,
              total: response.usage.total_tokens,
            }
          : undefined,
        finishReason: response.choices[0]?.finish_reason,
        response: responseContent,
      };

      if (!options.json) {
        // Clear the line and rewrite with success
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console.log(`✅ ${model} ${responseTime}ms (${responseSize} chars)`);
      }

      // Save response to file if output directory specified
      if (outputDir) {
        saveResponseToFile(
          outputDir,
          provider,
          model,
          i + 1,
          iterations,
          prompt,
          result,
          responseContent
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      result = {
        provider,
        model,
        status: 'error',
        responseTime,
        responseSize: 0,
        error: error instanceof Error ? error.message : String(error),
      };

      if (!options.json) {
        // Clear the line and rewrite with error
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console.log(
          `❌ ${model} ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    iterationResults.push(result);
  }

  // Calculate average if multiple iterations
  return calculateAverageResult(iterationResults, provider, model, iterations);
}

/**
 * Execute benchmarks in parallel using Readable.from().map()
 */
export async function executeParallel(
  context: CLIContext,
  modelsToTest: ModelToTest[],
  prompt: string,
  options: BenchmarkOptions,
  outputDir?: string
): Promise<BenchmarkResult[]> {
  const concurrency = options.concurrency || 3;
  const results: BenchmarkResult[] = [];

  if (!options.json) {
    console.log(`⚡ Running in parallel mode (concurrency: ${concurrency})\n`);
  }

  const stream = Readable.from(modelsToTest).map(
    async ({ provider, model }) => {
      return await benchmarkModel(
        context,
        provider,
        model,
        prompt,
        options,
        outputDir
      );
    },
    { concurrency } // CRITICAL: Limit concurrent operations
  );

  // Collect results from stream
  for await (const result of stream) {
    results.push(result);
  }

  return results;
}

/**
 * Execute benchmarks sequentially (original behavior)
 */
export async function executeSequential(
  context: CLIContext,
  modelsToTest: ModelToTest[],
  prompt: string,
  options: BenchmarkOptions,
  outputDir?: string
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const { provider, model } of modelsToTest) {
    const result = await benchmarkModel(
      context,
      provider,
      model,
      prompt,
      options,
      outputDir
    );
    results.push(result);
  }

  return results;
}

/**
 * Calculate average result from multiple iterations
 */
function calculateAverageResult(
  iterationResults: BenchmarkResult[],
  provider: string,
  model: string,
  iterations: number
): BenchmarkResult {
  if (iterations > 1) {
    const successfulRuns = iterationResults.filter(
      (r) => r.status === 'success'
    );
    if (successfulRuns.length > 0) {
      const avgTime =
        successfulRuns.reduce((sum, r) => sum + r.responseTime, 0) /
        successfulRuns.length;
      const avgSize =
        successfulRuns.reduce((sum, r) => sum + r.responseSize, 0) /
        successfulRuns.length;
      const avgTokens = successfulRuns[0].tokenUsage
        ? {
            prompt: Math.round(
              successfulRuns.reduce(
                (sum, r) => sum + (r.tokenUsage?.prompt || 0),
                0
              ) / successfulRuns.length
            ),
            completion: Math.round(
              successfulRuns.reduce(
                (sum, r) => sum + (r.tokenUsage?.completion || 0),
                0
              ) / successfulRuns.length
            ),
            total: Math.round(
              successfulRuns.reduce(
                (sum, r) => sum + (r.tokenUsage?.total || 0),
                0
              ) / successfulRuns.length
            ),
          }
        : undefined;

      return {
        provider,
        model,
        status: 'success',
        responseTime: Math.round(avgTime),
        responseSize: Math.round(avgSize),
        tokenUsage: avgTokens,
        finishReason: successfulRuns[0].finishReason,
        response: successfulRuns[0].response,
      };
    } else {
      return iterationResults[0]; // Use first error
    }
  } else {
    return iterationResults[0];
  }
}

/**
 * Save individual response to file
 */
function saveResponseToFile(
  outputDir: string,
  provider: string,
  model: string,
  iteration: number,
  totalIterations: number,
  prompt: string,
  result: BenchmarkResult,
  responseContent: string
): void {
  const sanitizedProvider = provider.replace(/[^a-z0-9]/gi, '_');
  const sanitizedModel = model.replace(/[^a-z0-9]/gi, '_');
  const filename = `${sanitizedProvider}_${sanitizedModel}_${iteration}.txt`;
  const filepath = join(outputDir, filename);
  const fileContent = `# Benchmark Result
Provider: ${provider}
Model: ${model}
Iteration: ${iteration}/${totalIterations}
Response Time: ${result.responseTime}ms
Response Size: ${result.responseSize} chars
Finish Reason: ${result.finishReason}
${
  result.tokenUsage
    ? `Token Usage: ${result.tokenUsage.prompt} prompt + ${result.tokenUsage.completion} completion = ${result.tokenUsage.total} total`
    : ''
}

## Prompt
${prompt}

## Response
${responseContent}
`;
  writeFileSync(filepath, fileContent, 'utf-8');
}
