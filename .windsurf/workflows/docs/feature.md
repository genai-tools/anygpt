---
description: Design and plan implementation for a specific feature
---

# Feature Workflow

## Purpose

Create detailed design, test scenarios, and implementation plan for a specific feature.

**Input**: Spec + Project context  
**Output**: Feature folder with design, tests, and status tracking

## Step 1: Identify the Feature

Ask the user:
- **Feature name**: What are we building? (e.g., "cli-benchmark", "provider-router")
- **Phase**: Which phase? (1=Foundation, 2=Core, 3=Advanced, 4=Integration)
- **Phase order**: Which number in the phase? (e.g., 1, 2, 3...)
- **Project**: Which project? (e.g., "anygpt-ts")
- **Spec**: Which spec defines this feature?

**Feature folder naming**: `[phase]-[order]-[feature-name]` (e.g., `3-5-cli-benchmark`)

## Step 2: Review Context

**Review the spec** to understand:
- What the feature must do
- Required behavior
- Interface/API contract
- Error handling
- Examples

**Review the architecture** to understand:
- Where this feature fits in the system
- What components it interacts with
- What dependencies are available

```bash
# Find the spec
ls docs/products/[product-name]/specs/

# Read project architecture
cat docs/projects/[project-name]/architecture.md
```

## Step 3: Feature Design

Create feature-specific design answering:

### Architecture
- **Components**: What modules/classes/functions?
- **Data structures**: How to represent data?
- **Algorithms**: Any complex logic?
- **Patterns**: Which design patterns to use?

### Dependencies
- **Internal**: What other features does this depend on?
- **External**: What libraries/frameworks needed?
- **APIs**: What interfaces does it expose/consume?

### Error Handling
- **Error types**: What can go wrong?
- **Recovery**: How to handle errors?
- **Propagation**: How errors flow through system?

### Implementation Strategy
- **Phases**: Break into smaller tasks
- **Order**: What to build first?
- **Milestones**: Key checkpoints

## Step 4: Define Test Scenarios

For each aspect of the spec, create test scenarios:

### From Spec Requirements
- For each "MUST" in spec → test scenario
- For each example in spec → E2E test
- For each error code in spec → error test

### Test Categories
- **Unit tests**: Individual components
- **Integration tests**: Component interactions
- **E2E tests**: Full user workflows
- **Contract tests**: Spec compliance
- **Error tests**: All error paths

### Given-When-Then Format
Each test scenario should have:
- **Given**: Initial state/setup
- **When**: Action/trigger
- **Then**: Expected result
- **Status**: ❌ Not Started | 🔄 In Progress | ✅ Complete

## Step 5: Create Implementation Tasks

Break feature into concrete tasks:

**Task structure**:
- [ ] Task description
  - **Type**: Setup | Implementation | Testing | Documentation
  - **Depends on**: [other tasks]
  - **Status**: ❌

**Example**:
- [ ] Implement argument parser
  - **Depends on**: None
  - **Status**: ❌

## Step 6: Generate Feature Documentation

Create feature folder with phase prefix:
```bash
mkdir -p docs/projects/[project-name]/features/[phase]-[order]-[feature-name]
```
**Example**: `mkdir -p docs/projects/anygpt-ts/features/3-5-cli-benchmark`

Create files:
- `README.md` - Status, progress, tasks, design summary, test summary
- `design.md` - (Optional) Detailed technical design
- `tests.md` - (Optional) Detailed test scenarios

**File strategy**:
- **README.md**: Always create - status, tasks, brief design/test summary
- **design.md**: Create only if design is complex and needs detail
- **tests.md**: Create only if many test scenarios need documentation

**Benefits of phase numbering**:
- Features sort in implementation order in file explorer
- Phase dependencies are visually clear
- Easy to see what comes next

Feature Design Template

Create: `docs/projects/[project-name]/features/[feature-name]/design.md`
{{ ... }}
# [Feature Name] - Design

**Spec**: [Link to spec]  
**Project**: [Project name]  
**Status**: 🔄 In Progress

## Overview

[Brief description of what this feature does and why]

## Architecture

### Components

**[Component Name]**
### Data Structures

**Follow project conventions**: Use shared types/interfaces from the project's type system (e.g., types package, shared modules). Respect the technology stack and design patterns established in the architecture.

[Key data structures used]

### Algorithms
[Any complex algorithms or logic]

## Dependencies

### Internal Dependencies
- [Feature/component this depends on]

### External Dependencies
- [Library/framework needed]
- **Why**: [Rationale for choice]
- **Version**: [Version constraint]

## Interfaces

### Public API

```
[Function/class signatures]
```

### Internal APIs

```
[Internal interfaces between components]
```

## Error Handling

### Error Types
- **[Error Name]**: [When it occurs]

### Error Flow
[How errors propagate through the system]

## Implementation Strategy

### Phase 1: Foundation
- [ ] Task 1
- [ ] Task 2

### Phase 2: Core Logic
- [ ] Task 3
- [ ] Task 4

### Phase 3: Error Handling
- [ ] Task 5

### Phase 4: Testing
- [ ] Task 6

## Open Questions

- [ ] Question 1
- [ ] Question 2

## References

- **Spec**: [link]
- **Use Case**: [link]
- **Related Features**: [links]
```

## Feature Tests Template

Create: `docs/projects/[project-name]/features/[feature-name]/tests.md`

```markdown
# [Feature Name] - Test Scenarios

**Spec**: [Link to spec]  
**Design**: [Link to design.md]  
**Status**: ❌ Not Started

## Test Summary

- **Total Tests**: 0
- **Passing**: 0
- **Failing**: 0
- **Not Started**: 0
- **Coverage**: 0%

## Unit Tests

### [Component Name]

#### Test: [Test Name]
- **Given**: [Initial state]
- **When**: [Action]
- **Then**: [Expected result]
- **Status**: ❌
- **Implementation**: `[file path]:[line]`

## Integration Tests

### [Integration Scenario]

#### Test: [Test Name]
- **Given**: [Setup]
- **When**: [Action]
- **Then**: [Expected result]
- **Status**: ❌
- **Implementation**: `[file path]:[line]`

## E2E Tests

### [User Workflow]

#### Test: [Test Name]
- **Given**: [Starting conditions]
- **When**: [User actions]
- **Then**: [Expected outcome]
- **Command**: 
  ```bash
  [exact command]
  ```
- **Expected Output**:
  ```
  [exact output]
  ```
- **Exit Code**: [code]
- **Status**: ❌
- **Implementation**: `[file path]:[line]`

## Error Tests

### [Error Scenario]

#### Test: [Test Name]
- **Given**: [Error condition]
- **When**: [Trigger]
- **Then**: [Expected error behavior]
- **Error Message**: `[exact message]`
- **Exit Code**: [code]
- **Status**: ❌
- **Implementation**: `[file path]:[line]`

## Contract Tests (Spec Compliance)

- [ ] All requirements from spec are tested
- [ ] All examples from spec work
- [ ] All error codes from spec are correct
- [ ] All output formats from spec match

## Coverage Report

- **Unit Test Coverage**: 0%
- **Integration Test Coverage**: 0%
- **E2E Test Coverage**: 0%
- **Overall Coverage**: 0%

## Notes

[Any special testing considerations]
```

## Feature README Template

Create: `docs/projects/[project-name]/features/[phase]-[order]-[feature-name]/README.md`

```markdown
# [phase]-[order]-[feature-name]

| | |
|---|---|
| **Status** | ❌ Not Started \| 🔄 In Progress \| ✅ Complete |
| **Progress** | 0/N tasks |
| **Spec** | [Link to spec] |
| **Use Case** | [Link to use case] |
| **Architecture** | [System Design](../../architecture.md) |
| **Roadmap** | [Feature List](../../roadmap.md) |

---

## Overview

[Brief description of what this feature does]

## Status

**Last Updated**: [Date]  
**Current Phase**: [Phase description]

### Recent Updates
- [Date]: [What was done]

### Blockers
[List blockers or "None"]

## Implementation Plan

### Setup
- [ ] [Task description]

### Phase 1: [Phase Name]
- [ ] [Task description]
- [ ] [Another task]

### Phase 2: [Phase Name]
- [ ] [Task description]

[Continue for all phases]

## Technical Design

[Brief design summary - key components, algorithms, data structures]

**Detailed design**: See [design.md](./design.md) (if complex design exists)

## Tests

[Brief test summary - key test scenarios]

**Detailed tests**: See [tests.md](./tests.md) (if many test scenarios)

## Dependencies

**Internal**: [List internal dependencies]  
**External**: [List external dependencies]
```

## Quality Checklist

Before marking feature as complete:
- [ ] Design document is complete
- [ ] All test scenarios are defined
- [ ] All tests are implemented and passing
- [ ] Code coverage > 80%
- [ ] Spec requirements are satisfied
- [ ] Examples from spec work
- [ ] Documentation is updated
- [ ] Code is reviewed

## Notes

- **TDD Approach**: Write tests before implementation
- **Incremental**: Complete one feature at a time
- **Spec-Driven**: Use spec as source of truth
- **Track Progress**: Update status.md regularly
- **Link Everything**: Connect design → tests → tasks → code
