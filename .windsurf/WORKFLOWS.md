# Workflows Guide

AI-assisted workflows for common development tasks in the `.windsurf/workflows/` directory.

## Available Workflows

### Documentation Workflows (in `docs/`)

- **`/use-case`** - Create a new use case with critical review
- **`/spec`** - Create, update, or review technical specifications  
- **`/project`** - Bootstrap a project roadmap from use cases and specs
- **`/roadmap`** - Create implementation roadmap from architecture and specs
- **`/feature`** - Design and plan implementation for a specific feature

### Development Workflows

- **`/implement`** - **NEW!** Implement a designed feature with TDD approach
- **`/commit`** - Commit staged files with AI-generated message
- **`/release`** - Minimal release procedure

---

## Workflow Sequence

Here's the typical flow from idea to production:

```
1. /use-case     → Define user needs and scenarios
2. /spec         → Create technical specifications
3. /project      → Bootstrap project structure
4. /roadmap      → Plan implementation order
5. /feature      → Design individual features
6. /implement    → Build features with TDD ⭐ NEW
7. /commit       → Commit changes
8. /release      → Publish to production
```

---

## The `/implement` Workflow

### Purpose
Implement a feature using Test-Driven Development (TDD). Supports **new features** and **refactoring existing code**. Design can evolve - replanning is expected and encouraged.

### When to Use
- After completing `/feature` workflow
- Feature README.md exists with implementation tasks
- Ready to write actual code
- **Also for refactoring** - when existing code needs improvement

### What It Does
1. **Reviews feature context** - design, tests, dependencies, **existing code**
2. **Checks workspace rules** - AGENTS.md, Nx conventions (MANDATORY)
3. **Checks blockers** - ensures dependencies are ready
4. **Sets up environment** - package structure, testing
5. **TDD loop** - RED → GREEN → REFACTOR
   - Write failing tests (RED)
   - Implement minimum code (GREEN)
   - Refactor and improve (REFACTOR)
   - **Reality check** - does design still make sense?
6. **Replan when needed** - update design.md and tasks
7. **Quality checks** - coverage, linting, types (using Nx)
8. **Updates project status** - keeps project README.md in sync
9. **Documentation** - updates all status and docs
10. **Commits progress** - frequent, focused commits

### Example Usage

```bash
# Start implementing a feature
/implement

# AI will ask: Which feature?
# You respond: docs/projects/anygpt-ts/features/1-1-config-loader

# AI will then:
# - Review the feature design
# - Check dependencies
# - Start TDD implementation loop
# - Write tests → implement → refactor → commit
# - Repeat until feature is complete
```

### Key Principles

**Test-Driven Development (TDD)**:
- ✅ Write tests FIRST, before implementation
- ✅ Run tests frequently (every few minutes)
- ✅ Keep tests simple and focused
- ✅ Commit when tests pass

**Workspace Rules (MANDATORY)**:
- ✅ Follow AGENTS.md - Nx conventions are non-negotiable
- ✅ Use `npx nx` commands for all tasks (build, test, lint)
- ✅ Match existing code patterns and structure
- ✅ Use shared types from `@anygpt/types`
- ✅ TypeScript strict mode

**Design Evolution**:
- ✅ Design can change during implementation
- ✅ Update design.md when reality differs from plan
- ✅ Replan tasks in README.md as you learn
- ✅ Document why design evolved
- ✅ Keep project README.md synchronized

**Quality Standards**:
- ✅ >80% test coverage
- ✅ No linting errors
- ✅ Type-safe code
- ✅ All tests passing

**Git Workflow**:
- ✅ Commit frequently (after each passing test)
- ✅ Use `/commit` for consistent messages
- ✅ Don't commit broken code
- ✅ Push regularly

---

## Quick Reference

### Starting a New Feature

```bash
# 1. Design the feature
/feature

# 2. Implement the feature
/implement

# 3. Commit changes
git add .
/commit

# 4. Release (when ready)
/release
```

### Continuing Work on Existing Feature

```bash
# Just start implementing
/implement

# AI will detect current progress and continue
```

### Checking Feature Status

```bash
# View feature README
cat docs/projects/[project]/features/[feature-name]/README.md

# Check implementation tasks
# Look for checkboxes: [ ] Not done, [x] Done
```

---

## Tips for Success

### Before Starting `/implement`
- ✅ Feature is designed (`/feature` completed)
- ✅ README.md has clear implementation tasks
- ✅ Dependencies are identified
- ✅ Tests are defined (in tests.md or README.md)
- ✅ **Reviewed AGENTS.md** - understand workspace rules

### During `/implement`
- ✅ **Follow workspace rules** - AGENTS.md, Nx conventions
- ✅ **Check existing code** - understand current patterns
- ✅ Follow TDD strictly (tests first!)
- ✅ Run tests frequently (using `npx nx test`)
- ✅ **Reality check** - does design still make sense?
- ✅ **Replan if needed** - update design.md and tasks
- ✅ Commit small, working increments
- ✅ **Update project status** - keep project README.md in sync
- ✅ Ask for help when stuck

### After `/implement`
- ✅ All tests pass
- ✅ Coverage >80%
- ✅ **Project README.md updated** - status, progress, percentage
- ✅ Documentation updated
- ✅ Feature marked complete
- ✅ Dependent features unblocked

---

## Troubleshooting

### "Feature not found"
- Ensure you've run `/feature` first
- Check feature path is correct
- Verify README.md exists

### "Blocked by dependencies"
- Check Dependencies table in feature README
- Implement blocker features first
- Or create mocks/stubs temporarily

### "Tests won't pass"
- Read error messages carefully
- Debug step by step
- Simplify until tests pass
- Ask AI for help with error messages

### "Design doesn't work"
- **Don't force a bad design** - adapt instead
- Follow **Step 9: Replan & Update Design** in workflow
- Update design.md with changes and rationale
- Replan tasks in feature README.md
- Update project README.md with new task count
- Commit the replan
- Continue with updated plan

### "Workspace rules unclear"
- Read AGENTS.md carefully
- Check existing code for patterns
- Use `nx_docs` MCP tool for Nx questions
- Ask for clarification - don't guess

### "Project status out of sync"
- Update feature README.md first
- Then update project README.md
- Recalculate percentages
- Keep both synchronized
- Commit status updates regularly

---

## Workflow Files

Located in `.windsurf/workflows/`:

- **`commit.md`** - Commit workflow
- **`release.md`** - Release workflow
- **`implement.md`** - Implementation workflow ⭐ NEW
- **`docs/feature.md`** - Feature design workflow
- **`docs/spec.md`** - Spec creation workflow
- **`docs/use-case.md`** - Use case workflow
- **`docs/project.md`** - Project bootstrap workflow
- **`docs/roadmap.md`** - Roadmap creation workflow

---

## Contributing

When creating new workflows:
1. Add YAML frontmatter with description
2. Follow existing workflow structure
3. Include examples and troubleshooting
4. Update this WORKFLOWS.md guide
5. Test the workflow before committing

---

## Notes

- Workflows are AI-assisted, not automated
- AI will guide you through each step
- You maintain control and make decisions
- Workflows can be customized per project
- Use `// turbo` annotation for auto-run steps (see release.md)
