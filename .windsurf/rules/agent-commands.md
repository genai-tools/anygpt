---
trigger: model_decision
description: Whenever you want to run a terminal command
---

# Agent Command Rules

## Critical: No Interactive Commands
❌ Never run TUIs, browsers, editors, or prompts

## Testing
```bash
# ❌ Bad - Opens TUI
vitest
npx nx test

# ✅ Good - Non-interactive
vitest run --reporter=verbose
npx nx test my-package -- --run --reporter=verbose
```

## Nx Commands
```bash
# ❌ Bad - Opens browser
npx nx graph
npx nx show project my-package

# ✅ Good - JSON output
npx nx graph --json
npx nx show project my-package --json
```

## Git & Pagers
```bash
# ❌ Bad - Interactive/pager
git add -p
git log

# ✅ Good - Non-interactive
git add file.ts
git --no-pager log -n 10
PAGER=cat git log
```

## Required Flags
- Vitest: `--run --reporter=verbose` or `--reporter=json`
- Nx: `--json` for graph/show commands
- Git: `--no-pager` or `PAGER=cat`
- npm: `--yes` or `-y` for init/install

## Validation Checklist
- [ ] No TUI (vitest, htop)
- [ ] No browser (nx graph)
- [ ] No editor (vim, nano)
- [ ] No prompts (git add -p)
- [ ] Has non-interactive flags
- [ ] Will exit on its own

**Golden Rule**: If it might wait for input or open UI, DON'T RUN IT.

## Testing with Vitest/Nx
```bash
# ❌ Bad - Opens interactive watch mode (press q to quit)
npx nx test my-package
vitest

# ✅ Good - Non-interactive, exits automatically
npx nx test my-package --run --reporter=verbose
npx nx test my-package -- --run --reporter=json
vitest run --reporter=verbose

# ✅ With coverage
npx nx test my-package --coverage --run
```

## Why This Matters
Interactive commands will:
- Block the terminal waiting for input
- Require manual intervention (press 'q', 'Ctrl+C')
- Prevent automation and CI/CD
- Cause agent workflows to hang

**Always use `--run` flag with Nx test commands\!**
