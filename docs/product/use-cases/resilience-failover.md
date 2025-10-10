# Resilience & Failover

## The Problem

Provider outages break your application. OpenAI had 5 major outages in 2024. When your provider is down, your entire application stops. No automatic recovery, manual intervention required. Single point of failure.

## The Solution

Configure multiple providers. Application can switch providers without code changes.

## Example

```typescript
// Configure primary and backup providers
providers: {
  'primary': { connector: openai({ apiKey: '...' }) },
  'backup': { connector: anthropic({ apiKey: '...' }) }
}

// Application handles failover
try {
  return await router.chatCompletion({ provider: 'primary', ... });
} catch (error) {
  return await router.chatCompletion({ provider: 'backup', ... });
}
```

## Why Existing Solutions Fall Short

- **Single provider**: No failover option
- **Hardcoded**: Requires code changes to switch
- **Manual recovery**: Developer intervention needed

## Expected Results

**Scenario:** Production application with 99.9% uptime SLA.

**Without failover:**
- OpenAI outage = complete application downtime
- 5 outages/year × 2 hours = 10 hours downtime
- Uptime: 99.89% (miss SLA)
- Lost revenue, angry customers

**With automatic failover:**
- Primary fails → switch to backup in seconds
- Downtime reduced to minutes during failover
- Uptime: 99.99% (meet SLA)
- Seamless user experience

**Measurable Impact:**
- Reduce downtime by ~95%
- Meet uptime SLAs consistently
- Avoid revenue loss during provider outages
- No manual intervention required
