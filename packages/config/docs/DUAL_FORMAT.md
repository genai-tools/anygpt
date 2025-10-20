# Dual Format Support - TypeScript vs JSON/YAML

The config system supports **two formats** for defining providers:

## Format 1: Direct Instance (TypeScript/JavaScript)

**Best for:** Type-safe configs with IDE support

```typescript
// anygpt.config.ts
import { defineConfig } from '@anygpt/config';
import { openai } from '@anygpt/openai';
import { anthropic } from '@anygpt/anthropic';

export default defineConfig({
  providers: {
    openai: {
      name: 'OpenAI',
      connector: openai({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      }),
    },
    claude: {
      name: 'Anthropic Claude',
      connector: anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      }),
    },
  },
});
```

**Benefits:**

- ✅ Full TypeScript type safety
- ✅ IDE autocomplete and validation
- ✅ Direct access to connector options
- ✅ Can use environment variables with `process.env`

---

## Format 2: Module Reference (JSON/YAML)

**Best for:** Configuration files without code execution

### JSON Example

```json
{
  "providers": {
    "openai": {
      "name": "OpenAI",
      "module": "@anygpt/openai",
      "config": {
        "apiKey": "${OPENAI_API_KEY}",
        "baseURL": "https://api.openai.com/v1"
      }
    },
    "claude": {
      "name": "Anthropic Claude",
      "module": "@anygpt/anthropic",
      "config": {
        "apiKey": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### YAML Example

```yaml
providers:
  openai:
    name: OpenAI
    module: '@anygpt/openai'
    config:
      apiKey: ${OPENAI_API_KEY}
      baseURL: https://api.openai.com/v1

  claude:
    name: Anthropic Claude
    module: '@anygpt/anthropic'
    config:
      apiKey: ${ANTHROPIC_API_KEY}
```

### TOML Example

```toml
[providers.openai]
name = "OpenAI"
module = "@anygpt/openai"

[providers.openai.config]
apiKey = "${OPENAI_API_KEY}"
baseURL = "https://api.openai.com/v1"

[providers.claude]
name = "Anthropic Claude"
module = "@anygpt/anthropic"

[providers.claude.config]
apiKey = "${ANTHROPIC_API_KEY}"
```

**Benefits:**

- ✅ No code execution required
- ✅ Can be stored in databases
- ✅ Easy to generate programmatically
- ✅ Works with config management tools
- ✅ Environment variable substitution

---

## How It Works

### TypeScript Format (Direct Instance)

```typescript
{
  connector: openai({ apiKey: '...' }); // IConnector instance
}
```

The connector is **already instantiated** when the config is loaded.

### Module Format (Dynamic Loading)

```json
{
  "module": "@anygpt/openai",
  "config": { "apiKey": "..." }
}
```

The connector is **dynamically loaded** at runtime:

1. Import the module: `await import('@anygpt/openai')`
2. Call the factory function: `openai(config)`
3. Return the IConnector instance

---

## Type Definition

```typescript
export interface ProviderConfig {
  name?: string;

  // Format 1: Direct instance (mutually exclusive with 'module')
  connector?: IConnector;

  // Format 2: Module reference (mutually exclusive with 'connector')
  module?: string;
  config?: Record<string, unknown>;

  // Common fields
  settings?: { ... };
  modelRules?: ModelRule[];
  allowedModels?: string[];
}
```

---

## Validation Rules

✅ **Valid:** Specify `connector` OR `module`

```typescript
{ connector: openai({ ... }) }  // ✅ OK
{ module: '@anygpt/openai', config: { ... } }  // ✅ OK
```

❌ **Invalid:** Specify both

```typescript
{
  connector: openai({ ... }),
  module: '@anygpt/openai'  // ❌ ERROR: Can't have both
}
```

❌ **Invalid:** Specify neither

```typescript
{
  name: 'OpenAI'; // ❌ ERROR: Must have connector or module
}
```

---

## Advanced: Manual Resolution

For advanced use cases, you can manually resolve connectors:

```typescript
import { resolveConnector } from '@anygpt/config';

// Works with both formats
const connector = await resolveConnector(
  {
    module: '@anygpt/openai',
    config: { apiKey: '...' },
  },
  'openai', // provider ID
  logger // optional logger
);
```

---

## Migration from Legacy Format

**Old (Legacy):**

```typescript
{
  connector: {
    connector: '@anygpt/openai',  // ❌ Confusing nested structure
    config: { apiKey: '...' }
  }
}
```

**New (Module Format):**

```typescript
{
  module: '@anygpt/openai',  // ✅ Clear, flat structure
  config: { apiKey: '...' }
}
```

---

## When to Use Each Format

### Use Direct Instance (TypeScript) When:

- ✅ You want type safety and IDE support
- ✅ You need to customize connector initialization
- ✅ You're writing TypeScript/JavaScript configs
- ✅ You want compile-time validation

### Use Module Reference (JSON/YAML) When:

- ✅ You need pure data configs (no code)
- ✅ You're storing configs in databases
- ✅ You're using config management tools
- ✅ You want runtime flexibility
- ✅ You need to generate configs programmatically

---

## Examples

### Example 1: Company Gateway (TypeScript)

```typescript
import { openai } from '@anygpt/openai';

export default {
  providers: {
    'company-gateway': {
      connector: openai({
        baseURL: 'https://ai.company.com/v1',
        apiKey: process.env.COMPANY_AI_KEY,
        headers: {
          'X-Department': 'engineering',
        },
      }),
    },
  },
};
```

### Example 2: Multi-Environment (JSON)

```json
{
  "providers": {
    "production": {
      "module": "@anygpt/openai",
      "config": {
        "baseURL": "https://api.company.com/prod",
        "apiKey": "${PROD_API_KEY}"
      }
    },
    "staging": {
      "module": "@anygpt/openai",
      "config": {
        "baseURL": "https://api.company.com/staging",
        "apiKey": "${STAGING_API_KEY}"
      }
    }
  }
}
```

### Example 3: Mixed Format (TypeScript)

```typescript
import { openai } from '@anygpt/openai';

export default {
  providers: {
    // Direct instance for local development
    local: {
      connector: openai({
        baseURL: 'http://localhost:11434/v1',
      }),
    },

    // Module reference for production (loaded from env)
    production: {
      module: '@anygpt/openai',
      config: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    },
  },
};
```

---

## Summary

| Feature               | Direct Instance | Module Reference |
| --------------------- | --------------- | ---------------- |
| **Format**            | TypeScript/JS   | JSON/YAML/TOML   |
| **Type Safety**       | ✅ Full         | ❌ Runtime only  |
| **IDE Support**       | ✅ Yes          | ❌ Limited       |
| **Code Execution**    | ✅ Required     | ❌ Not required  |
| **Dynamic Loading**   | ❌ No           | ✅ Yes           |
| **Database Storage**  | ❌ Difficult    | ✅ Easy          |
| **Config Management** | ❌ Limited      | ✅ Full support  |

**Both formats are first-class citizens!** Choose based on your use case.
