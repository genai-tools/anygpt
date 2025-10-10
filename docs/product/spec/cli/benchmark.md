# Benchmark Command Specification

## Overview

Command for comparing model performance across providers with consistent prompts and metrics.

**Related Use Case**: [Model Benchmarking](../../use-cases/model-benchmarking.md)

## Requirements

### Input Parameters
- **Models**: List of model identifiers to compare
- **Prompts**: Test prompts to evaluate
- **Iterations**: Number of runs per model/prompt combination
- **Metrics**: What to measure (latency, cost, quality)

### Output
- **Performance metrics**: Response time, token usage, cost per request
- **Quality metrics**: Response consistency, completion rate
- **Comparison table**: Side-by-side model comparison
- **Recommendations**: Best model for given criteria

### Execution
- Run prompts against each model sequentially or in parallel
- Track timing, token usage, and costs
- Handle failures gracefully (don't abort entire benchmark)
- Support result export (JSON, CSV, Markdown)

## Command Interface

```bash
benchmark --models <model1,model2> --prompt <text> [options]
```

### Options
- `--models`: Comma-separated list of models
- `--prompt`: Single prompt or file path
- `--iterations`: Number of runs (default: 1)
- `--parallel`: Run models in parallel
- `--output`: Output format (table, json, csv, markdown)
- `--provider`: Explicit provider per model

## Success Criteria

User can:
1. Compare 2+ models with same prompt
2. See cost, latency, and quality metrics
3. Make data-driven model selection
4. Export results for analysis

## Non-Goals

- Automated quality scoring (subjective)
- Training/fine-tuning integration
- Real-time monitoring (separate concern)
