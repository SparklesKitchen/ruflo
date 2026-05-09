---
name: neural-train
description: Train SONA + MicroLoRA neural patterns from successful task completions; runs the DISTILL + CONSOLIDATE phases of the 4-step pipeline
argument-hint: "[--pattern-type coordination|edit|task] [--epochs N] [--microlora]"
allowed-tools: mcp__codex__neural_train mcp__codex__neural_status mcp__codex__neural_patterns mcp__codex__neural_predict mcp__codex__neural_optimize mcp__codex__neural_compress mcp__codex__hooks_pretrain mcp__codex__hooks_build-agents mcp__codex__hooks_intelligence_trajectory-start mcp__codex__hooks_intelligence_trajectory-step mcp__codex__hooks_intelligence_trajectory-end mcp__codex__hooks_intelligence_pattern-store mcp__codex__hooks_intelligence_learn mcp__codex__hooks_intelligence-reset mcp__codex__ruvllm_sona_create mcp__codex__ruvllm_sona_adapt mcp__codex__ruvllm_microlora_create mcp__codex__ruvllm_microlora_adapt mcp__codex__agentdb_consolidate Bash
---

# Neural Training

Train and consolidate neural patterns. Implements the **DISTILL** and **CONSOLIDATE** phases of the 4-step intelligence pipeline.

## When to use

- After completing a successful task — capture what worked.
- After accumulating ≥10 task completions — run consolidation to fold patterns into long-term storage.
- When training a new domain — create a MicroLoRA adapter for it.

## Standard flow (DISTILL)

1. **Check current neural status** — `mcp__codex__neural_status`.
2. **Start a trajectory** — `mcp__codex__hooks_intelligence_trajectory-start` with the task context.
3. **Record steps** — for each significant action, `mcp__codex__hooks_intelligence_trajectory-step`.
4. **End trajectory** — `mcp__codex__hooks_intelligence_trajectory-end` with `verdict: pass|fail|partial`.
5. **Learn from the trajectory** — `mcp__codex__hooks_intelligence_learn`.
6. **Train patterns** — `mcp__codex__neural_train` with `--pattern-type coordination --epochs 10`.
7. **Store patterns** — `mcp__codex__hooks_intelligence_pattern-store`.
8. **Verify** — `mcp__codex__neural_patterns` to confirm.

## SONA adaptation (single-domain, <0.05ms)

For real-time micro-adaptation:

```bash
mcp tool call ruvllm_sona_create --json -- '{"domain": "coding"}'
mcp tool call ruvllm_sona_adapt --json -- '{"feedback": {"score": 0.9, "trajectory": "..."}}'
```

## MicroLoRA adaptation (multi-domain)

When you have ≥3 distinct domains, create a MicroLoRA adapter per domain rather than overloading SONA:

```bash
# Create the adapter
mcp tool call ruvllm_microlora_create --json -- '{"domain": "frontend"}'

# Adapt with feedback
mcp tool call ruvllm_microlora_adapt --json -- '{"adapter": "frontend", "feedback": {...}}'

# CONSOLIDATE phase: apply EWC++ on weight deltas to prevent catastrophic forgetting
mcp tool call ruvllm_microlora_adapt --json -- '{"adapter": "frontend", "consolidate": true}'
```

The `--consolidate` flag is the EWC++ trigger. Without it, fresh training overwrites older domains.

## CONSOLIDATE phase (separate from training)

After every ~10 trajectory completions, run a full consolidation pass:

```bash
mcp tool call agentdb_consolidate --json
mcp tool call neural_compress --json    # storage efficiency
```

This folds patterns into long-term storage under EWC++ semantics.

## Bootstrapping from scratch

If the system has no learned patterns yet:

```bash
mcp tool call hooks_pretrain --json -- '{"modelType": "moe", "epochs": 10}'
mcp tool call hooks_build-agents --json -- '{"agentTypes": "coder,tester"}'
```

`hooks_pretrain` writes to the `patterns` (plural) namespace — distinct from the `pattern` (singular) ReasoningBank target. See `ruflo-agentdb` ADR-0001 for the namespace convention.

## Reset (testing only)

To wipe intelligence state (e.g., for benchmarking):

```bash
mcp tool call hooks_intelligence-reset --json
```

## CLI alternatives

```bash
npx @ruflo/cli@latest neural train --pattern-type coordination --epochs 10
npx @ruflo/cli@latest neural patterns --list
npx @ruflo/cli@latest neural status
npx @ruflo/cli@latest neural compress
npx @ruflo/cli@latest hooks pretrain --model-type moe --epochs 10
npx @ruflo/cli@latest hooks build-agents --agent-types coder,tester
```
