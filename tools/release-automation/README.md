# Release Automation Scripts

TypeScript scripts for automating the Release PR workflow in GitHub Actions.

## Scripts

### `create-release-pr`

Creates or updates a Release PR when releasable changes are detected.

**Usage in GitHub Actions:**
```yaml
- name: Create Release PR
  run: npx create-release-pr
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Local testing:**
```bash
cd tools/release-automation
npm install
npm run build
GITHUB_TOKEN=your_token npm run create-release-pr
```

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

### Build

```bash
npm run build
# or from workspace root
npx nx build release-automation
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
│   ├── create-release-pr.ts      # Creates/updates Release PR
│   └── check-releasable-changes.ts # Checks for changes
├── dist/                          # Compiled JavaScript
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript config
├── project.json                   # Nx project config
└── README.md                      # This file
```

## Dependencies

- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub API wrapper
- `@octokit/rest` - GitHub REST API client
