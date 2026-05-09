---
name: swarm
description: Initialize, monitor, and manage multi-agent swarms
---
$ARGUMENTS

Swarm lifecycle management.

**Init**: `npx @ruflo/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized`
**Status**: `npx @ruflo/cli@latest swarm status`
**Health**: `npx @ruflo/cli@latest swarm health`
**Shutdown**: `npx @ruflo/cli@latest swarm shutdown`

Parse $ARGUMENTS to determine the subcommand. If no arguments, show swarm status.

After init, spawn agents via Codex's Task tool with `run_in_background: true` for parallel execution.
