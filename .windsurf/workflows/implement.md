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

## Step 2: Review Context

1. Read feature docs: README.md, design.md, tests.md
2. Check existing code: `find packages -name "*[feature-name]*"`
3. Review AGENTS.md - MUST follow Nx conventions
4. Use `nx` commands for all tasks (test, build, lint)

---

## Step 3: Check Dependencies & Setup

1. Check Dependencies table - if blocked, STOP and inform user
2. Install external deps if needed: `npm install [packages]`
3. Create package structure if new (follow existing patterns)
4. Clean up legacy code if applicable (document with BREAKING CHANGE)

---

## Step 4: TDD Loop (RED-GREEN-REFACTOR)

For each task:

1. **Write test first** (RED) - `npx nx test [package]`
2. **Implement minimum code** (GREEN) - make test pass
3. **Refactor** - clean up, keep tests green
4. **Update docs** - check off task, update progress
5. **Commit** - use `/commit` workflow

Test conventions: `[filename].test.ts` in same directory as source

---

## Step 5: Integration & Coverage

After completing a phase:

1. Run tests: `npx nx test [package] --coverage`
2. Test affected: `npx nx affected -t test build`
3. Verify coverage: Core >80%, errors 100%, overall >40%
4. Manual test if CLI/user-facing

---

## Step 6: Quality Checks

Before marking complete:

```bash
# Run all checks (RECOMMENDED)
npx nx run-many -t lint test build typecheck --projects=[package]

# Or for affected
npx nx affected -t lint test build typecheck
```

---

## Step 7: Mark Complete

When all tasks done:

1. **Code docs**: JSDoc on public APIs, package README, examples
2. **Feature docs**: Update README.md (status, progress, metrics)
3. **Project docs** (CRITICAL): Update project README.md status table and roadmap.md
4. Commit and push all documentation

---

## Step 8: Final Commit & Push

```bash
# Commit feature
git add packages/ docs/
/commit  # Use commit workflow

# Push
git push
```

**Self-review checklist**:
- [ ] Tests pass, coverage meets targets
- [ ] No lint/type errors
- [ ] All docs updated (feature + project + roadmap)
- [ ] Spec requirements satisfied

---

## Step 9: Replan & Update Design (When Needed)

**If design doesn't match reality**:

1. **Document what changed** in design.md (add "Design Changes" section)
2. **Update task list** in README.md (recalculate progress)
3. **Update tests.md** if test scenarios changed
4. **Commit replan**: `/commit` with message "docs(feature): replan [feature-name]"
5. **Return to Step 4** - continue with updated plan

---

## Best Practices

- **TDD**: Write tests first, run frequently, use `npx nx test`
- **Workspace**: Follow AGENTS.md, use Nx commands, match existing patterns
- **Design**: Can evolve - update design.md when reality differs
- **Git**: Commit frequently, use `/commit`, don't commit broken code
- **Docs**: Update as you go, not at the end

---

## Troubleshooting

- **Tests won't pass**: Read errors, debug step-by-step, simplify
- **Blocked by dependencies**: Mock it or implement blocker first
- **Design doesn't work**: Go to Step 9 (Replan)
- **Workspace rules unclear**: Read AGENTS.md, check existing code

---

## Notes

- This workflow assumes TDD approach - tests before code
- Follow the RED-GREEN-REFACTOR cycle strictly
- Commit frequently to avoid losing work
- Update documentation as you go, not at the end
- Quality checks are mandatory, not optional
- If blocked, stop and resolve blockers first
- **Always synchronize all documentation** when marking complete:
  - Feature README.md
  - Feature AUDIT.md (if exists)
  - Project README.md
  - Project roadmap.md
- **Coverage targets are guidelines**, not absolutes:
  - Focus on testing critical paths
  - 100% coverage on error handling
  - Document deferred tests
- **Design evolution is expected**:
  - Update design.md when reality differs
  - Document why changes were made
  - Keep all docs synchronized
- **Pragmatic completion** beats perfectionism:
  - Ship working features, iterate later
  - Defer non-critical enhancements
  - Unblock dependent features quickly
