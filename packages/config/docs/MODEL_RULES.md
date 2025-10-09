# Model Rules

Model Rules provide a powerful, pattern-based configuration system for managing model behavior across your providers. They allow you to configure tags, reasoning parameters, and enable/disable models using flexible glob or regex patterns.

## Overview

Model Rules are evaluated in priority order:
1. **Explicit model metadata** (highest priority)
2. **Provider-level rules** (override global rules)
3. **Global rules** (apply to all providers)

Tags are **accumulated** (merged from all matching rules), while other properties use **first-match-wins**.

## Basic Structure

```typescript
type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

interface ReasoningConfig {
  effort?: ReasoningEffort;
}

interface ModelRule {
  pattern: (string | RegExp)[];  // Patterns to match model IDs
  tags?: string[];                // Tags to apply
  reasoning?: boolean | ReasoningEffort | ReasoningConfig;
  // reasoning: true - enables reasoning with 'medium' effort (implicit default)
  // reasoning: false - disables reasoning
  // reasoning: ReasoningEffort - direct effort level (shorthand)
  // reasoning: ReasoningConfig - explicit object form
  enabled?: boolean;              // Enable/disable models (true/undefined = enabled, false = disabled)
}
```

## Pattern Matching

### Glob Patterns (Simple)
```typescript
{
  pattern: ['*gpt-5*', '*sonnet*'],  // Match any model containing these strings
  tags: ['premium']
}
```

### Regex Patterns (Advanced)
```typescript
{
  pattern: [/gpt-[45]/, /^claude.*sonnet$/i],  // Native RegExp objects
  tags: ['claude', 'sonnet']
}
```

### Regex Strings (For JSON configs)
```typescript
{
  pattern: ['/gpt-[45]/', '/^claude.*sonnet$/i'],  // String format
  tags: ['gpt']
}
```

### Mixed Patterns
```typescript
{
  pattern: ['*gpt-5*', /claude-(opus|sonnet)/, '!*nano*'],  // Mix glob and regex
  tags: ['premium']
}
```

## Use Cases

### 1. Tagging Models

Automatically tag models for easy filtering and discovery:

```typescript
modelRules: [
  {
    pattern: [/sonnet/, /opus/],
    tags: ['claude', 'anthropic']
  },
  {
    pattern: [/gpt-5/, /gpt-4/],
    tags: ['openai', 'gpt']
  },
  {
    pattern: [/gemini/],
    tags: ['google', 'gemini']
  }
]
```

### 2. Reasoning Configuration

Configure reasoning parameters for o1/o3 models and extended thinking models:

#### Boolean Shorthand
Enable reasoning with default 'medium' effort:

```typescript
modelRules: [
  {
    pattern: [/o[13]/, /thinking/, /extended-thinking/],
    tags: ['reasoning'],
    reasoning: true  // Implicit 'medium' effort
  }
]
```

#### String Shorthand (Recommended)
Directly specify effort level as a string:

```typescript
modelRules: [
  {
    pattern: [/o3-mini/],
    reasoning: 'minimal'  // Quick and concise
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

#### Explicit Object Form
Use object form when you need additional reasoning properties in the future:

```typescript
modelRules: [
  {
    pattern: [/extended-thinking/],
    reasoning: { effort: 'high' }  // Explicit object form
  }
]
```

#### Disable Reasoning
Explicitly disable reasoning for models that don't support it:

```typescript
modelRules: [
  {
    pattern: [/gpt-4/, /gpt-3\.5/],
    reasoning: false  // No reasoning support
  }
]
```

### 3. Enable/Disable Models

Control which models are available for benchmarking or general use:

```typescript
modelRules: [
  // Enable specific model families
  {
    pattern: [/sonnet/, /gemini/, /gpt-5/],
    enabled: true
  },
  // Disable problematic or unavailable models
  {
    pattern: [/o3/, /codex/, /nano/],
    enabled: false
  }
]
```

### 4. Provider-Specific Overrides

Override global rules for specific providers:

```typescript
export default config({
  defaults: {
    // Global rules apply to all providers
    modelRules: [
      {
        pattern: [/o[13]/, /thinking/],
        tags: ['reasoning'],
        reasoning: { effort: 'medium' }
      }
    ]
  },
  providers: {
    booking: {
      connector: openai({ baseURL: '...' }),
      // Provider rules override global rules
      modelRules: [
        {
          pattern: [/./],  // Match all models
          tags: [],        // No reasoning config (Booking doesn't support it)
          reasoning: undefined
        },
        {
          pattern: [/sonnet/, /gemini/],
          enabled: true
        },
        {
          pattern: [/o3/],
          enabled: false
        }
      ]
    }
  }
});
```

## Pattern Syntax Reference

### Glob Wildcards
- `*` - Match any characters (zero or more)
- `?` - Match single character
- `[abc]` - Match any character in set
- `{a,b,c}` - Match any of the alternatives
- `!pattern` - Negation (exclude matching models)

### Regex Features
- `.` - Any character
- `^` - Start of string
- `$` - End of string
- `*`, `+`, `?` - Quantifiers
- `[abc]` - Character class
- `(a|b)` - Alternation
- `\b` - Word boundary
- Flags: `/pattern/i` (case-insensitive), `/pattern/g` (global)

## Examples

### Example 1: Comprehensive Tagging System

```typescript
modelRules: [
  // Claude models
  {
    pattern: [/sonnet-4-5/, /claude_4_sonnet/],
    tags: ['claude', 'sonnet', 'sonnet4.5', 'claude-sonnet']
  },
  {
    pattern: [/sonnet-4-latest/, /sonnet-4:/],
    tags: ['claude', 'sonnet', 'sonnet4', 'claude-sonnet']
  },
  {
    pattern: [/opus/],
    tags: ['claude', 'opus', 'claude-opus']
  },
  
  // OpenAI models
  {
    pattern: [/gpt-5/],
    tags: ['gpt', 'gpt5', 'openai']
  },
  {
    pattern: [/gpt-4o/],
    tags: ['gpt', 'gpt4', 'openai']
  },
  
  // Google models
  {
    pattern: [/gemini-2\.5-pro/, /gemini-2_5-pro/],
    tags: ['gemini', 'pro', 'gemini-pro', 'google']
  },
  {
    pattern: [/gemini-2\.5-flash/, /gemini-2_5-flash/],
    tags: ['gemini', 'flash', 'gemini-flash', 'google']
  },
  {
    pattern: [/flash-lite/],
    tags: ['gemini', 'lite', 'fast', 'google']
  }
]
```

### Example 2: Reasoning Models with Different Effort Levels

```typescript
modelRules: [
  // High effort for extended thinking
  {
    pattern: [/thinking/, /extended-thinking/],
    tags: ['reasoning', 'extended-thinking'],
    reasoning: { effort: 'high' }
  },
  // Medium effort for o1/o3
  {
    pattern: [/\bo[13]\b/],
    tags: ['reasoning', 'o-series'],
    reasoning: { effort: 'medium' }
  },
  // Minimal effort for quick reasoning tasks
  {
    pattern: [/o3-mini/],
    tags: ['reasoning', 'mini'],
    reasoning: { effort: 'minimal' }
  }
]
```

### Example 3: Selective Model Enablement

```typescript
modelRules: [
  // Enable production-ready models
  {
    pattern: [
      /sonnet-4/,
      /opus-4/,
      /gpt-5/,
      /gpt-4o/,
      /gemini-2\.5/
    ],
    enabled: true,
    tags: ['production']
  },
  
  // Disable experimental or problematic models
  {
    pattern: [
      /beta/,
      /alpha/,
      /experimental/,
      /codex/,
      /nano/
    ],
    enabled: false,
    tags: ['experimental']
  }
]
```

## Integration with Other Features

### List Models with Tags

```bash
# Show all models with resolved tags
npx anygpt list-models --provider booking --tags

# Filter models by tags
npx anygpt list-models --provider booking --filter-tags 'reasoning'
npx anygpt list-models --provider booking --filter-tags '!reasoning'
```

### List Available Tags

```bash
# Show all tags and their mappings
npx anygpt list-tags

# Filter by provider
npx anygpt list-tags --provider booking
```

### Benchmark with Enabled Models

```bash
# Benchmark only enabled models (respects modelRules)
npx anygpt benchmark --provider booking
```

## Best Practices

1. **Use Provider Rules for Provider-Specific Behavior**
   - Provider rules override global rules
   - Use them to handle API differences (e.g., AI Gateway doesn't support reasoning_effort)

2. **Keep Patterns Specific**
   - Use word boundaries (`\b`) to avoid false matches: `/\bo1\b/` vs `/o1/`
   - Test patterns against actual model IDs

3. **Document Your Rules**
   - Add comments explaining why rules exist
   - Document known limitations or workarounds

4. **Use Tags for Organization**
   - Create consistent tagging schemes
   - Use tags for filtering and discovery

5. **Test with list-models**
   - Verify your rules work as expected
   - Use `--tags` flag to see resolved configuration

## Migration from allowedModels

**Old approach (deprecated):**
```typescript
{
  allowedModels: ['*sonnet*', '*gemini*', '!*nano*']
}
```

**New approach (recommended):**
```typescript
{
  modelRules: [
    {
      pattern: [/sonnet/, /gemini/],
      enabled: true
    },
    {
      pattern: [/nano/],
      enabled: false
    }
  ]
}
```

Benefits:
- More flexible pattern matching (regex support)
- Combine with tags and reasoning config
- Better documentation and discoverability
- Consistent with other configuration patterns

## Troubleshooting

### Models not appearing in benchmark
- Check if `enabled: false` is set in any matching rule
- Use `list-models --tags` to see resolved configuration
- Verify patterns match actual model IDs

### Tags not being applied
- Remember: provider rules prevent global rules from applying
- Check rule priority (explicit > provider > global)
- Use `list-tags` to see all available tags

### Reasoning not working
- Some providers don't support `reasoning_effort` parameter
- Use provider-level rules to disable reasoning for specific providers
- Check error messages for API compatibility issues
