---
name: swarm-init
description: Initialize a multi-agent swarm with anti-drift configuration
argument-hint: "[--topology hierarchical|mesh|ring]"
allowed-tools: Bash(npx *) mcp__codex__swarm_init mcp__codex__swarm_status Agent
---
Initialize a hierarchical swarm for coordinated multi-agent work.

Via MCP: `mcp__codex__swarm_init({ topology: "hierarchical", maxAgents: 8, strategy: "specialized" })`

Or via CLI:
```bash
npx @ruflo/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

Then create a Codex team via `TeamCreate` and spawn agents using the `Agent` tool with `isolation: "worktree"` for git-safe parallel work. Use `SendMessage` for inter-agent coordination.

For larger teams (10+), use hierarchical-mesh topology:
```bash
npx @ruflo/cli@latest swarm init --topology hierarchical-mesh --max-agents 15 --strategy specialized
```
