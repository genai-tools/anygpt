# Flexible Configuration

## The Problem

Hardcoded provider settings in code mean redeploying for config changes. Different environments (dev/staging/prod) need different API keys, endpoints, and models. Environment variables become unwieldy with dozens of settings. No type safety, easy to misconfigure.

## The Solution

Configuration-driven setup with TypeScript support. Define providers, models, and routing rules in config files.

## Example

```typescript
// .anygpt/anygpt.config.ts
export default config({
  providers: {
    'fast': { connector: openai({ model: 'gpt-3.5-turbo' }) },
    'smart': { connector: openai({ model: 'gpt-4o' }) },
    'local': { connector: openai({ baseURL: 'http://localhost:11434' }) }
  },
  defaults: {
    provider: 'fast',  // Use fast by default
    timeout: 30000
  }
});
```

## Why Existing Solutions Fall Short

- **Environment variables**: No structure, error-prone
- **JSON config**: No type safety, no dynamic values
- **Hardcoded**: Requires code changes for config updates

## Expected Results

**Scenario:** Support dev/staging/prod environments with different providers.

**Without config management:**
- Hardcoded settings in code
- Redeploy for every config change
- Environment variables scattered across 20+ vars
- Misconfiguration causes production incidents

**With TypeScript config:**
- Single config file per environment
- Change provider/model without redeployment
- IDE autocomplete prevents typos
- Type checking catches errors before deployment

**Measurable Impact:**
- Reduce config-related incidents by ~90%
- Change configs in seconds vs hours (no redeploy)
- Catch configuration errors at development time
- Onboard new developers faster with clear config structure
