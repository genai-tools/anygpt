# Provider Agnostic Chat Interface

## The Problem

Applications become locked to a single AI provider's API. OpenAI's SDK differs from Anthropic's, which differs from local models. Switching providers means rewriting API calls, error handling, and response parsing throughout your codebase. Migration projects take weeks.

## The Solution

Single interface that works with any provider. Change providers through configuration, not code changes.

## Example

```typescript
// Same code works with OpenAI, Anthropic, Ollama, etc.
const response = await router.chatCompletion({
  provider: 'openai-main',  // or 'anthropic' or 'ollama'
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

Switch providers by changing config:

```typescript
// .anygpt/anygpt.config.ts
providers: {
  'openai-main': { connector: openai({ apiKey: '...' }) },
  'anthropic': { connector: anthropic({ apiKey: '...' }) },
  'ollama': { connector: openai({ baseURL: 'http://localhost:11434' }) }
}
```

## Why Existing Solutions Fall Short

- **Direct SDK usage**: Tightly coupled to provider APIs
- **LangChain**: Heavy framework with complex abstractions
- **Custom wrappers**: Maintenance burden, incomplete coverage

## Expected Results

**Scenario:** Migrate from OpenAI to Anthropic for better reasoning.

**Without abstraction:**
- Rewrite API calls across 50+ files
- Update error handling, response parsing
- Test everything again
- Migration takes 2-3 weeks
- Risk of bugs and downtime

**With provider abstraction:**
- Change config file: `provider: 'openai'` → `provider: 'anthropic'`
- Test with new provider
- Migration takes 1 day
- Zero code changes

**Measurable Impact:**
- Reduce migration time from weeks to days
- Test multiple providers in parallel (A/B testing)
- Switch providers in minutes if one has issues
- Negotiate better pricing with provider flexibility
