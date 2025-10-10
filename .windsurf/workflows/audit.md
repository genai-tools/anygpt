---
description: Audit feature implementation status and synchronize documentation
---

# Audit Workflow

## Purpose

Create or update an implementation audit to reconcile **what was actually built** vs. **what was planned**. This is critical for:

- Understanding true feature status
- Finding gaps between design and reality
- Synchronizing documentation with codebase
- Planning remaining work accurately
- Capturing lessons learned

**When to use**:

- Feature appears complete but documentation says 0%
- Unclear what's actually implemented
- Before marking a feature complete
- After inheriting partially-built features
- When documentation is out of sync

**Output**: Comprehensive AUDIT.md documenting actual implementation status

---

## Step 1: Identify the Feature

Ask the user:

- **Feature path**: Which feature are we auditing? (e.g., `docs/projects/anygpt-ts/features/1-1-config-loader`)
- **Context**: Why are we auditing? (completion check, status unclear, inherited code, etc.)

```bash
# Verify feature exists
ls -la docs/projects/[project]/features/[feature-name]/
```

---

## Step 2: Review Planned Implementation

### 2.1 Read Design Documents

```bash
# Read what was planned
cat docs/projects/[project]/features/[feature-name]/README.md
cat docs/projects/[project]/features/[feature-name]/design.md
cat docs/projects/[project]/features/[feature-name]/tests.md
```

**Extract**:

- Planned components and their responsibilities
- Expected file structure
- Planned test coverage
- Design decisions
- Task breakdown (X/Y tasks)

### 2.2 Read Specifications

```bash
# Read original requirements
cat docs/products/[product]/specs/[spec-file].md
```

**Understand**:

- What the feature is supposed to do
- Acceptance criteria
- Key features required

---

## Step 3: Analyze Actual Implementation

### 3.1 Find Implementation Files

```bash
# Find all implementation files
find packages/[package-name] -name "*.ts" -not -name "*.test.ts" | sort

# Count lines of code
find packages/[package-name]/src -name "*.ts" -not -name "*.test.ts" -exec wc -l {} + | tail -1
```

### 3.2 Review Each Component

For each file in the implementation:

**Read the code**:

```bash
cat packages/[package-name]/src/[file].ts
```

**Document**:

- What does this file do?
- Is it in the design? (Yes/No/Bonus)
- Key features implemented
- Lines of code
- Complexity level

### 3.3 Check Test Coverage

```bash
# Run tests with coverage
npx nx test [package-name] --coverage

# Review coverage report
cat packages/[package-name]/coverage/index.html
```

**Capture**:

- Total test count
- Coverage percentage (overall and per-file)
- Which files are well-tested
- Which files need tests

### 3.4 Find Bonus Features

Look for files/features NOT in the original design:

- New patterns or approaches
- Additional utilities
- Enhanced functionality
- Optimizations

---

## Step 4: Create AUDIT.md

### 4.1 Document Structure

Create `docs/projects/[project]/features/[feature-name]/AUDIT.md`:

```markdown
# [Feature Name] - Implementation Audit

**Date**: [YYYY-MM-DD]  
**Status**: [Brief status summary]

---

## Executive Summary

[2-3 paragraph summary of findings]

**Key Findings**:

- ✅ [What's working well]
- ✅ [What's complete]
- ❌ [What's missing]
- ❌ [What needs work]
- ✅ [Bonus features found]

---

## Implementation Status by Component

### ✅ FULLY IMPLEMENTED

#### 1. **[Component Name]** (via `[file].ts`)

**Design Requirement**: [What was planned]

**Implementation**:

- ✅ [Feature 1]
- ✅ [Feature 2]
- ❌ [Missing feature]

**Code Location**: `packages/[package]/src/[file].ts`

- `[function]()` (lines X-Y)
- `[function]()` (lines A-B)

**Verdict**: ✅ **Complete** / ⚠️ **Partial** / ❌ **Missing**

---

### ✅ BONUS FEATURES (Not in Original Design)

#### N. **[Bonus Feature]** (`[file].ts`)

**Purpose**: [Why this was added]

**Features**:

- ✅ [Feature 1]
- ✅ [Feature 2]

**Code Location**: `packages/[package]/src/[file].ts`

**Verdict**: ✅ **Complete** - [Impact description]

---

### ❌ MISSING FEATURES

#### 1. **[Missing Feature]**

**Design Requirement**: [What was planned]

**Status**: ❌ Not implemented
**Priority**: 🔴 High / 🟡 Medium / 🟢 Low

**Tradeoff**:

- **Pro**: [Benefits of implementing]
- **Con**: [Costs/complexity]
- **Recommendation**: [Implement / Defer / Drop]

---

### ❌ MISSING TESTS

#### Current Test Coverage: **X%** (Target: >80%)

**Existing Tests** (N tests, all passing):

1. `[test-file].test.ts` - X tests for [purpose]
2. `[test-file].test.ts` - Y tests for [purpose]

**Missing Test Files**:

- ❌ `[file].test.ts` - [What needs testing]
- ❌ `[file].test.ts` - [What needs testing]

**Priority**: 🔴 **Critical** / 🟡 **Important** / 🟢 **Nice to have**

**Coverage Breakdown**:
```

| File      | % Stmts | % Branch | % Funcs | % Lines |
| --------- | ------- | -------- | ------- | ------- |
| [file].ts | XX.X%   | XX.X%    | XX.X%   | XX.X%   |

```

**Files Needing Tests**:
1. 🔴 `[file].ts` - X% coverage ([reason why critical])
2. 🟡 `[file].ts` - Y% coverage

---

## Documentation Status

### ✅ Package Documentation (User-Facing)
- ✅ README.md - [Status]
- ✅ Examples - [Status]
- ❌ API docs - [Status]

### ❌ Feature Documentation (Project-Facing)
- ❌ README.md - Shows X/Y tasks (reality: A/B done)
- ❌ design.md - Doesn't mention [bonus features]
- ❌ tests.md - Shows 0 tests (reality: N tests exist)

**Verdict**: ❌ **Out of Sync** - Needs major update

---

## Gap Analysis

### Critical Gaps (Must Fix)

1. **[Gap Name]** 🔴
   - Impact: [What this affects]
   - Effort: [Time estimate]
   - Files: [What needs to change]

### Nice-to-Have Gaps (Optional)

2. **[Gap Name]** 🟡
   - Impact: [What this affects]
   - Effort: [Time estimate]
   - Files: [What needs to change]

---

## Recommendations

### Immediate Actions (This Session)

1. ✅ **Create this audit document** ← You are here
2. 🔄 **Update feature README.md** - Reflect actual progress
3. 🔄 **Update design.md** - Document bonus features
4. 🔄 **Update tests.md** - Mark existing tests complete
5. 🔄 **Update project README.md** - Sync progress

### Next Session (Critical Path)

6. **[Critical task]**
   - [Details]
   - [Estimated time]

7. **[Critical task]**
   - [Details]
   - [Estimated time]

### Future Enhancements (Optional)

8. **[Optional task]** - If time permits
9. **[Optional task]** - If user requests

---

## Task Reconciliation

### Design Tasks (X total) vs. Reality

#### [Phase Name] (N tasks)
- ✅ [Task] - **DONE**
- ❌ [Task] - **MISSING**
- ✅ [Task] - **DONE** (different approach)

**Actual Progress**: A/X tasks complete (Y%)
**Documented Progress**: B/X tasks (Z%)

---

## Conclusion

[Summary paragraph]

**What Was Accomplished**:
1. ✅ [Major accomplishment]
2. ✅ [Major accomplishment]
3. ❌ [What's missing]

**Recommended Path Forward**:
1. [Action] (X hours) ← **Do this now**
2. [Action] (Y hours)
3. [Action] (Z hours)

**Estimated Time to Complete**: X-Y hours total

**Current Status**: X% complete, [next steps]
```

---

## Step 5: Reconcile Documentation

### 5.1 Update Feature README.md

**Update status section**:

```markdown
**Status**: 🔄 In Progress / ✅ Complete
**Progress**: X/Y tasks (Z%)

### Recent Updates

- [Date]: **Implementation audit completed** - Feature is X% complete
```

**Update implementation plan**:

- Mark completed tasks with [x]
- Update progress counts
- Add notes about bonus features
- Document deferred tasks

### 5.2 Update design.md

**Add Design Changes section** if design evolved:

```markdown
## Design Changes

### [Date]: [Change Description]

**Reason**: [Why the change was needed]
**Impact**: [What this affects]
**Implementation**: [What was actually built]
```

**Document bonus features**:

```markdown
### Bonus Components (Not in Original Design)

**[Component Name]**

- Purpose: [Why added]
- Implementation: [How it works]
- Benefits: [What it provides]
```

### 5.3 Update Project README.md

**Sync feature status**:

```markdown
| Feature        | Status         | Progress       |
| -------------- | -------------- | -------------- |
| [Feature Name] | 🔄 In Progress | X/Y tasks (Z%) |
```

**Update phase progress**:

```markdown
**Overall**: X/Y features (Z%)

### Phase N: [Name] (A/B complete)
```

---

## Step 6: Commit Audit

```bash
# Stage audit and updated docs
git add docs/projects/[project]/features/[feature-name]/

# Commit
git commit -m "docs([feature]): add implementation audit

- Audited actual implementation vs. design
- Found X/Y tasks complete (Z%)
- Identified N bonus features
- Documented M missing tests
- Updated all feature documentation

Status: X% complete, Y critical gaps remaining"

# Push
git push
```

---

## Best Practices

### Be Honest and Objective

- **Don't inflate progress** - be accurate
- **Acknowledge gaps** - they're opportunities
- **Celebrate wins** - recognize bonus features
- **Be specific** - vague audits aren't helpful

### Focus on Reality

- **Code is truth** - what's in the codebase is real
- **Tests prove it** - if tests pass, it works
- **Coverage matters** - untested code is risky
- **Documentation lags** - that's normal, just sync it

### Provide Actionable Recommendations

- **Prioritize gaps** - 🔴 Critical, 🟡 Important, 🟢 Nice-to-have
- **Estimate effort** - help plan next steps
- **Suggest order** - what to do first
- **Be realistic** - consider time and resources

### Keep It Updated

- **Living document** - update as work progresses
- **Track changes** - note when gaps are filled
- **Final update** - mark complete when done
- **Lessons learned** - capture for next time

---

## Example: Config Loader Audit

**Context**: Feature appeared 80% complete but docs said 0%

**Findings**:

- ✅ Core functionality complete and working
- ✅ 5 bonus features beyond original design
- ❌ Test coverage 21% (target: 80%)
- ❌ Documentation completely out of sync

**Actions Taken**:

1. Created comprehensive AUDIT.md
2. Updated all feature documentation
3. Expanded test suite (21% → 43%)
4. Implemented missing error types
5. Marked feature complete

**Result**: Feature went from "unclear status" to "100% complete" in ~4 hours

---

## Integration with Other Workflows

**Before /audit**:

- Feature exists but status is unclear
- Documentation doesn't match reality
- Inherited partially-built code

**During /audit**:

- Use `/implement` to fill critical gaps
- Update documentation as you go
- Commit audit findings

**After /audit**:

- Use `/implement` to complete remaining work
- Use `/commit` for documentation updates
- Clear path forward established

---

## Troubleshooting

### Can't Find Implementation

- Check all packages: `find packages -name "*[keyword]*"`
- Search by feature name: `grep -r "[feature]" packages/`
- Check git history: `git log --all --grep="[feature]"`
- Ask user where implementation lives

### Design Doesn't Match Reality

- **This is normal** - designs evolve
- Document what actually exists
- Explain why it's different
- Update design.md with reality

### Too Many Gaps

- **Prioritize ruthlessly** - what's critical?
- **Focus on MVP** - what's minimum viable?
- **Defer nice-to-haves** - mark as future work
- **Be realistic** - don't try to fix everything

### Documentation Overwhelming

- **Start with AUDIT.md** - capture findings
- **Update README.md next** - sync status
- **Update design.md** - document reality
- **Update project docs last** - overall status

---

## Notes

- Audits are about **truth**, not judgment
- Finding gaps is **good** - now you can fix them
- Bonus features are **wins** - celebrate them
- Documentation lag is **normal** - just catch up
- Audits **save time** - prevent confusion later
- **Update audit** as you fill gaps
- **Mark complete** when feature is done
- **Capture lessons** for next feature
