/**
 * Benchmark results reporting and formatting
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import type { BenchmarkOptions, BenchmarkResult } from './types.js';

/**
 * Output benchmark results in table or JSON format
 */
export function outputResults(
  results: BenchmarkResult[],
  options: BenchmarkOptions
): void {
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printResultsTable(results);
    printSummary(results);
    printErrorReport(results);
  }
}

/**
 * Print results in table format
 */
function printResultsTable(results: BenchmarkResult[]): void {
  console.log('\n📊 Benchmark Results:\n');

  // Sort by response time (successful ones first)
  const sortedResults = [...results].sort((a, b) => {
    if (a.status === 'success' && b.status === 'error') return -1;
    if (a.status === 'error' && b.status === 'success') return 1;
    return a.responseTime - b.responseTime;
  });

  // Calculate column widths dynamically
  const maxProviderLen = Math.max(
    ...sortedResults.map((r) => r.provider.length),
    8
  );
  const maxModelLen = Math.max(...sortedResults.map((r) => r.model.length), 5);
  const providerWidth = Math.min(maxProviderLen, 20);
  const modelWidth = Math.min(maxModelLen, 60);
  const totalWidth = providerWidth + modelWidth + 40; // +40 for other columns and padding

  // Print table header
  const headerLine = '─'.repeat(totalWidth);
  console.log(`┌${headerLine}┐`);
  console.log(
    `│ ${'Provider'.padEnd(providerWidth)} │ ${'Model'.padEnd(
      modelWidth
    )} │ Status │  Time   │  Size │ Tokens │`
  );
  console.log(`├${headerLine}┤`);

  for (const result of sortedResults) {
    const provider = result.provider
      .substring(0, providerWidth)
      .padEnd(providerWidth);
    const model = result.model.substring(0, modelWidth).padEnd(modelWidth);
    const status = result.status === 'success' ? '✅ OK ' : '❌ ERR';
    const time = `${result.responseTime}ms`.padEnd(7);
    const size = `${result.responseSize}ch`.padEnd(5);
    const tokens = result.tokenUsage
      ? `${result.tokenUsage.total}`.padEnd(6)
      : '-'.padEnd(6);

    console.log(
      `│ ${provider} │ ${model} │ ${status} │ ${time} │ ${size} │ ${tokens} │`
    );
  }

  console.log(`└${headerLine}┘`);
}

/**
 * Print summary statistics
 */
function printSummary(results: BenchmarkResult[]): void {
  const successful = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'error');

  if (successful.length > 0) {
    const fastest = successful.reduce((min, r) =>
      r.responseTime < min.responseTime ? r : min
    );
    const slowest = successful.reduce((max, r) =>
      r.responseTime > max.responseTime ? r : max
    );

    console.log('\n📈 Summary:');
    console.log(`  Total: ${results.length} models`);
    console.log(`  Successful: ${successful.length}`);
    console.log(`  Failed: ${failed.length}`);
    console.log(
      `  Fastest: ${fastest.responseTime}ms (${fastest.provider}:${fastest.model})`
    );
    console.log(
      `  Slowest: ${slowest.responseTime}ms (${slowest.provider}:${slowest.model})`
    );
    console.log(
      `  Average: ${Math.round(
        successful.reduce((sum, r) => sum + r.responseTime, 0) /
          successful.length
      )}ms`
    );
  }
}

/**
 * Print error report for failed models
 */
function printErrorReport(results: BenchmarkResult[]): void {
  const failed = results.filter((r) => r.status === 'error');

  if (failed.length > 0) {
    console.log('\n❌ Error Report:\n');
    for (const result of failed) {
      console.log(`  ${result.provider}:${result.model}`);
      console.log(`    ${result.error}`);
      console.log('');
    }
  }
}

/**
 * Save summary JSON to file
 */
export function saveSummaryJson(
  outputDir: string,
  prompt: string,
  maxTokens: number | undefined,
  iterations: number,
  results: BenchmarkResult[]
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = join(outputDir, `benchmark-summary-${timestamp}.json`);
  const summary = {
    timestamp: new Date().toISOString(),
    prompt,
    maxTokens,
    iterations,
    totalModels: results.length,
    successful: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').length,
    results: results.map((r) => ({
      provider: r.provider,
      model: r.model,
      status: r.status,
      responseTime: r.responseTime,
      responseSize: r.responseSize,
      tokenUsage: r.tokenUsage,
      finishReason: r.finishReason,
      error: r.error,
      // Include first 200 chars of response for preview
      responsePreview: r.response ? r.response.substring(0, 200) : undefined,
    })),
  };
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`\n💾 Summary saved to: ${summaryFile}`);
}
