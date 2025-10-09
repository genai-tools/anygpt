import type { CLIContext } from '../utils/cli-context.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { resolveModel, resolveModelConfig } from '@anygpt/config';

interface BenchmarkOptions {
  provider?: string;
  model?: string;
  models?: string;
  prompt?: string;
  maxTokens?: number;
  iterations?: number;
  json?: boolean;
  output?: string;
  all?: boolean;
}

interface BenchmarkResult {
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

export async function benchmarkCommand(context: CLIContext, options: BenchmarkOptions) {
  const { router, providers } = context;

  // Get prompt
  const prompt = options.prompt || 'What is 2+2? Answer in one sentence.';
  
  // Get models to benchmark
  let modelsToTest: Array<{ provider: string; model: string }> = [];
  
  if (options.models) {
    // If --provider is also specified, treat --models as comma-separated model IDs for that provider
    if (options.provider) {
      const modelIds = options.models.split(',').map(m => m.trim());
      modelsToTest = modelIds.map(modelId => ({
        provider: options.provider!,
        model: modelId
      }));
    } else {
      // Parse comma-separated list of model specs: "provider:model,provider:model"
      // Note: model IDs can contain colons (e.g., anthropic::2024-10-22::claude-sonnet-4-latest)
      // So we split on comma first, then split on FIRST colon only
      const modelSpecs = options.models.split(',');
      for (const spec of modelSpecs) {
        const trimmed = spec.trim();
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const provider = trimmed.substring(0, colonIndex);
          const model = trimmed.substring(colonIndex + 1);
          modelsToTest.push({ provider, model });
        }
      }
    }
  } else if (options.model && options.provider) {
    // Single model specified
    modelsToTest.push({ provider: options.provider, model: options.model });
  } else if (options.provider) {
    // All models from a provider (filtered by modelRules enabled flag)
    try {
      const models = await router.listModels(options.provider);
      const providerConfig = providers[options.provider];
      const globalRules = context.defaults?.modelRules;
      
      // IMPORTANT: Use the provider from options, not from parsing the model ID
      // Model IDs may contain colons (e.g., ml-asset:static-model/gpt-5)
      modelsToTest = models
        .filter((m: any) => {
          const config = resolveModelConfig(m.id, options.provider!, providerConfig, globalRules);
          // enabled is true by default (undefined means enabled)
          return config.enabled !== false;
        })
        .map((m: any) => ({
          provider: options.provider!,
          model: m.id
        }));
      
      if (!options.json) {
        console.log(`🔍 Filtered to ${modelsToTest.length} enabled models`);
      }
    } catch (error) {
      console.error(`Error listing models for provider ${options.provider}:`, error);
      process.exit(1);
    }
  } else if (options.all) {
    // Benchmark ALL models from ALL providers (filtered by modelRules enabled flag)
    const providerNames = Object.keys(providers);
    const globalRules = context.defaults?.modelRules;
    
    for (const provider of providerNames) {
      try {
        const models = await router.listModels(provider);
        const providerConfig = providers[provider];
        
        for (const model of models) {
          // Check if model is enabled via modelRules
          const config = resolveModelConfig(model.id, provider, providerConfig, globalRules);
          if (config.enabled !== false) {
            modelsToTest.push({ provider, model: model.id });
          }
        }
      } catch (error) {
        console.error(`Skipping provider ${provider}: ${error}`);
      }
    }
  } else {
    // Benchmark all providers with their default models
    const providerNames = Object.keys(providers);
    for (const provider of providerNames) {
      const defaultModel = context.defaults?.providers?.[provider]?.model;
      
      if (defaultModel) {
        // Resolve tag to actual model ID if needed
        const resolution = resolveModel(
          defaultModel,
          {
            providers: context.providers,
            aliases: context.defaults?.aliases,
            defaultProvider: context.defaults?.provider,
          },
          provider
        );
        
        if (resolution) {
          // Use resolved model
          modelsToTest.push({ provider: resolution.provider, model: resolution.model });
        } else {
          // Use as-is (might be a direct model ID)
          modelsToTest.push({ provider, model: defaultModel });
        }
      } else {
        // Use first available model
        try {
          const models = await router.listModels(provider);
          if (models.length > 0) {
            // Use the actual provider name, not parsed from model ID
            modelsToTest.push({ provider, model: models[0].id });
          }
        } catch (error) {
          console.error(`Skipping provider ${provider}: ${error}`);
        }
      }
    }
  }

  if (modelsToTest.length === 0) {
    console.error('No models to benchmark. Specify --provider, --model, --models, or --all');
    process.exit(1);
  }

  const iterations = options.iterations || 1;
  const maxTokens = options.maxTokens || 100;

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

  if (!options.json) {
    console.log(`🔬 Benchmarking ${modelsToTest.length} model(s) with ${iterations} iteration(s)\n`);
    console.log(`Prompt: "${prompt}"`);
    console.log(`Max tokens: ${maxTokens}\n`);
  }

  const results: BenchmarkResult[] = [];

  for (const { provider, model } of modelsToTest) {
    const iterationResults: BenchmarkResult[] = [];

    for (let i = 0; i < iterations; i++) {
      if (!options.json && iterations > 1) {
        process.stdout.write(`Testing ${provider}:${model} (${i + 1}/${iterations})... `);
      } else if (!options.json) {
        process.stdout.write(`Testing ${provider}:${model}... `);
      }

      const startTime = Date.now();
      let result: BenchmarkResult;

      try {
        // Resolve model configuration using rule matching
        const providerConfig = providers[provider];
        const globalRules = context.defaults?.modelRules;
        const modelConfig = resolveModelConfig(model, provider, providerConfig, globalRules);
        
        // Debug logging
        if (process.env.DEBUG_BENCHMARK) {
          console.log(`\n[DEBUG] Calling router.chatCompletion with:`);
          console.log(`  provider: ${provider}`);
          console.log(`  model: ${model}`);
          console.log(`  prompt: ${prompt}`);
          console.log(`  max_tokens: ${maxTokens}`);
          console.log(`  reasoning: ${JSON.stringify(modelConfig?.reasoning)}`);
        }

        const response = await router.chatCompletion({
          provider,
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          ...(modelConfig.reasoning && { reasoning: modelConfig.reasoning })
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
          tokenUsage: response.usage ? {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens
          } : undefined,
          finishReason: response.choices[0]?.finish_reason,
          response: responseContent
        };

        if (!options.json) {
          console.log(`✅ ${responseTime}ms (${responseSize} chars)`);
        }

        // Save response to file if output directory specified
        if (outputDir) {
          const sanitizedProvider = provider.replace(/[^a-z0-9]/gi, '_');
          const sanitizedModel = model.replace(/[^a-z0-9]/gi, '_');
          const filename = `${sanitizedProvider}_${sanitizedModel}_${i + 1}.txt`;
          const filepath = join(outputDir, filename);
          const fileContent = `# Benchmark Result
Provider: ${provider}
Model: ${model}
Iteration: ${i + 1}/${iterations}
Response Time: ${responseTime}ms
Response Size: ${responseSize} chars
Finish Reason: ${result.finishReason}
${result.tokenUsage ? `Token Usage: ${result.tokenUsage.prompt} prompt + ${result.tokenUsage.completion} completion = ${result.tokenUsage.total} total` : ''}

## Prompt
${prompt}

## Response
${responseContent}
`;
          writeFileSync(filepath, fileContent, 'utf-8');
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        result = {
          provider,
          model,
          status: 'error',
          responseTime,
          responseSize: 0,
          error: error instanceof Error ? error.message : String(error)
        };

        if (!options.json) {
          console.log(`❌ ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      iterationResults.push(result);
    }

    // Calculate average if multiple iterations
    if (iterations > 1) {
      const successfulRuns = iterationResults.filter(r => r.status === 'success');
      if (successfulRuns.length > 0) {
        const avgTime = successfulRuns.reduce((sum, r) => sum + r.responseTime, 0) / successfulRuns.length;
        const avgSize = successfulRuns.reduce((sum, r) => sum + r.responseSize, 0) / successfulRuns.length;
        const avgTokens = successfulRuns[0].tokenUsage ? {
          prompt: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.prompt || 0), 0) / successfulRuns.length),
          completion: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.completion || 0), 0) / successfulRuns.length),
          total: Math.round(successfulRuns.reduce((sum, r) => sum + (r.tokenUsage?.total || 0), 0) / successfulRuns.length)
        } : undefined;

        results.push({
          provider,
          model,
          status: 'success',
          responseTime: Math.round(avgTime),
          responseSize: Math.round(avgSize),
          tokenUsage: avgTokens,
          finishReason: successfulRuns[0].finishReason,
          response: successfulRuns[0].response
        });
      } else {
        results.push(iterationResults[0]); // Use first error
      }
    } else {
      results.push(iterationResults[0]);
    }
  }

  // Save summary JSON if output directory specified
  if (outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const summaryFile = join(outputDir, `benchmark-summary-${timestamp}.json`);
    const summary = {
      timestamp: new Date().toISOString(),
      prompt,
      maxTokens,
      iterations,
      totalModels: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results: results.map(r => ({
        provider: r.provider,
        model: r.model,
        status: r.status,
        responseTime: r.responseTime,
        responseSize: r.responseSize,
        tokenUsage: r.tokenUsage,
        finishReason: r.finishReason,
        error: r.error,
        // Include first 200 chars of response for preview
        responsePreview: r.response ? r.response.substring(0, 200) : undefined
      }))
    };
    writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf-8');
    if (!options.json) {
      console.log(`\n💾 Summary saved to: ${summaryFile}`);
    }
  }

  // Output results
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('\n📊 Benchmark Results:\n');
    
    // Sort by response time (successful ones first)
    const sortedResults = [...results].sort((a, b) => {
      if (a.status === 'success' && b.status === 'error') return -1;
      if (a.status === 'error' && b.status === 'success') return 1;
      return a.responseTime - b.responseTime;
    });

    // Calculate column widths dynamically
    const maxProviderLen = Math.max(...sortedResults.map(r => r.provider.length), 8);
    const maxModelLen = Math.max(...sortedResults.map(r => r.model.length), 5);
    const providerWidth = Math.min(maxProviderLen, 20);
    const modelWidth = Math.min(maxModelLen, 60);
    const totalWidth = providerWidth + modelWidth + 40; // +40 for other columns and padding

    // Print table header
    const headerLine = '─'.repeat(totalWidth);
    console.log(`┌${headerLine}┐`);
    console.log(`│ ${'Provider'.padEnd(providerWidth)} │ ${'Model'.padEnd(modelWidth)} │ Status │  Time   │  Size │ Tokens │`);
    console.log(`├${headerLine}┤`);
    
    for (const result of sortedResults) {
      const provider = result.provider.substring(0, providerWidth).padEnd(providerWidth);
      const model = result.model.substring(0, modelWidth).padEnd(modelWidth);
      const status = result.status === 'success' ? '✅ OK ' : '❌ ERR';
      const time = `${result.responseTime}ms`.padEnd(7);
      const size = `${result.responseSize}ch`.padEnd(5);
      const tokens = result.tokenUsage ? `${result.tokenUsage.total}`.padEnd(6) : '-'.padEnd(6);
      
      console.log(`│ ${provider} │ ${model} │ ${status} │ ${time} │ ${size} │ ${tokens} │`);
    }
    
    console.log(`└${headerLine}┘`);

    // Summary statistics
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');
    
    if (successful.length > 0) {
      const fastest = successful.reduce((min, r) => r.responseTime < min.responseTime ? r : min);
      const slowest = successful.reduce((max, r) => r.responseTime > max.responseTime ? r : max);
      
      console.log('\n📈 Summary:');
      console.log(`  Total: ${results.length} models`);
      console.log(`  Successful: ${successful.length}`);
      console.log(`  Failed: ${failed.length}`);
      console.log(`  Fastest: ${fastest.responseTime}ms (${fastest.provider}:${fastest.model})`);
      console.log(`  Slowest: ${slowest.responseTime}ms (${slowest.provider}:${slowest.model})`);
      console.log(`  Average: ${Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)}ms`);
    }
    
    // Error report (if any failures)
    if (failed.length > 0) {
      console.log('\n❌ Error Report:\n');
      for (const result of failed) {
        console.log(`  ${result.provider}:${result.model}`);
        console.log(`    ${result.error}`);
        console.log('');
      }
    }
  }
}
