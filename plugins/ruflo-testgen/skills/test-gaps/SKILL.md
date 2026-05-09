---
name: test-gaps
description: Detect missing test coverage and generate test suggestions
argument-hint: "[--path PATH] [--limit N]"
allowed-tools: Bash(npx *) mcp__codex__hooks_worker-dispatch Read Grep
---
Find test coverage gaps via CLI:
```bash
npx @ruflo/cli@latest hooks coverage-gaps --format table --limit 20
npx @ruflo/cli@latest hooks coverage-route --task "add auth tests"
npx @ruflo/cli@latest hooks coverage-suggest --path src/
```

Or dispatch the testgaps worker via MCP:
`mcp__codex__hooks_worker-dispatch({ trigger: "testgaps" })`

For continuous detection, use `/loop` with the `loop-worker` skill targeting the `testgaps` worker.
