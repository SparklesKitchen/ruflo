# Codex-Native Ruflo Fork

This fork is intended to remove Claude Code and Anthropic-specific runtime assumptions from Ruflo while preserving the useful orchestration, memory, skills, MCP, and worker concepts.

## Goals

- Make Codex/OpenAI the primary execution path.
- Remove hard dependencies on the `claude` CLI, `CLAUDE.md`, `.claude/`, `.claude-flow/`, and Anthropic-only environment variables.
- Keep Anthropic support out of the default runtime. If provider abstraction remains, Anthropic should be optional rather than assumed.
- Prefer `AGENTS.md`, `.agents/`, `.codex/`, and Codex MCP conventions for generated project state.
- Keep changes incremental and reviewable so the fork can continue to sync upstream while the runtime is being replaced.

## First Runtime Targets

1. Replace the Claude Code headless worker executor with a Codex/OpenAI executor.
2. Rename executor-facing types from Claude-specific names to neutral agent names.
3. Move state and logs from `.claude-flow/` to `.ruflo/` or another neutral Ruflo-owned directory.
4. Change generated Codex project config so no Anthropic key or Claude compatibility file is suggested by default.
5. Update package metadata, docs, and command examples after the executor path is no longer Claude-backed.

## Executor Direction

Workers that only need analysis can use direct OpenAI API calls and return JSON or Markdown. Workers that need to inspect or edit a local checkout should use Codex CLI execution, with prompts sent through stdin where possible to avoid shell escaping issues.

The first code patch should be small: introduce a neutral executor interface, add a Codex executor implementation, and keep any legacy executor isolated until parity is confirmed.
