# Reasoning Effort Levels

AnyGPT supports OpenAI's reasoning effort levels for models with extended thinking capabilities (o1, o3, Claude thinking models, etc.).

## Supported Effort Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `minimal` | Fastest reasoning with minimal computational effort | Quick tasks, simple queries |
| `low` | Light reasoning for straightforward problems | Standard queries, basic analysis |
| `medium` | Balanced reasoning (default) | Most general-purpose tasks |
| `high` | Deep reasoning for complex problems | Complex analysis, difficult problems |

## Configuration

### Boolean Shorthand

Enable reasoning with default 'medium' effort:

```typescript
modelRules: [
  {
    pattern: [/o[13]/, /thinking/],
    reasoning: true  // Implicit 'medium' effort
  }
]
```

### String Shorthand (Recommended)

Directly specify effort level as a string - clean and explicit:

```typescript
modelRules: [
  {
    pattern: [/o3-mini/],
    reasoning: 'minimal'  // ✨ Direct string value
  },
  {
    pattern: [/o1/],
    reasoning: 'low'
  },
  {
    pattern: [/thinking/],
    reasoning: 'high'
  }
]
```

### Explicit Object Form

Use object form when you need additional reasoning properties:

```typescript
modelRules: [
  {
    pattern: [/o3-mini/],
    reasoning: { effort: 'minimal' }
  },
  {
    pattern: [/o1/],
    reasoning: { effort: 'low' }
  },
  {
    pattern: [/thinking/],
    reasoning: { effort: 'high' }
  }
]
```

### Disable Reasoning

Explicitly disable reasoning for models that don't support it:

```typescript
modelRules: [
  {
    pattern: [/gpt-4/, /gpt-3\.5/],
    reasoning: false
  }
]
```

## API Compatibility

The effort levels match OpenAI's `ReasoningEffort` type:

```typescript
type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | null;
```

When you configure reasoning in AnyGPT, it's passed directly to the OpenAI API as the `reasoning_effort` parameter.

## Examples

### Example 1: Tiered Reasoning Strategy

```typescript
export default config({
  defaults: {
    modelRules: [
      // Minimal effort for mini models (fast, cost-effective)
      {
        pattern: [/o3-mini/, /-mini/],
        reasoning: { effort: 'minimal' }
      },
      // Low effort for preview/beta models
      {
        pattern: [/preview/, /beta/],
        reasoning: { effort: 'low' }
      },
      // Medium effort for production models (default)
      {
        pattern: [/\bo[13]\b/],
        reasoning: true  // medium
      },
      // High effort for extended thinking
      {
        pattern: [/extended-thinking/, /-thinking-/],
        reasoning: { effort: 'high' }
      }
    ]
  }
});
```

### Example 2: Provider-Specific Overrides

```typescript
export default config({
  defaults: {
    modelRules: [
      {
        pattern: [/o[13]/],
        reasoning: true  // Global default: medium
      }
    ]
  },
  providers: {
    openai: {
      connector: openai({ apiKey: process.env.OPENAI_API_KEY }),
      modelRules: [
        // Override for specific OpenAI models
        {
          pattern: [/o3-mini/],
          reasoning: { effort: 'minimal' }
        }
      ]
    },
    cody: {
      connector: cody(),
      modelRules: [
        // Cody might have different reasoning support
        {
          pattern: [/.*/],
          reasoning: { effort: 'high' }  // Always use high effort
        }
      ]
    }
  }
});
```

## Performance Considerations

- **Minimal**: Fastest response time, lowest cost, suitable for simple queries
- **Low**: Good balance for routine tasks
- **Medium**: Default recommendation for most use cases
- **High**: Slower but more thorough, best for complex problems

## Best Practices

1. **Start with defaults**: Use `reasoning: true` (medium) for most models
2. **Optimize for mini models**: Use `minimal` effort for cost-effective quick tasks
3. **Reserve high effort**: Only use `high` for truly complex problems
4. **Test and measure**: Monitor response times and quality to find the right balance
5. **Provider-specific tuning**: Different providers may have different optimal settings

## Troubleshooting

### Error: "This model may not support reasoning parameters"

Some models don't support the `reasoning_effort` parameter. To fix:

```typescript
modelRules: [
  {
    pattern: [/gpt-4/, /gpt-3\.5/],
    reasoning: false  // Explicitly disable
  }
]
```

### Provider doesn't support reasoning_effort

Some OpenAI-compatible gateways may not support this parameter. Use provider-level rules to disable:

```typescript
providers: {
  'my-gateway': {
    connector: openai({ baseURL: '...' }),
    modelRules: [
      {
        pattern: [/.*/],  // All models
        reasoning: false  // Disable reasoning for this provider
      }
    ]
  }
}
```

## See Also

- [Model Rules Documentation](../packages/config/docs/MODEL_RULES.md)
- [Configuration Guide](./configuration.md)
- [OpenAI Reasoning Effort Documentation](https://platform.openai.com/docs/guides/reasoning)
