# Benchmark Command Specification

**Related Use Case**: [Model Benchmarking](../../use-cases/model-benchmarking.md)

## Command Syntax

```bash
anygpt benchmark --models <model-list> --prompt <text> [options]
```

## Required Arguments

### `--models <model-list>`
Comma-separated list of models to compare.

**Format**: `model-name` or `provider::model-name`

**Examples**:
```bash
--models gpt-4o,claude-sonnet-4,llama3
--models openai::gpt-4o,anthropic::claude-sonnet-4
```

### `--prompt <text>`
Prompt to test across all models.

**Examples**:
```bash
--prompt "Explain quantum computing"
--prompt @prompts/code-explanation.txt
```

## Optional Arguments

### `--iterations <number>`
Number of times to run each model/prompt combination.

**Default**: `1`

**Example**: `--iterations 10`

### `--output <format>`
Output format for results.

**Options**: `table` | `json` | `csv` | `markdown`

**Default**: `table`

### `--parallel`
Run models in parallel instead of sequentially.

**Default**: Sequential execution

## Output Format

### Table Output (default)

```
Model Benchmarking Results
==========================

Prompt: "Explain quantum computing"
Iterations: 10

┌─────────────────┬──────────┬──────────┬─────────┬──────────┐
│ Model           │ Avg Time │ Tokens   │ Cost    │ Success  │
├─────────────────┼──────────┼──────────┼─────────┼──────────┤
│ gpt-4o          │ 2.3s     │ 450      │ $0.014  │ 100%     │
│ claude-sonnet-4 │ 1.8s     │ 420      │ $0.006  │ 100%     │
│ llama3          │ 0.9s     │ 380      │ $0.000  │ 100%     │
└─────────────────┴──────────┴──────────┴─────────┴──────────┘

Recommendation: claude-sonnet-4 (best cost/quality ratio)
```

### JSON Output

```json
{
  "prompt": "Explain quantum computing",
  "iterations": 10,
  "timestamp": "2025-01-10T10:30:00Z",
  "results": [
    {
      "model": "gpt-4o",
      "provider": "openai",
      "metrics": {
        "avgResponseTime": 2.3,
        "avgTokens": 450,
        "avgCost": 0.014,
        "successRate": 1.0
      }
    }
  ]
}
```

## Exit Codes

- `0`: Benchmark completed successfully
- `1`: Invalid arguments
- `2`: All models failed
- `3`: Configuration error

## Error Handling

**Partial Failures**: If one model fails, continue with others and report in results.

**Example**:
```
┌─────────────────┬──────────┬──────────┬─────────┬──────────┐
│ Model           │ Avg Time │ Tokens   │ Cost    │ Success  │
├─────────────────┼──────────┼──────────┼─────────┼──────────┤
│ gpt-4o          │ 2.3s     │ 450      │ $0.014  │ 100%     │
│ claude-sonnet-4 │ ERROR    │ -        │ -       │ 0%       │
│ llama3          │ 0.9s     │ 380      │ $0.000  │ 100%     │
└─────────────────┴──────────┴──────────┴─────────┴──────────┘

Error: claude-sonnet-4 - Authentication failed
```

## Examples

### Basic Comparison
```bash
anygpt benchmark \
  --models gpt-4o,claude-sonnet-4 \
  --prompt "Explain quantum computing"
```

### Multiple Iterations
```bash
anygpt benchmark \
  --models gpt-4o,gpt-3.5-turbo \
  --prompt "Write a haiku about AI" \
  --iterations 10
```

### Export to JSON
```bash
anygpt benchmark \
  --models gpt-4o,claude-sonnet-4,llama3 \
  --prompt @prompts/code-review.txt \
  --output json > results.json
```

### Parallel Execution
```bash
anygpt benchmark \
  --models gpt-4o,claude-sonnet-4,llama3 \
  --prompt "Summarize this article" \
  --parallel
```
