---
name: init-project
description: Initialize a new Ruflo project with MCP tools, hooks, and agent configuration
argument-hint: "[--preset standard|minimal|full]"
allowed-tools: Bash(npx *) Read Write Edit
---
Run `npx @ruflo/cli@latest init --wizard` to set up the project interactively, or `npx @ruflo/cli@latest init --preset standard` for defaults.

This creates AGENTS.md, .codex/settings.json, and .codex/ config with MCP server registration for the `ruflo` MCP tools.
