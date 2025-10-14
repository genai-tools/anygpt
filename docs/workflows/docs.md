# Documentation Workflows Guide

**Last Updated**: 2025-01-10  
**Location**: `.windsurf/workflows/docs/`

## Overview

This repository uses a structured documentation workflow system to maintain consistency across product specifications, use cases, project architectures, and feature designs. All workflows are accessible via slash commands in Windsurf IDE.

## Documentation Structure

```
docs/
├── products/                    # Product-level documentation
│   └── [product-name]/
│       ├── specs/              # Technical specifications (WHAT to build)
│       └── cases/              # Use cases (WHY to build)
├── projects/                    # Project-level documentation
│   └── [project-name]/
│       ├── architecture.md     # High-level system design
│       ├── roadmap.md          # Phased feature list
│       └── features/           # Feature-level documentation
│           └── [phase]-[order]-[feature-name]/
│               ├── design.md   # HOW to build it
│               ├── tests.md    # HOW to verify it
│               └── status.md   # WHERE we are + tasks
└── workflows/
    └── docs.md                 # This file
```

## Available Workflows

### 1. `/use-case` - Create/Review Use Cases

**Purpose**: Define business problems and measurable impact

**When to use**:

- Starting a new product or feature
- Justifying why something should be built
- Need to quantify business value

**Input**: Problem statement  
**Output**: `docs/products/[product-name]/cases/[use-case-name].md`

**Key sections**:

- Problem statement (specific and concrete)
- Current situation (evidence of problem)
- Desired outcome (measurable goals)
- Success metrics (quantified benefits)

**Example**:

```bash
/use-case provider-agnostic-chat
```

**Quality requirements**:

- ✅ Quantified benefits (%, $, time)
- ✅ Concrete scenario
- ❌ No vague claims ("better", "faster")

---

### 2. `/spec` - Create/Review Specifications

**Purpose**: Define technical contracts (WHAT to build, not HOW)

**When to use**:

- After use case is defined
- Need to specify exact behavior
- Defining APIs, commands, or protocols

**Input**: Use case + component/command to specify  
**Output**: `docs/products/[product-name]/specs/[spec-name].md`

**Key sections**:

- Linked use cases (WHY)
- Requirements (WHAT must be supported)
- Interface/API contract
- Behavior specifications
- Examples

**Example**:

```bash
/spec chat-command
```

**Spec types**:

- **Commands**: Syntax, arguments, exit codes, output format
- **Components**: Responsibilities, interface, behavior
- **Protocols**: Message format, error codes, flow

**Quality requirements**:

- ✅ Links to use cases
- ✅ Concrete examples
- ✅ Testable requirements
- ❌ No implementation details

---

### 3. `/project` - Bootstrap Project Architecture

**Purpose**: Create high-level architecture before implementation

**When to use**:

- Starting a new project implementation
- Need to plan component structure
- Before extracting features

**Input**: Use cases + Specs  
**Output**: `docs/projects/[project-name]/architecture.md`

**Key sections**:

- High-level component diagram
- Component overview
- Data flow diagrams
- Module structure
- Key design decisions
- Extension points
- Future enhancements

**Example**:

```bash
/project anygpt-ts
```

**Workflow steps**:

1. Review specs and use cases
2. Identify components
3. Define dependencies
4. Create architecture document
5. Document design decisions

---

### 4. `/roadmap` - Create Feature Roadmap

**Purpose**: Extract features from specs and organize by phases

**When to use**:

- After architecture is defined
- Need to plan implementation order
- Want to track progress

**Input**: Architecture + Specs  
**Output**: `docs/projects/[project-name]/roadmap.md`

**Key sections**:

- Feature list (with phase numbering)
- Implementation phases
- Feature details (spec, use case, dependencies, acceptance)
- Progress tracking

**Example**:

```bash
/roadmap anygpt-ts
```

**Phase structure**:

- **Phase 1**: Foundation (no dependencies)
- **Phase 2**: Core (depends on Phase 1)
- **Phase 3**: Advanced (depends on Phase 2)
- **Phase 4**: Integrations (depends on Phase 3)

**Feature naming**: `[phase]-[order]-[feature-name]`

- Example: `1-1-config-loader`, `3-5-cli-benchmark`
- Benefits: Sorts correctly in file explorer, shows implementation order

---

### 5. `/feature` - Design Individual Features

**Purpose**: Create detailed design, tests, and tasks for a feature

**When to use**:

- Ready to implement a specific feature
- Need detailed technical design
- Want to define test scenarios (TDD)

**Input**: Spec + Architecture  
**Output**: `docs/projects/[project-name]/features/[phase]-[order]-[feature-name]/`

**Files created**:

- `design.md` - Technical design (components, algorithms, dependencies)
- `tests.md` - Test scenarios (unit, integration, E2E)
- `status.md` - Progress tracking and task list

**Example**:

```bash
/feature 1-1-config-loader
```

**Workflow steps**:

1. Identify feature (name, phase, order)
2. Review spec and architecture
3. Create design (components, data structures, algorithms)
4. Define test scenarios (TDD approach)
5. Break into tasks
6. Track status

---

## Workflow Flow

The workflows are designed to be used in sequence:

```
1. /use-case     → Define WHY (business value)
         ↓
2. /spec         → Define WHAT (technical contract)
         ↓
3. /project      → Define architecture (big picture)
         ↓
4. /roadmap      → Extract features (phased plan)
         ↓
5. /feature      → Design feature (detailed plan)
         ↓
   Implementation
```

## When to Use Each Workflow

### Starting a New Product

1. `/use-case` - Define all use cases
2. `/spec` - Write specs for each use case
3. `/project` - Create architecture
4. `/roadmap` - Plan features
5. `/feature` - Design each feature

### Adding a New Feature

1. `/use-case` - Define use case (if new)
2. `/spec` - Update or create spec
3. Update architecture (if needed)
4. Update roadmap
5. `/feature` - Design the feature

### Reviewing Existing Documentation

- `/use-case` - Review and update use cases
- `/spec` - Review and update specs
- `/project` - Review architecture consistency

## Best Practices

### Use Cases

- ✅ Start with use cases (WHY before WHAT)
- ✅ Quantify all benefits
- ✅ Provide concrete examples
- ❌ Don't skip use cases

### Specifications

- ✅ Link to use cases
- ✅ Define behavior, not implementation
- ✅ Include examples
- ❌ Don't include HOW to implement

### Architecture

- ✅ Create before features
- ✅ Show component relationships
- ✅ Document design decisions
- ❌ Don't skip this step

### Roadmap

- ✅ Use phase numbering
- ✅ Mark dependencies clearly
- ✅ Update as you progress
- ❌ Don't implement out of order

### Features

- ✅ Design before coding
- ✅ Write tests first (TDD)
- ✅ Track progress in status.md
- ❌ Don't skip test scenarios

## Phase Numbering System

All features use phase numbering: `[phase]-[order]-[feature-name]`

**Benefits**:

- Features sort in implementation order in file explorer
- Phase dependencies are visually clear
- Easy to see what comes next

**Example**:

```
features/
├── 1-1-config-loader/       ← Phase 1, Feature 1
├── 1-2-provider-router/     ← Phase 1, Feature 2
├── 2-1-cli-chat/            ← Phase 2, Feature 1
└── 3-5-cli-benchmark/       ← Phase 3, Feature 5
```

## Naming Conventions

### Use Cases

- Lowercase with hyphens
- Descriptive of the problem
- Example: `provider-agnostic-chat.md`

### Specs

- Lowercase with hyphens
- Component or command name
- Example: `chat-command.md`

### Projects

- Lowercase with hyphens
- Include technology if multiple implementations
- Example: `anygpt-ts/`, `anygpt-go/`

### Features

- Phase numbering prefix: `[phase]-[order]-[name]`
- CLI features prefixed with `cli-`
- Example: `1-1-config-loader`, `2-1-cli-chat`

## Progress Tracking

### Roadmap Level

- Track phase completion
- Update feature counts
- Mark dependencies

### Feature Level

- Update status.md regularly
- Check off completed tasks
- Track test progress
- Note blockers

## Common Patterns

### New Product Development

```bash
# 1. Define business value
/use-case provider-agnostic-chat
/use-case flexible-configuration

# 2. Write specifications
/spec chat-command
/spec config-loader

# 3. Create architecture
/project anygpt-ts

# 4. Plan features
/roadmap anygpt-ts

# 5. Design features (in order)
/feature 1-1-config-loader
/feature 1-2-provider-router
# ... continue with Phase 1
# ... then Phase 2, etc.
```

### Adding a Feature to Existing Project

```bash
# 1. Define use case (if new)
/use-case new-feature

# 2. Update spec
/spec new-component

# 3. Update roadmap
# (manually add to roadmap.md)

# 4. Design feature
/feature 3-6-new-feature
```

## File Organization

### Products (Product-level docs)

```
docs/products/anygpt/
├── README.md          # Product documentation index
├── specs/             # Technical specifications
│   ├── README.md     # Main spec index
│   └── anygpt/       # Component specs
├── cases/             # Use cases
│   ├── provider-agnostic-chat.md
│   └── flexible-configuration.md
├── features/          # Feature documentation
│   ├── anthropic-thinking-support.md
│   └── reasoning-effort-levels.md
└── architecture/      # Architecture docs
    └── token-limits-architecture.md
```

### Projects (Implementation-level docs)

```
docs/projects/anygpt-ts/
├── architecture.md                    # System design
├── roadmap.md                         # Feature list
└── features/
    ├── 1-1-config-loader/
    │   ├── design.md                  # Technical design
    │   ├── tests.md                   # Test scenarios
    │   └── status.md                  # Progress + tasks
    └── 1-2-provider-router/
        ├── design.md
        ├── tests.md
        └── status.md
```

## Tips

### For Product Managers

- Focus on `/use-case` and `/spec`
- Ensure use cases have measurable impact
- Review specs for completeness

### For Architects

- Use `/project` to document architecture
- Use `/roadmap` to plan implementation
- Review feature designs for consistency

### For Developers

- Use `/feature` to design before coding
- Follow TDD: write tests first
- Update status.md as you progress

### For Teams

- Use workflows consistently
- Review documentation in PRs
- Keep documentation up to date

## Maintenance

### Regular Updates

- Update status.md as features progress
- Update roadmap when features complete
- Review architecture for consistency

### When to Refactor

- Architecture changes significantly
- New patterns emerge
- Dependencies change

## Examples

See the AnyGPT TypeScript project for a complete example:

- **Architecture**: `docs/projects/anygpt-ts/architecture.md`
- **Roadmap**: `docs/projects/anygpt-ts/roadmap.md`
- **Features**: `docs/projects/anygpt-ts/features/`

## Questions?

- Check workflow files: `.windsurf/workflows/docs/`
- Review example project: `docs/projects/anygpt-ts/`
- Each workflow has detailed step-by-step instructions
