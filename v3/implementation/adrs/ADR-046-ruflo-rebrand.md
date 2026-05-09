# ADR-046: Dual Umbrella Packages — codex + ruflo

**Status:** Accepted
**Date:** 2026-02-07
**Updated:** 2026-02-08
**Authors:** RuvNet, Ruflo Team

## Context

The umbrella package is published to npm as `codex`. As the ecosystem grows and the product establishes its own identity, a second umbrella package `ruflo` is introduced alongside the original.

### Current State

| Aspect | Current Value |
|--------|---------------|
| npm package | `codex` |
| CLI binary | `codex` |
| GitHub repo | ruvnet/codex |
| Internal packages | @ruflo/* |
| Weekly downloads | ~1,000+ |

### Drivers for Change

1. **Brand Cohesion**: Aligns with the ruv ecosystem (ruv.io, @ruvector/*, ruv-swarm)
2. **Trademark Safety**: Removes potential trademark concerns with "Codex" in product name
3. **Product Identity**: Establishes independent product identity beyond Codex integration
4. **Discoverability**: "ruflo" is unique, memorable, and searchable
5. **Future Flexibility**: Enables the platform to support multiple AI backends without name confusion
6. **Zero Disruption**: Keeping `codex` ensures no existing users are broken

## Decision

Publish **two independent npm umbrella packages** — `codex` (original) and `ruflo` (new) — both backed by `@ruflo/cli`.

### Package Architecture

```
npm registry
├── codex          ← original umbrella (bundles @ruflo/cli)
│   └── bin: codex → v3/@ruflo/cli/bin/cli.js
├── ruflo              ← new umbrella (depends on @ruflo/cli)
│   └── bin: ruflo     → @ruflo/cli/bin/cli.js
└── @ruflo/cli     ← shared CLI implementation
```

### What Changes

| Aspect | Before | After |
|--------|--------|-------|
| npm packages | `codex` only | `codex` + `ruflo` |
| CLI binaries | `codex` | `codex` + `ruflo` |
| Install commands | `npx ruflo@latest` | Both `npx ruflo@latest` and `npx ruflo@latest` |
| README branding | "Codex-Flow" | "Ruflo" (primary), "codex" (supported) |
| Product name | Codex-Flow | Ruflo (with codex alias) |

### What Stays the Same

| Aspect | Value | Reason |
|--------|-------|--------|
| GitHub repo | ruvnet/codex | SEO, existing links, history |
| Internal packages | @ruflo/* | Minimal disruption, existing integrations |
| Functionality | All features | No functional changes |
| License | MIT | No change |
| Author | RuvNet | No change |
| `codex` npm package | Fully supported | No breaking changes for existing users |

## Consequences

### Positive

1. **Zero Disruption**: Existing `codex` users unaffected
2. **Unified Brand**: New `ruflo` package for the ruv ecosystem
3. **Trademark Safety**: Users can choose the non-"Codex" branded package
4. **Dual Discovery**: Package discoverable under both names on npm
5. **Future Proof**: Can add non-Codex integrations without name confusion

### Negative

1. **Two packages to maintain**: Must publish and tag both packages
2. **Documentation**: Must reference both package names
3. **Download split**: npm download stats split across two packages

### Neutral

1. **GitHub repo unchanged**: Existing links continue to work
2. **Internal packages unchanged**: No code changes required in @ruflo/*

## Implementation

### Package Structure

```
/workspaces/codex/
├── package.json            # name: "codex" (original umbrella)
│                           # bin: codex → v3/@ruflo/cli/bin/cli.js
│                           # bundles CLI files directly
└── ruflo/
    ├── package.json        # name: "ruflo" (new umbrella)
    │                       # bin: ruflo → ./bin/ruflo.js
    │                       # depends on @ruflo/cli
    ├── bin/
    │   └── ruflo.js      # thin wrapper, imports @ruflo/cli
    └── README.md           # Ruflo-branded docs
```

### Phase 1: Preparation (This PR)

1. Create ADR-046 (this document)
2. Keep root `package.json` as `codex` (original umbrella)
3. Create `ruflo/` directory with new umbrella package
4. Update main README.md with Ruflo branding
5. Update install scripts to reference `ruflo`

### Phase 2: Publishing

```bash
# 1. Publish @ruflo/cli (shared implementation)
cd v3/@ruflo/cli
npm publish --tag alpha

# 2. Publish codex umbrella (original)
cd /workspaces/codex
npm publish --tag v3alpha
npm dist-tag add codex@<version> latest
npm dist-tag add codex@<version> alpha

# 3. Publish ruflo umbrella (new)
cd /workspaces/codex/ruflo
npm publish --tag alpha
npm dist-tag add ruflo@<version> latest
```

### Phase 3: Ongoing

1. Both packages maintained indefinitely
2. Version numbers kept in sync
3. README shows both install options
4. `ruflo` promoted as primary in new documentation

## Publishing Checklist

When publishing updates, **all three packages** must be published:

| Order | Package | Command | Tags |
|-------|---------|---------|------|
| 1 | `@ruflo/cli` | `npm publish --tag alpha` | alpha, latest |
| 2 | `codex` | `npm publish --tag v3alpha` | v3alpha, alpha, latest |
| 3 | `ruflo` | `npm publish --tag alpha` | alpha, latest |

## Alternatives Considered

### 1. Replace codex with ruflo (single package)

**Pros:** Simpler, one package to maintain
**Cons:** Breaks existing users, loses download history
**Decision:** Rejected - zero disruption preferred

### 2. Rename to ruv (hyphenated)

**Pros:** Matches ruv-swarm pattern
**Cons:** Inconsistent with @ruvector (no hyphen)
**Decision:** Rejected - "ruflo" is cleaner and matches ruvector pattern

### 3. Rename internal packages too (@ruflo/*)

**Pros:** Complete rebrand
**Cons:** Major breaking change, complex migration, npm scope registration
**Decision:** Rejected - disruption not worth the benefit

### 4. Deprecate codex

**Pros:** Forces migration to ruflo
**Cons:** Breaks existing users, bad developer experience
**Decision:** Rejected - both packages coexist permanently

## Migration Guide

### For New Users

```bash
# Recommended
npx ruflo@latest init --wizard

# Also works
npx ruflo@latest init --wizard
```

### For Existing Users

No migration required. `codex` continues to work. Optionally switch:

```bash
# Switch MCP server (optional)
codex mcp remove codex
codex mcp add ruflo npx ruflo@latest mcp start
```

### For Contributors

1. Root `package.json` is the `codex` umbrella
2. `ruflo/package.json` is the `ruflo` umbrella
3. Internal imports remain `@ruflo/*`
4. GitHub repo remains `ruvnet/codex`

## Metrics for Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Combined npm downloads | Maintain or grow | npm weekly stats (both packages) |
| GitHub stars | Maintain or grow | GitHub metrics |
| Issues from confusion | < 10 in 30 days | GitHub issues |
| ruflo adoption | 50%+ new installs in 90 days | npm stats |

## References

- GitHub Issue: #1101
- npm: https://npmjs.com/package/ruflo
- npm: https://npmjs.com/package/codex
- Related: ADR-017 (RuVector Integration)

## Appendix: Branding Guidelines

### Product Names

| Context | Use |
|---------|-----|
| npm packages | `ruflo` and `codex` (both lowercase) |
| README title | "Ruflo" (PascalCase) |
| CLI binaries | `ruflo` or `codex` (both lowercase) |
| In prose | "Ruflo" (PascalCase) |

### Command Examples

```bash
# New recommended style
npx ruflo@latest init
npx ruflo@latest agent spawn -t coder
npx ruflo@latest swarm init --topology hierarchical

# Legacy style (still fully supported)
npx ruflo@latest init
npx ruflo@latest agent spawn -t coder
```

---

**Decision Date:** 2026-02-07
**Updated:** 2026-02-08
**Review Date:** 2026-03-07 (30 days post-implementation)
