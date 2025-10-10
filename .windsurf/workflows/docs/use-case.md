---
description: Create a new use case with critical review
---

# Use Case Creation Workflow

## Step 1: Review Existing Use Cases

Before creating a new use case, check if it already exists or overlaps:

```bash
ls docs/products/[product-name]/use-cases/
```

Read similar use cases to avoid duplication.

## Step 2: Challenge the User

Ask critical questions:

1. **What problem does this solve?** 
   - Be specific. "Makes things better" is not enough.
   - What's the pain point? What breaks without this?

2. **Who is the target user?**
   - Developers? Product owners? End users?
   - What's their current workflow?

3. **Why can't they solve this today?**
   - What existing solutions exist?
   - Why are they insufficient?

4. **What's the business value?**
   - Can you quantify the impact? (cost savings, time saved, revenue)
   - Is this a "nice to have" or "must have"?

5. **Is this really a separate use case?**
   - Could this be part of an existing use case?
   - Is it a feature of another use case?

## Step 3: Verify Uniqueness

Check against existing use cases:
- Provider agnostic chat
- Flexible configuration
- Conversations
- Context optimization
- Model benchmarking
- MCP server
- Cost optimization
- Resilience & failover
- Local-first development
- Rapid prototyping

If it overlaps >50% with an existing use case, **update the existing one** instead.

## Step 4: Create Use Case Document

Use this template:

```markdown
# [Use Case Name]

## The Problem

[Describe the problem with concrete evidence]
- Specific pain points
- Current limitations
- Why existing solutions fail

## The Solution

[High-level solution - no implementation details]

## Example

[Concrete example showing before/after]

## Why Existing Solutions Fall Short

- **[Alternative 1]**: [Why it doesn't work]
- **[Alternative 2]**: [Why it doesn't work]

## Expected Results

**Scenario:** [Specific scenario]

**Before:** [Current state with metrics]
- Metric 1
- Metric 2

**After:** [Future state with metrics]
- Metric 1
- Metric 2

**Measurable Impact:**
- Quantified benefit 1
- Quantified benefit 2
- Quantified benefit 3
```

## Step 5: Validate Measurable Impact

Every use case MUST have:
- ✅ Quantified benefits (%, $, time)
- ✅ Concrete scenario
- ❌ No vague claims ("better", "faster", "easier")

## Step 6: Create File

```bash
# Create use case file
touch docs/products/[product-name]/use-cases/[use-case-name].md

# Edit with template
```

## Step 7: Link to Specs
{{ ... }}
After creating the use case, identify which specs need to cover it:
- Does an existing spec cover this?
- Do we need a new spec?
- Update spec to reference this use case

## Quality Checklist

Before finalizing:
- [ ] Problem is specific and concrete
- [ ] Evidence of the problem exists
- [ ] Solution is clear but not implementation-specific
- [ ] Expected results are quantified
- [ ] Measurable impact is realistic
- [ ] Doesn't duplicate existing use cases
- [ ] Linked to relevant specs

## Notes

- Be skeptical. Most "use cases" are actually features.
- Push back on vague claims.
- Demand evidence and metrics.
- If you can't quantify the impact, it's probably not a use case.
