---
trigger: model_decision
description: Whenever you want to create a new temporary file
---

# Temporary Files Rule

## CRITICAL: All Temporary Files Go in ./tmp/

**NEVER create temporary files in workspace root or project directories.**

### The Problem

Temporary test files (e.g., `test-invalid-rule.ts`) can be accidentally committed if the agent is interrupted before cleanup.

### The Solution

ALL temporary files MUST be created in `./tmp/` directory:

```bash
# ❌ Bad - Creates file in root
write_to_file('/workspace/test-file.ts', ...)

# ✅ Good - Creates file in tmp
write_to_file('/workspace/tmp/test-file.ts', ...)
```

### When This Applies

- Testing type errors with `@ts-expect-error`
- Creating scratch files to verify behavior
- Generating test data or fixtures
- Any file that will be deleted after use

### Why ./tmp

- Already in `.gitignore`
- Clear separation from project files
- Easy to clean up entire directory
- No risk of accidental commits

### Enforcement

Before creating ANY file, ask: **"Will this be deleted?"**

- If **YES** → MUST go in `./tmp/`
- If **NO** → Follow normal project structure

### Example

```typescript
// Testing type constraints
write_to_file('./tmp/type-test.ts', '...');
run_command('npx tsc --noEmit tmp/type-test.ts');
run_command('rm tmp/type-test.ts');
```

**This rule applies to ALL agents working in this workspace.**
