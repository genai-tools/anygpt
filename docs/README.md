# Documentation Structure

This directory contains all documentation for the AnyGPT project, organized by purpose and audience.

## 📁 Directory Structure

### `/workspace` - Workspace Documentation
Guidelines, setup instructions, and processes for working in this repository.

**Contents:**
- Release processes and workflows (how to release)
- CI/CD configuration and workflows
- Security guidelines and incident response
- Testing guidelines and best practices
- Development environment setup
- Troubleshooting guides

**Audience:** Contributors, maintainers, developers working in this codebase

---

### `/project` - Project Documentation
Product planning, roadmaps, changelogs, and meeting notes.

**Contents:**
- Product roadmaps and feature planning
- Changelogs (what changed in releases)
- Meeting notes and decisions
- Product planning and prioritization

**Audience:** Product owners, lead contributors, stakeholders

---

### `/product` - Product Documentation
High-level design, specifications, and usage documentation for the end product.

**Contents:**
- `/spec` - Technical specifications for components
- `/use-cases` - Real-world usage scenarios and examples
- `/features` - Feature documentation and guides
- `/architecture` - Architecture and design documents

**Audience:** End users, integrators, architects, technical writers

---

### `/archive` - Historical Documentation
Implementation details, refactoring summaries, and technical decisions that are no longer actively maintained but kept for reference.

**Contents:**
- Refactoring summaries
- Implementation details
- Technical decision records
- Historical architecture documents

**Audience:** Developers investigating history, understanding past decisions

---

## 📝 Documentation Guidelines

### Where to Add New Documentation

**Workspace docs** → `/workspace`
- Contribution guidelines (how to contribute)
- Release processes (how to release)
- CI/CD changes
- Development workflows
- Testing strategies
- Security policies

**Project docs** → `/project`
- Product roadmaps
- Changelogs (what changed)
- Meeting notes
- Feature planning

**Product docs** → `/product`
- User-facing features
- API specifications
- Usage examples
- Architecture overviews

**Component-specific docs** → Component's own `/docs` folder
- Implementation details for a specific package
- Component-specific API documentation
- Internal architecture of a component

**Historical/completed work** → `/archive`
- Refactoring summaries
- Completed migration guides
- Deprecated features

### Documentation Principles

1. **Keep it DRY** - Don't duplicate documentation. Link to canonical sources.
2. **Audience-first** - Write for your target audience (users vs. contributors).
3. **Living documents** - Update docs when code changes.
4. **Component ownership** - Technical details belong in component docs, not workspace docs.
5. **Archive completed work** - Move implementation summaries to archive once complete.

---

## 🔍 Quick Reference

| I want to... | Look in... |
|--------------|------------|
| Set up my development environment | `/workspace` |
| Understand the release process | `/workspace` (how to release) |
| See what's planned for the product | `/project` (roadmaps) |
| Check what changed in a release | `/project` (changelogs) |
| Learn how to use a feature | `/product` or `/product/spec` |
| See usage examples | `/product/use-cases` |
| Understand component internals | `packages/{component}/docs/` |
| Research a past refactoring | `/archive` |
| Configure CI/CD | `/workspace` |
| Report a security issue | `/workspace/security-incident-response.md` |

---

## 📚 Related Documentation

- **Component Documentation**: Each package in `/packages` may have its own `/docs` folder
- **API Documentation**: Generated from code comments (see component READMEs)
- **Examples**: See `/examples` directory in repository root

---

## 🤝 Contributing to Documentation

When adding or updating documentation:

1. Choose the correct category based on audience and purpose
2. Use clear, descriptive filenames (kebab-case)
3. Add a link to this README if creating a new major section
4. Keep documentation close to the code it describes (prefer component docs for technical details)
5. Archive implementation details once work is complete

---

**Last Updated:** 2025-01-10
