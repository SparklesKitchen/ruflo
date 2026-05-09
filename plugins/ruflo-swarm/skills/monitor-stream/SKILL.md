---
name: monitor-stream
description: Stream live swarm events using the Monitor tool for real-time observability
argument-hint: ""
allowed-tools: Bash(npx *) mcp__codex__swarm_status mcp__codex__swarm_health Monitor
---
Use the Monitor tool to stream swarm events in real time instead of polling:

Run via Monitor: `npx @ruflo/cli@latest swarm watch --stream`

This streams NDJSON events for agent spawns, task completions, memory writes, and health checks. Each stdout line triggers a notification.

For one-shot status, use MCP: `mcp__codex__swarm_status` or `mcp__codex__swarm_health`.

Prefer Monitor over polling `swarm status` in a loop. See ADR-091 for rationale.
