/**
 * Benchmark command - Main orchestration
 */

import { mkdirSync, existsSync } from 'fs';
import type { CLIContext } from '../../utils/cli-context.js';
import type { BenchmarkOptions } from './types.js';
import { selectModels } from './model-selector.js';
import { executeParallel, executeSequential } from './executor.js';
import { outputResults, saveSummaryJson } from './reporter.js';

export async function benchmarkCommand(
  context: CLIContext,
  options: BenchmarkOptions
) {
  // Get prompt from stdin, option, or default
  const prompt = await getPrompt(options);

  // Select models to benchmark
  const modelsToTest = await selectModels(context, options);

  if (modelsToTest.length === 0) {
    console.error(
      'No models to benchmark. Specify --provider, --model, --models, or --all'
    );
    process.exit(1);
  }

  const iterations = options.iterations || 1;
  const maxTokens = options.maxTokens;

  // Create output directory if specified
  let outputDir: string | undefined;
  if (options.output) {
    outputDir = options.output;
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    if (!options.json) {
      console.log(`📁 Output directory: ${outputDir}\n`);
    }
  }

  // Print benchmark header
  if (!options.json) {
    console.log(
      `🔬 Benchmarking ${modelsToTest.length} model(s) with ${iterations} iteration(s)\n`
    );
    console.log(`Prompt: "${prompt}"`);
    if (maxTokens !== undefined) {
      console.log(`Max tokens: ${maxTokens}`);
    }
    console.log();
  }

  // Execute benchmarks (parallel or sequential)
  const results = options.parallel
    ? await executeParallel(context, modelsToTest, prompt, options, outputDir)
    : await executeSequential(
        context,
        modelsToTest,
        prompt,
        options,
        outputDir
      );

  // Save summary JSON if output directory specified
  if (outputDir && !options.json) {
    saveSummaryJson(outputDir, prompt, maxTokens, iterations, results);
  }

  // Output results
  outputResults(results, options);
}

/**
 * Get prompt from stdin, option, or default
 */
async function getPrompt(options: BenchmarkOptions): Promise<string> {
  let prompt = options.prompt;

  // Auto-detect stdin if it's piped (not a TTY) or if --stdin flag is set
  const hasStdin = options.stdin || (!process.stdin.isTTY && !options.prompt);

  if (hasStdin) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    prompt = Buffer.concat(chunks).toString('utf-8').trim();
  }

  if (!prompt) {
    prompt = 'What is 2+2? Answer in one sentence.';
  }

  return prompt;
}
