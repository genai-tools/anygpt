# Benchmark Command

Compare model performance across providers with detailed metrics, response analysis, and automated result storage.

## Overview

The `benchmark` command allows you to:
- Test multiple models with the same prompt
- Compare response times, token usage, and response quality
- Identify which models support specific features (e.g., system roles)
- Save all responses and metrics for later analysis
- Generate summary JSON for programmatic analysis

## Usage

```bash
anygpt benchmark [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--provider <name>` | Benchmark all models from this provider | - |
| `--model <model>` | Specific model to benchmark (requires --provider) | - |
| `--models <list>` | Comma-separated list of provider:model pairs | - |
| `--prompt <text>` | Prompt to use for benchmarking | "What is 2+2? Answer in one sentence." |
| `--max-tokens <number>` | Maximum tokens to generate | 100 |
| `--iterations <number>` | Number of iterations per model (for averaging) | 1 |
| `--output <directory>` | Directory to save response files and summary JSON | - |
| `--json` | Output results as JSON | false |

## Examples

### Benchmark All Models from a Provider

```bash
anygpt benchmark --provider openai --prompt "Hello" --output ./results
```

This will:
- List all available models from the `openai` provider
- Test each model with the prompt "Hello"
- Save results to `./results/` directory

### Compare Specific Models

```bash
anygpt benchmark \
  --models "openai:gpt-4o,openai:gpt-4o-mini,anthropic:claude-3-5-sonnet" \
  --prompt "Explain quantum computing in one sentence" \
  --max-tokens 100 \
  --output ./quantum-test
```

### Multiple Iterations for Averaging

```bash
anygpt benchmark \
  --provider cody \
  --iterations 5 \
  --prompt "What is AI?" \
  --output ./results
```

This runs each model 5 times and calculates average response time and token usage.

### Test System Role Support

```bash
anygpt benchmark \
  --models "cody:opus,cody:sonnet,cody:gemini" \
  --prompt "you can only speak spanish. what is your name" \
  --max-tokens 50 \
  --output ./spanish-test
```

This tests which models properly handle system-like instructions (Cody automatically transforms system roles).

## Output

### Console Output

The command displays a formatted table with:
- **Provider:Model** - Model identifier
- **Status** - ✅ Success or ❌ Error
- **Time** - Response time in milliseconds
- **Size** - Response size in characters
- **Tokens** - Total token usage

Example:
```
📊 Benchmark Results:
┌─────────────────────────────────────────────────────────────┐
│ Provider:Model              │ Status │ Time   │ Size │ Tokens │
├─────────────────────────────────────────────────────────────┤
│ openai:gpt-4o-mini          │ ✅ OK  │ 214ms  │ 9ch  │ 14     │
│ openai:gpt-4o               │ ✅ OK  │ 433ms  │ 13ch │ 15     │
│ anthropic:claude-3-5-sonnet │ ✅ OK  │ 461ms  │ 15ch │ 22     │
│ anthropic:claude-3-opus     │ ✅ OK  │ 1124ms │ 7ch  │ 25     │
└─────────────────────────────────────────────────────────────┘

📈 Summary:
  Total: 4 models
  Successful: 4
  Failed: 0
  Fastest: 214ms
  Slowest: 1124ms
  Average: 558ms
```

### File Output (--output)

When `--output` is specified, the command creates:

#### 1. Individual Response Files

Format: `{provider}_{model}_{iteration}.txt`

Example: `cody_google__v1__gemini_2_5_flash_1.txt`

Content:
```
# Benchmark Result
Provider: cody
Model: google::v1::gemini-2.5-flash
Iteration: 1/1
Response Time: 905ms
Response Size: 75 chars
Finish Reason: unknown
Token Usage: 10 prompt + 17 completion = 68 total

## Prompt
you can only speak spanish. what is your name

## Response
No tengo un nombre. Soy un modelo de lenguaje grande, entrenado por Google.
```

#### 2. Summary JSON File

Format: `benchmark-summary-{timestamp}.json`

Example: `benchmark-summary-2025-10-07T21-45-38-102Z.json`

Structure:
```json
{
  "timestamp": "2025-10-07T21:45:38.103Z",
  "prompt": "you can only speak spanish. what is your name",
  "maxTokens": 100,
  "iterations": 1,
  "totalModels": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "provider": "cody",
      "model": "anthropic::2024-10-22::claude-sonnet-4-latest",
      "status": "success",
      "responseTime": 2021,
      "responseSize": 114,
      "tokenUsage": {
        "prompt": 17,
        "completion": 41,
        "total": 58
      },
      "finishReason": "stop",
      "responsePreview": "Mi nombre es Claude. Soy un asistente..."
    }
  ]
}
```

## Use Cases

### 1. Model Selection

Find the fastest and most efficient model for your use case:

```bash
anygpt benchmark --provider openai --prompt "Typical user query" --output ./selection
```

Analyze the results to choose based on:
- Response time (latency requirements)
- Token usage (cost considerations)
- Response quality (review actual responses)

### 2. Quality Testing

Compare response quality across models:

```bash
anygpt benchmark \
  --models "cody:opus,cody:sonnet,cody:gemini" \
  --prompt "Explain the difference between REST and GraphQL" \
  --max-tokens 500 \
  --output ./quality-test
```

Review the individual response files to compare quality.

### 3. Cost Analysis

Analyze token usage patterns:

```bash
anygpt benchmark --provider openai --iterations 10 --output ./cost-analysis

# Then analyze with jq
cat cost-analysis/benchmark-summary-*.json | \
  jq '.results[] | {model, avgTokens: .tokenUsage.total, cost: (.tokenUsage.total * 0.00001)}'
```

### 4. Debugging

Test which models support specific features:

```bash
# Test system role support
anygpt benchmark \
  --provider cody \
  --prompt "system: you are helpful. user: hello" \
  --output ./system-role-test

# Test long context
anygpt benchmark \
  --models "anthropic:claude-3-opus,anthropic:claude-3-5-sonnet" \
  --prompt "$(cat long-document.txt)" \
  --max-tokens 1000 \
  --output ./long-context-test
```

### 5. Performance Monitoring

Track model performance over time:

```bash
# Run daily benchmarks
anygpt benchmark \
  --provider openai \
  --prompt "Standard test query" \
  --iterations 5 \
  --output ./monitoring/$(date +%Y-%m-%d)
```

### 6. CI/CD Integration

Automated model testing in pipelines:

```bash
#!/bin/bash
# test-models.sh

anygpt benchmark \
  --provider openai \
  --prompt "Test query" \
  --output ./test-results \
  --json > results.json

# Check if any models failed
FAILED=$(jq '.results[] | select(.status == "error") | .model' results.json)

if [ -n "$FAILED" ]; then
  echo "Failed models: $FAILED"
  exit 1
fi
```

## Advanced Usage

### Analyzing Results with jq

```bash
# Get fastest model
cat results/benchmark-summary-*.json | \
  jq '.results | sort_by(.responseTime) | .[0] | {model, time: .responseTime}'

# Get most token-efficient model
cat results/benchmark-summary-*.json | \
  jq '.results | sort_by(.tokenUsage.total) | .[0] | {model, tokens: .tokenUsage.total}'

# Calculate cost per model (assuming $0.01 per 1K tokens)
cat results/benchmark-summary-*.json | \
  jq '.results[] | {model, cost: (.tokenUsage.total * 0.00001)}'

# Filter successful runs only
cat results/benchmark-summary-*.json | \
  jq '.results[] | select(.status == "success")'
```

### Comparing Multiple Benchmark Runs

```bash
# Run benchmark twice
anygpt benchmark --provider openai --output ./run1
anygpt benchmark --provider openai --output ./run2

# Compare results
jq -s '.[0].results as $r1 | .[1].results as $r2 | 
  [$r1, $r2] | transpose | 
  map({model: .[0].model, run1: .[0].responseTime, run2: .[1].responseTime, diff: (.[1].responseTime - .[0].responseTime)})' \
  run1/benchmark-summary-*.json run2/benchmark-summary-*.json
```

## Tips

1. **Start with --provider**: Use `--provider` to quickly test all models from a provider
2. **Use --output**: Always use `--output` to save results for later analysis
3. **Multiple iterations**: Use `--iterations 3` or more for more reliable performance metrics
4. **Specific prompts**: Use prompts representative of your actual use case
5. **Token limits**: Set appropriate `--max-tokens` based on expected response length
6. **Model names**: For `--models`, use first colon to separate provider from model (e.g., `cody:anthropic::2024-10-22::claude-opus-4-latest`)

## Troubleshooting

### Models Failing with 400 Errors

Some models may not be available or may not support the request format:

```bash
anygpt benchmark --provider openai --output ./test
# Check which models failed in the summary
```

### Timeout Issues

Increase the timeout in your config or use faster models:

```bash
# Test with shorter prompts first
anygpt benchmark --provider openai --prompt "Hi" --max-tokens 10
```

### System Role Not Working

Cody automatically transforms system roles to user messages. Check the individual response files to see the actual prompt sent.

## See Also

- [Chat Command](./chat.md) - For one-off interactions
- [List Models Command](./list-models.md) - To see available models
- [Configuration](./config.md) - Configure providers and models
