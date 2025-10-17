---
trigger: model_decision
description: Whenever you want to create *.md document - follow this guide please
---

# Documentation Structure Rules

## Golden Rules

1. **Package technical docs** → `packages/[name]/`
2. **Product/project docs** → `docs/`
3. **Workspace rules** → `.windsurf/rules/`
4. **Workflows** → `.windsurf/workflows/`
5. **NO random files in workspace root**

## Directory Structure

```
workspace-root/
├── docs/                           # Product & project documentation
│   ├── products/[name]/            # Product-level (WHAT & WHY)
│   │   ├── cases/                  # Use cases
│   │   └── specs/                  # Technical specifications
│   ├── projects/[name]/            # Project-level (HOW & WHEN)
│   │   ├── features/               # Feature designs
│   │   ├── architecture.md         # System architecture
│   │   ├── roadmap.md              # Implementation roadmap
│   │   └── IMPLEMENTATION_GUIDE.md # Overall guide (optional)
│   ├── connectors/                 # Connector documentation
│   └── DOCUMENTATION_STRUCTURE.md  # This structure guide
├── packages/[name]/                # Package technical documentation
│   ├── src/
│   ├── tests/
│   ├── docs/                       # Optional: detailed technical docs
│   ├── README.md                   # Required: usage, API
│   └── CHANGELOG.md                # Required: version history
├── .windsurf/
│   ├── rules/                      # Workspace rules (this file\!)
│   └── workflows/                  # AI-assisted workflows
└── [NO FILES HERE]                 # Keep root clean\!
```

## 1. Product Documentation (`docs/products/`)

**Purpose**: Define WHAT we're building and WHY

**Structure**:
```
docs/products/[product-name]/
├── cases/                  # Use cases
│   └── [use-case-name].md
├── specs/                  # Technical specifications
│   └── [component]/
│       └── [spec-name].md
└── README.md               # Product overview
```

**Workflow**: Use `/use-case` and `/spec` workflows

**Rules**:
- ✅ Use cases define user needs and scenarios
- ✅ Specs define technical requirements and behavior
- ❌ No implementation details (that's project docs)
- ❌ No code (that's package docs)

## 2. Project Documentation (`docs/projects/`)

**Purpose**: Define HOW we're building it and WHEN

**Structure**:
```
docs/projects/[project-name]/
├── features/                       # Feature designs
│   └── [phase]-[order]-[name]/
│       └── README.md               # Single source of truth
├── architecture.md                 # System design
├── roadmap.md                      # Implementation phases
├── IMPLEMENTATION_GUIDE.md         # Optional: overall guide
└── README.md                       # Project overview
```

**Workflow**: Use `/project`, `/roadmap`, `/feature`, `/implement` workflows

**Rules**:
- ✅ Architecture defines system design
- ✅ Roadmap defines feature list and phases
- ✅ Feature README.md is single source of truth (see Feature Rules below)
- ❌ No separate IMPLEMENTATION_PLAN.md files
- ❌ No code (that's package docs)

### Feature Documentation Rules

**Structure**:
```
features/[phase]-[order]-[feature-name]/
└── README.md  # Everything goes here (10 sections)
```

**README.md must contain**:
1. Status table
2. Overview
3. Status & recent updates
4. Design summary
5. Test summary
6. **Implementation plan** (phases with checkboxes)
7. Dependencies
8. Open questions
9. Scope
10. Related features

**Never create**:
- ❌ `IMPLEMENTATION_PLAN.md` - Goes in README.md
- ❌ `TASKS.md` - Goes in README.md
- ❌ `STATUS.md` - Goes in README.md
- ❌ `NOTES.md` - Use comments or README.md

**Optional** (rarely):
- `design.md` - Only if design exceeds 500 lines
- `tests.md` - Only if test scenarios exceed 300 lines

## 3. Package Documentation (`packages/[name]/`)

**Purpose**: Technical documentation for package users and maintainers

**Structure**:
```
packages/[package-name]/
├── src/                    # Source code
├── tests/                  # Tests
├── docs/                   # Optional: detailed technical docs
│   ├── architecture.md
│   └── api.md
├── README.md               # Required: overview, installation, usage, API
├── CHANGELOG.md            # Required: version history
└── package.json
```

**Rules**:
- ✅ README.md for package overview, installation, usage, API
- ✅ CHANGELOG.md for version history
- ✅ Optional docs/ for detailed technical documentation
- ❌ No product specs (that's docs/products/)
- ❌ No project roadmaps (that's docs/projects/)

## 4. Workspace Documentation

### Rules (`.windsurf/rules/`)

**Purpose**: Mandatory rules for AI agents and developers

**Structure**:
```
.windsurf/rules/
├── agent-commands.md       # Command execution rules
├── documentation.md        # This file\!
├── nx.md                   # Nx workspace rules
└── typescript.md           # TypeScript rules
```

**Rules**:
- ✅ Compact, actionable rules
- ✅ Clear examples (✅ Good / ❌ Bad)
- ✅ Mandatory enforcement
- ❌ No long explanations (keep it compact)

### Workflows (`.windsurf/workflows/`)

**Purpose**: AI-assisted development workflows

**Structure**:
```
.windsurf/workflows/
├── docs/                   # Documentation workflows
│   ├── feature.md
│   ├── spec.md
│   └── use-case.md
├── implement.md            # Implementation workflow
├── commit.md               # Commit workflow
└── release.md              # Release workflow
```

**Rules**:
- ✅ YAML frontmatter with description
- ✅ Step-by-step instructions
- ✅ Examples and troubleshooting
- ❌ No code (workflows guide, not implement)

## 5. Temporary Documentation

**Rule**: NO temporary documentation files in workspace\!

**Never create**:
- ❌ `NOTES.md` in root
- ❌ `TODO.md` in root
- ❌ `PLAN.md` in root
- ❌ `SCRATCH.md` in root
- ❌ Any `*.md` files in root (except README.md, LICENSE, etc.)

**Instead**:
- ✅ Use comments in code
- ✅ Use "Open Questions" section in feature README.md
- ✅ Use GitHub issues for tracking
- ✅ Use local scratch files outside workspace

## Validation Checklist

Before creating ANY documentation:

- [ ] Is this product/project docs? → `docs/`
- [ ] Is this package docs? → `packages/[name]/`
- [ ] Is this a workspace rule? → `.windsurf/rules/`
- [ ] Is this a workflow? → `.windsurf/workflows/`
- [ ] Am I about to create a file in root? (DON'T\!)
- [ ] Am I about to create IMPLEMENTATION_PLAN.md? (DON'T\!)
- [ ] Am I about to create NOTES.md? (DON'T\!)

## Common Mistakes

### ❌ Mistake 1: Files in Root
```
❌ DISCOVERY_IMPLEMENTATION_PLAN.md (root)
✅ docs/projects/anygpt-ts/features/4-4-mcp-discovery-engine/README.md
```

### ❌ Mistake 2: Separate Implementation Plans
```
❌ features/my-feature/IMPLEMENTATION_PLAN.md
✅ features/my-feature/README.md (with Implementation Plan section)
```

### ❌ Mistake 3: Product Specs in Packages
```
❌ packages/mcp-discovery/docs/spec.md
✅ docs/products/anygpt/specs/anygpt/mcp-discovery.md
```

### ❌ Mistake 4: Temporary Files
```
❌ NOTES.md, TODO.md, PLAN.md in root
✅ Use comments, GitHub issues, or local files outside workspace
```

## Quick Reference

| Documentation Type | Location | Workflow |
|-------------------|----------|----------|
| Use Case | `docs/products/[name]/cases/` | `/use-case` |
| Specification | `docs/products/[name]/specs/` | `/spec` |
| Architecture | `docs/projects/[name]/architecture.md` | `/project` |
| Roadmap | `docs/projects/[name]/roadmap.md` | `/roadmap` |
| Feature | `docs/projects/[name]/features/[id]/README.md` | `/feature` |
| Implementation | `packages/[name]/src/` | `/implement` |
| Package README | `packages/[name]/README.md` | Manual |
| Package CHANGELOG | `packages/[name]/CHANGELOG.md` | `/release` |
| Workspace Rule | `.windsurf/rules/[name].md` | Manual |
| Workflow | `.windsurf/workflows/[name].md` | Manual |

## Enforcement

These rules are **MANDATORY**. AI agents must:

1. ✅ Always check this file before creating documentation
2. ✅ Validate location against rules
3. ✅ Never create files in workspace root
4. ✅ Never create separate IMPLEMENTATION_PLAN.md files
5. ✅ Keep feature README.md as single source of truth

**If in doubt, ask before creating files.**
