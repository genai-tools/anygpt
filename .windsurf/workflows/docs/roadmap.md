---
description: Create implementation roadmap from architecture and specs
---

# Roadmap Workflow

## Purpose

Create a phased implementation roadmap by extracting features from specs and organizing them by dependencies.

**Input**: Architecture document + Specs  
**Output**: `docs/projects/[project-name]/roadmap.md`

## Prerequisites

- Architecture document must exist: `docs/projects/[project-name]/architecture.md`
- Specs must be available in `docs/products/[product-name]/specs/`

## Step 1: Review Architecture

Read the architecture document to understand:
- Component structure
- Dependencies between components
- Technology choices
- Module organization

```bash
cat docs/projects/[project-name]/architecture.md
```

## Step 2: Extract Features from Specs

For each spec, identify concrete features:

**Questions to ask**:
- What user-facing functionality does this spec define?
- Can this spec be broken into multiple features?
- What are the core vs advanced features?

**Example**:
- **Spec**: Conversation Command
- **Features**: 
  - conversation-storage (foundation)
  - conversation-command (core)
  - conversation-fork (advanced)
  - conversation-summarize (advanced)

**Feature naming convention**: `[phase]-[order]-[feature-name]` (e.g., `1-1-config-loader`, `3-5-cli-benchmark`)

**Benefits**:
- Features sort in implementation order in file explorer
- Phase dependencies are visually clear
- Easy to identify what comes next

## Step 3: Identify Feature Dependencies

For each feature, determine:

**Technical dependencies**:
- What other features must exist first?
- What components from architecture does it need?

**Example**:
```
conversation-command
  ├─ depends on: conversation-storage
  ├─ depends on: chat-command
  └─ depends on: provider-router
```

**Dependency rules**:
- Foundation features have no dependencies
- Core features depend on foundation
- Advanced features depend on core
- Integration features depend on advanced

## Step 4: Organize into Phases

Group features by dependency level:

**Phase 1: Foundation**
- Features with no dependencies
- Core infrastructure
- Required by everything else

**Phase 2: Core Applications**
- Basic user-facing functionality
- Depends on foundation
- Essential features

**Phase 3: Advanced Features**
- Sophisticated capabilities
- Depends on core
- Nice-to-have features

**Phase 4: Integrations**
- External integrations
- Deployment configurations
- Depends on advanced

## Step 5: Link to Specs and Use Cases

For each feature, identify:
- **Spec**: Which spec defines this feature?
- **Use Case**: Which use case justifies this feature?
- **Purpose**: One-line description
- **Key Features**: Main capabilities (3-5 bullet points)

## Step 6: Define Acceptance Criteria

For each feature, specify completion criteria:

**Acceptance checklist**:
- [ ] Command/API matches spec
- [ ] All options/methods work
- [ ] Output format matches spec
- [ ] Exit codes/error codes match spec
- [ ] All examples from spec work
- [ ] Tests pass (80%+ coverage)

## Step 7: Generate Roadmap Document

Create: `docs/projects/[project-name]/roadmap.md`

**Template**:

```markdown
# [Project Name] - Roadmap

**Project**: [Full project name]  
**Generated**: [Date]  
**Status**: Planning Phase

## Overview

Implementation roadmap for [project description]. Features are organized by dependency phases and will be implemented using the `/feature` workflow.

## Architecture Reference

See [architecture.md](./architecture.md) for high-level system design.

## Feature List

Total features identified: **[N]**

### Foundation (Phase 1): [N] features
[List feature names]

### Core Applications (Phase 2): [N] features
[List feature names]

### Advanced Features (Phase 3): [N] features
[List feature names]

### Integrations (Phase 4): [N] features
[List feature names]

## Implementation Phases

### Phase 1: Foundation
**Goal**: Build core infrastructure

**Status**: ❌ Not Started

#### [feature-name]
- **Spec**: [Link to spec]
- **Use Case**: [Link to use case]
- **Purpose**: [One-line description]
- **Dependencies**: [List or "None"]
- **Key Features**:
  - Feature 1
  - Feature 2
  - Feature 3
- **Acceptance**:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] All examples from spec work

[Repeat for each feature in phase]

---

### Phase 2: Core Applications
**Goal**: Implement essential functionality

**Status**: ❌ Not Started  
**Depends on**: Phase 1 complete

[Same structure as Phase 1]

---

### Phase 3: Advanced Features
**Goal**: Add sophisticated capabilities

**Status**: ❌ Not Started  
**Depends on**: Phase 2 complete

[Same structure]

---

### Phase 4: Integrations
**Goal**: External integrations and deployment

**Status**: ❌ Not Started  
**Depends on**: Phase 3 complete

[Same structure]

---

## Feature Development Process

Each feature will be developed using the `/feature` workflow:

1. **Design**: Create feature-specific design document
2. **Tests**: Define test scenarios (TDD approach)
3. **Tasks**: Break into implementation tasks
4. **Implement**: Build feature to pass tests
5. **Status**: Track progress

Feature documentation will be in:
`docs/projects/[project-name]/features/[phase]-[order]-[feature-name]/`
├── design.md
├── tests.md
└── status.md

**Example**: `docs/projects/anygpt-ts/features/3-5-cli-benchmark/`

## Progress Tracking

- **Phase 1**: 0/[N] features (0%)
- **Phase 2**: 0/[N] features (0%)
{{ ... }}
- **Phase 4**: 0/[N] features (0%)

**Overall**: 0/[Total] features (0%)

## Next Steps

1. Start with Phase 1 features
2. Use `/feature` workflow for each feature
3. Complete all Phase 1 before moving to Phase 2
4. Update this roadmap as work progresses

## Notes

- Features marked 📋 Future are planned but not prioritized
- Each feature links back to specs and use cases
- Dependencies must be complete before starting dependent features
- Use TDD approach: tests before implementation
- Update progress regularly
```

## Quality Checklist

Before finalizing roadmap:
- [ ] All specs are represented as features
- [ ] Dependencies are correctly identified
- [ ] Phases are logically ordered
- [ ] Each feature links to spec and use case
- [ ] Acceptance criteria are specific
- [ ] Feature naming is consistent
- [ ] Progress tracking is set up

## Example Feature Extraction

**Spec**: CLI Conversation Command

**Features extracted**:
1. `conversation-storage` - Persistent storage (foundation)
2. `conversation-command` - Basic commands (core)
3. `conversation-fork` - Branch conversations (advanced)
4. `conversation-summarize` - Context optimization (advanced)

**Dependencies**:
```
conversation-summarize
  └─ conversation-command
      └─ conversation-storage
          └─ chat-command
              └─ provider-router
                  └─ config-loader
```

## Notes

- **Granularity**: Break specs into implementable features (1-2 weeks each)
- **Naming**: Use consistent naming convention (component-capability)
- **Dependencies**: Be explicit about what depends on what
- **Phases**: Strictly enforce phase dependencies
- **Links**: Always link back to specs and use cases
- **Updates**: Roadmap is living document, update as needed
- **Reusability**: Can regenerate roadmap as specs evolve
