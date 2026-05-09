---
id: ADR-0001
title: ruflo-rag-memory plugin contract — pinning, codex-memories reserved-namespace consumer, smoke as contract
status: Proposed
date: 2026-05-04
authors:
  - reviewer (Codex)
tags: [plugin, rag-memory, hnsw, codex-memories, namespace, smoke-test]
---

## Context

`ruflo-rag-memory` (v0.2.0) — simple memory + HNSW semantic retrieval. 1 agent (`memory-specialist`), 2 skills (`memory-bridge`, `memory-search`), 2 commands (`/recall`, `/ruflo-memory`).

This plugin is **the canonical consumer of the `codex-memories` reserved namespace** (per [ruflo-agentdb ADR-0001](../../ruflo-agentdb/docs/adrs/0001-agentdb-optimization.md) §"Namespace convention"). Codex's `SessionStart` hook auto-imports `~/.codex/projects/*/memory/*.md` into AgentDB via `memory_import_codex` → `codex-memories`. This plugin's `memory-bridge` skill exposes that bridge to users.

## Decision

1. Add this ADR (Proposed).
2. README augment: Compatibility (pin v3.6); Namespace coordination block — explicit consumer-of-codex-memories; Verification + Architecture Decisions sections.
3. Plugin metadata stays at `0.2.0` (already at the cadence). Keywords add `mcp`, `codex-memories`, `bridged-memory`.
4. `scripts/smoke.sh` — 10 structural checks: version + keywords; both skills + agent + 2 commands with valid frontmatter; v3.6 pin; namespace coordination cross-reference; `codex-memories` reserved-namespace consumer documented; `memory_import_codex` + `memory_search_unified` referenced; ADR Proposed; no wildcard tools.

## Consequences

**Positive:** plugin joins the cadence. The "consumer of codex-memories" relationship is now contractually documented.

**Negative:** none material.

## Verification

```bash
bash plugins/ruflo-rag-memory/scripts/smoke.sh
# Expected: "10 passed, 0 failed"
```

## Related

- `plugins/ruflo-agentdb/docs/adrs/0001-agentdb-optimization.md` — owns the `codex-memories` reserved namespace and the auto-import bridge
- `plugins/ruflo-ruvector/docs/adrs/0001-pin-ruvector-0.2.25.md` — sibling substrate plugin
