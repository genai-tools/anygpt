---
description: Implement a designed feature with TDD approach
---

# Implement Workflow

## Purpose

Implement a feature using Test-Driven Development (TDD) principles. Supports both **new features** and **refactoring existing code**. Design can evolve during implementation - replanning is expected and encouraged.

**Prerequisites**: 
- Feature has been designed using `/feature` workflow (or exists in codebase)
- Feature folder exists in `docs/projects/[project]/features/[phase]-[order]-[feature-name]/`
- README.md with implementation tasks exists

**Key Principles**:
- ✅ **Design evolves** - Update design.md when reality differs from plan
- ✅ **Replan freely** - Adjust tasks in README.md as you learn
- ✅ **Workspace rules** - MUST follow AGENTS.md and project conventions
- ✅ **Update status** - Keep project README.md synchronized

**Output**: Working, tested implementation of the feature

---

## Step 1: Identify the Feature

Ask the user:
- **Feature path**: Which feature are we implementing? (e.g., `docs/projects/anygpt-ts/features/1-1-config-loader`)
- **Starting point**: Are we starting fresh or continuing from a checkpoint?

```bash
# Verify feature exists
ls -la docs/projects/[project]/features/[feature-name]/
cat docs/projects/[project]/features/[feature-name]/README.md
```

---

## Step 2: Review Feature Context & Workspace Rules

### 2.1 Read Feature Documentation
1. **README.md** - Implementation plan, dependencies, status
2. **design.md** - Technical design, architecture, interfaces
3. **tests.md** - Test scenarios (if exists)
4. **Spec** - Original requirements

### 2.2 Review Existing Codebase (CRITICAL)
**If feature already partially exists**:
```bash
# Find existing implementation
find packages -name "*[feature-name]*"

# Check existing code structure
ls -la packages/[package-name]/

# Review existing tests
ls -la packages/[package-name]/tests/
```

**Understand**:
- What already exists vs. what's planned
- Current code patterns and conventions
- Existing test structure
- What needs refactoring vs. new implementation

### 2.3 Review Workspace Rules (MANDATORY)
**Read and follow**:
```bash
# Workspace rules - MUST FOLLOW
cat AGENTS.md

# Project architecture
cat docs/projects/[project]/architecture.md

# Nx workspace structure
npx nx graph --print | jq '.graph.nodes'
```

**Critical Rules**:
- ✅ Use `nx` commands for all tasks (build, test, lint)
- ✅ Follow Nx monorepo conventions
- ✅ Use project-specific tooling (tsdown, vitest, etc.)
- ✅ Match existing code style and patterns
- ✅ Follow TypeScript strict mode
- ✅ Use existing type definitions from `@anygpt/types`

---

## Step 3: Check Dependencies

**Review the Dependencies table** in feature README:

**Blockers (🚫)**:
- Check if blocked features are complete
- If blocked, STOP and inform user
- Suggest implementing blocker first

**Soft Dependencies (⚠️)**:
- Note what will be needed
- Can proceed but may need mocks/stubs

**External Dependencies (🌐)**:
- Install required packages
- Verify versions match project standards

```bash
# Install dependencies if needed
npm install [packages]

# Or add to package.json
```

---

## Step 4: Setup Development Environment

**Create package structure** (if new package):

```bash
# For new package
mkdir -p packages/[package-name]/src
mkdir -p packages/[package-name]/tests

# Create package.json, tsconfig.json, etc.
# Follow project conventions from existing packages
```

**Setup testing infrastructure**:

```bash
# Verify test setup works
npm test -- [package-name]
```

---

## Step 5: TDD Implementation Loop

For each task in the Implementation Plan:

### 5.1 Select Next Task
- Pick the next unchecked task from README.md
- Ensure dependencies are complete
- Update task status to 🔄 In Progress

**Reality Check**:
- Does this task still make sense?
- Is the design still valid?
- Do we need to replan?

**If design is wrong** → Go to Step 9: Replan & Update Design

### 5.2 Write Tests First (RED)
**Before writing any implementation code**:

1. **Read test scenarios** from tests.md (or README.md)
2. **Write failing tests** that define expected behavior
3. **Run tests** - they should FAIL (RED)

```bash
# Run tests for the feature
npm test -- [package-name]

# Or run specific test file
npm test -- [test-file-path]
```

**Test types to consider**:
- **Unit tests**: Individual functions/classes
- **Integration tests**: Component interactions
- **E2E tests**: Full workflows
- **Error tests**: Error handling paths

### 5.3 Implement Minimum Code (GREEN)
**Write the simplest code that makes tests pass**:

1. **Implement the feature** following design.md
2. **Run tests frequently** - aim for GREEN
3. **Don't over-engineer** - just make tests pass

```bash
# Run tests in watch mode for rapid feedback
npm test -- --watch [package-name]
```

### 5.4 Refactor (REFACTOR)
**Once tests pass, improve the code**:

1. **Clean up** - remove duplication
2. **Improve naming** - make intent clear
3. **Add comments** - explain complex logic
4. **Run tests** - ensure still GREEN

### 5.5 Update Documentation
**Mark progress**:

1. **Check off task** in feature README.md
2. **Update progress count** in feature README.md (e.g., 3/24 tasks)
3. **Update test status** in tests.md
4. **Update project README.md** - sync feature status
5. **Add notes** about decisions made

**Update Project Status**:
```bash
# Update project README.md with current progress
cat docs/projects/[project]/README.md

# Update:
# - Feature status (❌ → 🔄 → ✅)
# - Progress count (X/N tasks)
# - Overall percentage
```

### 5.6 Commit Progress
**Commit working increments**:

```bash
# Stage changes
git add [files]

# Use /commit workflow for AI-generated message
/commit
```

**Commit frequently**:
- After each passing test
- After each completed task
- Before switching tasks

---

## Step 6: Integration Testing

**After completing a phase** (e.g., Phase 1: Basic Loading):

### 6.1 Run Integration Tests
```bash
# Run all tests for the package
npm test -- [package-name]

# Run integration tests specifically
npm test -- [package-name] -t "integration"
```

### 6.2 Test with Dependent Features
If other features depend on this:
- Test integration points
- Verify interfaces work as expected
- Update dependent feature tests

**Use Nx to test affected projects**:
```bash
# Test all affected projects
npx nx affected -t test

# Build all affected projects
npx nx affected -t build
```

### 6.3 Manual Testing
For CLI/user-facing features:
```bash
# Build the package
npm run build -- [package-name]

# Test manually
node dist/[entry-point].js [args]
```

---

## Step 7: Quality Checks

**Before marking feature complete**:

### 7.1 Test Coverage
```bash
# Check coverage (use Nx)
npx nx test [package-name] --coverage

# Aim for >80% coverage
```

### 7.2 Linting
```bash
# Run linter (use Nx)
npx nx lint [package-name]

# Fix issues
npx nx lint [package-name] --fix
```

### 7.3 Type Checking
```bash
# Run TypeScript compiler (use Nx)
npx nx typecheck [package-name]
```

### 7.4 Build
```bash
# Ensure package builds (use Nx)
npx nx build [package-name]

# Build with dependencies
npx nx build [package-name] --with-deps
```

### 7.5 Run All Quality Checks
```bash
# Run all checks at once (RECOMMENDED)
npx nx run-many -t lint test build typecheck --projects=[package-name]

# Or for all affected projects
npx nx affected -t lint test build typecheck
```

### 7.6 E2E Tests
```bash
# Run E2E tests if applicable
npx nx e2e [e2e-project]
```

---

## Step 8: Documentation

**Update documentation**:

### 8.1 Code Documentation
- [ ] JSDoc comments on public APIs
- [ ] README for the package
- [ ] Usage examples

### 8.2 Feature Documentation
- [ ] Update feature README.md status to ✅ Complete
- [ ] Update progress count to N/N tasks
- [ ] Add completion date to Recent Updates
- [ ] Document any deviations from design
- [ ] Update design.md if design changed during implementation

### 8.3 Project Documentation (CRITICAL)
- [ ] **Update project README.md** with final status
- [ ] Update overall progress percentage
- [ ] Update phase completion counts
- [ ] Mark feature as ✅ Complete in project table

**Example**:
```markdown
# In docs/projects/anygpt-ts/README.md

**Overall**: 1/15 features (7%)

### Phase 1: Foundation (1/4)

| Feature | Status | Progress |
|---------|--------|----------|
| [Configuration Loader](./features/1-1-config-loader/) | ✅ Complete | 24/24 tasks |
```

### 8.4 Additional Documentation
- [ ] Update project roadmap.md
- [ ] Update architecture.md if needed
- [ ] Add examples to docs/examples/

---

## Step 9: Final Commit & Review

### 9.1 Final Commit
```bash
# Stage all changes
git add .

# Commit with feature completion message
/commit
```

### 9.2 Self Review
**Review your work**:
- [ ] All tests pass
- [ ] Coverage >80%
- [ ] No linting errors
- [ ] Types are correct
- [ ] Documentation is complete
- [ ] Spec requirements satisfied

### 9.3 Quality Checklist
Check off items in feature README.md:
- [ ] Design document is complete
- [ ] All test scenarios are defined
- [ ] All tests are implemented and passing
- [ ] Code coverage > 80%
- [ ] Spec requirements are satisfied
- [ ] Examples from spec work
- [ ] Documentation is updated

---

## Step 9: Replan & Update Design (When Needed)

**When to replan**:
- Design doesn't match reality
- Better approach discovered
- Technical constraints found
- Dependencies changed
- Scope needs adjustment

### 9.1 Update Design Document
**If design changed**:

1. **Document what changed**:
   ```markdown
   ## Design Changes
   
   ### [Date]: [Change Description]
   **Reason**: [Why the change was needed]
   **Impact**: [What this affects]
   ```

2. **Update affected sections**:
   - Architecture diagrams
   - Component descriptions
   - Interface definitions
   - Error handling approach

3. **Keep history**:
   - Don't delete old design
   - Add "Design Changes" section
   - Explain rationale

### 9.2 Replan Implementation Tasks
**Update README.md Implementation Plan**:

1. **Review current tasks**:
   - Which tasks are no longer needed?
   - What new tasks are required?
   - What's the new order?

2. **Update task list**:
   ```markdown
   ### Phase 1: [Phase Name]
   - [x] Completed task
   - [ ] ~~Old task~~ (no longer needed)
   - [ ] New task based on learning
   - [ ] Adjusted task
   ```

3. **Update progress count**:
   - Recalculate total tasks
   - Update progress (e.g., 5/20 → 5/18)

4. **Update project README.md**:
   - Sync new task count
   - Update percentage

### 9.3 Update Test Scenarios
**If tests need to change**:

1. **Update tests.md**:
   - Add new test scenarios
   - Mark obsolete tests
   - Update expected behaviors

2. **Refactor existing tests**:
   - Update test code
   - Keep tests passing
   - Maintain coverage

### 9.4 Communicate Changes
**Document the replan**:

```markdown
## Recent Updates (in feature README.md)
- [Date]: **Replanned implementation** - Discovered [X], adjusted approach to [Y]
```

**Commit the replan**:
```bash
git add docs/projects/[project]/features/[feature]/
/commit
# Message: "docs(feature): replan [feature-name] implementation"
```

### 9.5 Return to Implementation
**After replanning**:
- Go back to Step 5: TDD Implementation Loop
- Continue with updated plan
- Keep design and plan synchronized

---

## Step 10: Unblock Dependent Features

**If other features were blocked by this**:

1. **Find dependent features** - check Dependencies tables
2. **Notify about completion** - update their status
3. **Suggest next feature** to implement

---

## Best Practices

### TDD Discipline
- **ALWAYS write tests first** - no exceptions
- **Run tests frequently** - every few minutes
- **Keep tests simple** - one assertion per test when possible
- **Test behavior, not implementation** - focus on what, not how
- **Use Nx for testing** - `npx nx test [project]`

### Workspace Rules (MANDATORY)
- **Follow AGENTS.md** - Nx conventions are non-negotiable
- **Use Nx commands** - Never use npm/pnpm scripts directly for tasks
- **Match existing patterns** - Review existing packages first
- **Use shared types** - Import from `@anygpt/types`
- **Follow project structure** - Match existing package layout
- **TypeScript strict mode** - No `any` types without good reason

### Design Evolution
- **Design can change** - Don't force a bad design
- **Update design.md** - Keep documentation current
- **Replan tasks** - Adjust README.md as you learn
- **Document changes** - Explain why design evolved
- **Keep project synced** - Update project README.md regularly

### Code Quality
- **Follow project conventions** - match existing code style
- **Keep functions small** - single responsibility
- **Use meaningful names** - self-documenting code
- **Handle errors properly** - don't swallow exceptions

### Git Workflow
- **Commit frequently** - small, focused commits
- **Use /commit workflow** - consistent commit messages
- **Don't commit broken code** - tests should pass
- **Push regularly** - don't lose work

### Communication
- **Update status regularly** - keep README.md current
- **Document decisions** - explain why, not just what
- **Ask when stuck** - don't waste time guessing
- **Celebrate progress** - acknowledge completed tasks

---

## Troubleshooting

### Tests Won't Pass
1. **Read error messages carefully** - they tell you what's wrong
2. **Debug step by step** - add console.logs
3. **Simplify** - comment out code until tests pass
4. **Ask for help** - show error messages

### Blocked by Dependencies
1. **Check if blocker is really needed** - can you mock it?
2. **Implement blocker first** - use /implement on blocker
3. **Create stub/mock** - temporary implementation
4. **Update design** - maybe dependency isn't needed

### Design Doesn't Work
1. **Don't force it** - if design is wrong, fix it
2. **Go to Step 9** - Replan & Update Design
3. **Update design.md** - document changes
4. **Adjust tests** - reflect new design
5. **Update README.md** - replan tasks
6. **Update project README.md** - sync status
7. **Commit replan** - document the change
8. **Continue implementation** - with updated plan

### Workspace Rules Unclear
1. **Read AGENTS.md** - workspace conventions
2. **Check existing code** - find similar patterns
3. **Use Nx docs** - `nx_docs` MCP tool
4. **Ask for clarification** - don't guess

### Project Status Out of Sync
1. **Update feature README.md** - current progress
2. **Update project README.md** - overall status
3. **Recalculate percentages** - keep accurate
4. **Commit updates** - use /commit workflow

### Running Out of Time
1. **Focus on MVP** - what's the minimum viable?
2. **Skip nice-to-haves** - mark as future work
3. **Commit what works** - partial progress is progress
4. **Document remaining work** - update README.md

---

## Example Session

```bash
# 1. Start implementation
/implement

# AI: Which feature?
# User: docs/projects/anygpt-ts/features/1-1-config-loader

# 2. AI reviews feature, checks dependencies, starts TDD loop

# 3. AI writes test for ConfigSearcher
# Creates: packages/config/tests/config-searcher.test.ts

# 4. AI runs test (RED)
npm test -- config

# 5. AI implements ConfigSearcher
# Creates: packages/config/src/config-searcher.ts

# 6. AI runs test (GREEN)
npm test -- config

# 7. AI refactors and commits
git add packages/config
/commit

# 8. Repeat for next task...
```

---

## Integration with Other Workflows

**Before /implement**:
- Use `/feature` to design the feature
- Use `/spec` to define requirements
- Use `/use-case` to understand user needs

**During /implement**:
- Use `/commit` for consistent commits
- Reference design.md and tests.md
- Update README.md progress

**After /implement**:
- Use `/release` to publish changes
- Update project roadmap
- Start next feature with /implement

---

## Notes

- This workflow assumes TDD approach - tests before code
- Follow the RED-GREEN-REFACTOR cycle strictly
- Commit frequently to avoid losing work
- Update documentation as you go, not at the end
- Quality checks are mandatory, not optional
- If blocked, stop and resolve blockers first
