# @anygpt/rules

> **⚠️ WORK IN PROGRESS**: This package is under active development. Rule engine APIs may change significantly. Use at your own risk in production environments.

A simple, type-safe rule engine for matching and transforming objects.

[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](./coverage)

## Features

- ✅ **Type-safe** - Full TypeScript support
- ✅ **Shortcut syntax** - Direct values, regex, arrays
- ✅ **Mixed arrays** - Combine regex and exact matches
- ✅ **Simple operators** - `eq`, `in`, `match` (regex/glob)
- ✅ **Logical composition** - `and`, `or`, `not`
- ✅ **Default values** - Constructor-level defaults
- ✅ **Array operations** - `push` to append to arrays
- ✅ **Zero dependencies** - Pure TypeScript implementation
- ✅ **100% test coverage** - Production ready

## Usage

```typescript
import { RuleEngine, type Rule } from '@anygpt/rules';

interface Server {
  name: string;
  tools: string[];
  tags: string[];
  enabled?: boolean;
}

const engine = new RuleEngine(
  [
    {
      // Shortcut: direct value (eq)
      when: { name: 'github' },
      set: { enabled: true, priority: 'high' },
      push: { tags: ['verified'] },
    },

    {
      // Shortcut: regex (match)
      when: { name: /^github/ },
      set: { enabled: true },
      push: { tags: ['safe'] },
    },

    {
      // Mixed array: regex OR exact match
      when: { name: [/^gitlab/, 'bitbucket'] },
      set: { enabled: true, priority: 'medium' },
    },

    {
      // Pattern match: regex or glob
      when: { name: { match: /^github/ } },
      set: { enabled: true },
    },
  ],
  // Default values applied to all items
  { enabled: false, priority: 'low', tags: [] }
);

// Apply rules
const result = engine.apply({
  name: 'github-official',
  tools: [],
  tags: ['fast'],
});

// Result:
// {
//   name: 'github-official',
//   enabled: true,
//   priority: 'high',
//   tags: ['fast', 'verified', 'safe']  // Appended!
// }
```

## Operators

### Shortcut Syntax (Recommended)

For cleaner, more readable rules:

- **Direct value** → `eq` operator

  ```typescript
  {
    name: 'github';
  } // Same as { name: { eq: 'github' } }
  {
    count: 5;
  } // Same as { count: { eq: 5 } }
  ```

- **RegExp** → `match` operator

  ```typescript
  {
    name: /^github/;
  } // Same as { name: { match: /^github/ } }
  ```

- **Array** → `in` operator (supports mixed types!)
  ```typescript
  {
    name: ['github', 'gitlab'];
  } // Exact match any
  {
    name: [/^github/, 'gitlab'];
  } // Regex OR exact match
  {
    name: [/^github/, /^gitlab/];
  } // Multiple regex patterns
  ```

### Explicit Operators

- **`eq`** - Exact match

  ```typescript
  {
    name: {
      eq: 'github';
    }
  }
  ```

- **`in`** - Value is in array

  ```typescript
  { name: { in: ['github', 'gitlab'] } }
  ```

- **`match`** - Regex or glob pattern
  ```typescript
  {
    name: {
      match: /^github/;
    }
  }
  {
    name: {
      match: 'github-*';
    }
  }
  {
    name: {
      match: ['github-*', 'gitlab-*'];
    }
  }
  ```

### Logical Operators

- **`and`** - All conditions must match

  ```typescript
  {
    and: [{ name: { eq: 'github' } }, { tags: { in: ['safe'] } }];
  }
  ```

- **`or`** - Any condition must match

  ```typescript
  {
    or: [{ name: { eq: 'github' } }, { name: { eq: 'gitlab' } }];
  }
  ```

- **`not`** - Negate condition
  ```typescript
  { not: { name: { in: ['docker', 'anygpt'] } } }
  ```

## Pattern Matching

The `match` operator supports:

1. **RegExp** - Standard JavaScript regex

   ```typescript
   {
     name: {
       match: /^github/;
     }
   }
   ```

2. **Glob patterns** - Simple wildcard patterns

   - `*` - matches any characters
   - `?` - matches single character

   ```typescript
   {
     name: {
       match: 'github-*';
     }
   }
   {
     name: {
       match: 'github-?';
     }
   }
   ```

3. **Multiple patterns** - Match any of the patterns
   ```typescript
   {
     name: {
       match: [/^github/, 'gitlab-*'];
     }
   }
   ```

## Type Safety

The rule engine is fully type-safe:

```typescript
interface Server {
  name: string;
  count: number;
}

const rules: Rule<Server>[] = [
  {
    when: { name: { eq: 'github' } }, // ✅ OK
    set: { count: 10 }, // ✅ OK
  },
  {
    when: { invalid: { eq: 'test' } }, // ❌ Error: 'invalid' not in Server
    set: { name: 'test' }, // ✅ OK
  },
  {
    when: { name: { eq: 'github' } },
    set: { invalid: true }, // ❌ Error: 'invalid' not in Server
  },
];
```

## Installation

```bash
npm install @anygpt/rules
```

## Development

```bash
# Run tests
npx nx test rules

# Run tests with coverage (100% coverage required)
npx nx test rules --coverage

# Build package
npx nx build rules

# Lint
npx nx lint rules

# Type check
npx nx typecheck rules
```
