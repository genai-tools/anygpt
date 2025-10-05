# Release Automation Scripts

TypeScript scripts for automating the Release PR workflow in GitHub Actions.

## Scripts

### `check-releasable-changes`

Checks if there are any releasable changes using `nx release version --dry-run`.

**Usage in GitHub Actions:**
```yaml
- name: Check for changes
  id: check
  run: npx check-releasable-changes

- name: Use output
  if: steps.check.outputs.has_changes == 'true'
  run: echo "Has changes!"
```

**Local testing:**
```bash
npm run check-releasable-changes
```

## Development

### Run Scripts

Scripts run directly with Node 24's native TypeScript support:

```bash
# No build needed!
npm run check-releasable-changes
```

### Lint

```bash
npx nx lint release-automation
```

### Type Check

```bash
cd tools/release-automation
npx tsc --noEmit
```

### Why No Build Step?

We use Node 24's `--experimental-strip-types` flag to run TypeScript directly:
- ✅ No compilation needed
- ✅ Faster development
- ✅ Simpler CI/CD
- ✅ One less build step to maintain

## Benefits

- ✅ **Lintable**: ESLint can check the code
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Testable**: Can write unit tests
- ✅ **Reusable**: Can run locally or in CI
- ✅ **Maintainable**: Easier to read and modify than YAML-embedded scripts
- ✅ **Debuggable**: Better error messages and stack traces

## Architecture

```
tools/release-automation/
├── src/
│   ├── check-releasable-changes.ts # Checks for releasable changes
│   └── create-release-pr.ts        # (Unused - workflow uses gh CLI)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript config
├── project.json                    # Nx project config
└── README.md                       # This file
```

## Dependencies

- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub API wrapper
- `@octokit/rest` - GitHub REST API client
