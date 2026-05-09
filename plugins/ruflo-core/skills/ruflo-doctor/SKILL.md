---
name: ruflo-doctor
description: Run health checks on the Ruflo installation and fix common issues
argument-hint: "[--fix]"
allowed-tools: Bash(npx *)
---
Run `npx @ruflo/cli@latest doctor --fix` to diagnose and auto-repair common issues.

Checks: Node.js 20+, npm 9+, git, config validity, daemon status, memory database, API keys, MCP servers, disk space, TypeScript.

Targeted fixes:
- Memory: `npx @ruflo/cli@latest memory init --force`
- Daemon: `npx @ruflo/cli@latest daemon start`
- Config: `npx @ruflo/cli@latest config reset`
