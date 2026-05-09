# CLI Commands Migration Guide

> Migrating from V2 CLI (25 commands) to V3 CLI (7 commands)

## Overview

V3 CLI is streamlined with 7 core commands. Many V2 commands need migration or have been consolidated.

## Command Coverage

| Status | V2 Commands | V3 Commands |
|--------|-------------|-------------|
| ✅ Implemented | 7 | 7 |
| ❌ Missing | 18 | - |
| **Total** | 25 | 7 |

## Implemented Commands ✅

### agent
```bash
# V2
npx ruflo agent spawn --type coder --name my-coder
npx ruflo agent list --detailed
npx ruflo agent info <agentId>
npx ruflo agent terminate <agentId>

# V3 (same)
npx ruflo agent spawn --type coder --id my-coder
npx ruflo agent list --detailed
npx ruflo agent status <agentId>
npx ruflo agent terminate <agentId>
```

### memory
```bash
# V2
npx ruflo memory store --namespace default --content "data"
npx ruflo memory query --search "keyword" --limit 10
npx ruflo memory list --namespace default

# V3 (enhanced)
npx ruflo memory store --type episodic --content "data"
npx ruflo memory search --query "keyword" --search-type hybrid
npx ruflo memory list --type all --sort-by relevance
```

### swarm
```bash
# V2
npx ruflo swarm --strategy auto --max-agents 5

# V3 (enhanced)
npx ruflo swarm init --topology hierarchical-mesh --max-agents 15
npx ruflo swarm status --include-metrics
npx ruflo swarm scale --target 10 --strategy gradual
```

### hooks
```bash
# V2
npx ruflo hooks pre-edit --file src/app.ts
npx ruflo hooks post-edit --file src/app.ts --success true

# V3 (enhanced with learning)
npx ruflo hooks pre-edit src/app.ts
npx ruflo hooks post-edit src/app.ts --success true
npx ruflo hooks route "implement feature X"
npx ruflo hooks explain "implement feature X"
npx ruflo hooks pretrain
npx ruflo hooks metrics
```

### mcp
```bash
# V2
npx ruflo mcp start --port 3000 --transport stdio
npx ruflo mcp stop
npx ruflo mcp status

# V3 (same)
npx ruflo mcp start --port 3000 --transport stdio
npx ruflo mcp stop
npx ruflo mcp status
```

### config
```bash
# V2
npx ruflo config get orchestrator
npx ruflo config set orchestrator.maxAgents 10

# V3
npx ruflo config load --scope project
npx ruflo config save --create-backup
npx ruflo config validate --strict
```

### migrate
```bash
# V3 only
npx ruflo migrate status
npx ruflo migrate run --target all --backup
npx ruflo migrate verify
npx ruflo migrate rollback --backup-id <id>
```

## Missing Commands ❌

### Priority 1 - HIGH

#### init
```bash
# V2
npx ruflo init
npx ruflo init --minimal
npx ruflo init --nexus

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/init.ts
export const initCommand = {
  command: 'init',
  description: 'Initialize Codex integration files',
  options: [
    { flags: '-f, --force', description: 'Overwrite existing files' },
    { flags: '-m, --minimal', description: 'Create minimal configuration' },
    { flags: '--nexus', description: 'Initialize with Flow Nexus' }
  ],
  action: async (options) => {
    await createCodexFlowConfig(options);
    await createDefaultAgents(options);
    if (!options.minimal) {
      await createHooksConfig(options);
      await createWorkflowTemplates(options);
    }
  }
};
```

#### start
```bash
# V2
npx ruflo start
npx ruflo start --daemon
npx ruflo start --port 3000

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/start.ts
export const startCommand = {
  command: 'start',
  description: 'Start the orchestration system',
  options: [
    { flags: '-d, --daemon', description: 'Run as daemon' },
    { flags: '-p, --port <port>', description: 'MCP server port' }
  ],
  action: async (options) => {
    const swarm = await initializeV3Swarm();
    await swarm.spawnAllAgents();
    if (options.port) {
      await startMCPServer({ port: options.port });
    }
  }
};
```

#### status
```bash
# V2
npx ruflo status
npx ruflo status --watch
npx ruflo status --json
npx ruflo status --health-check

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/status.ts
export const statusCommand = {
  command: 'status',
  description: 'Show enhanced system status',
  options: [
    { flags: '-w, --watch', description: 'Watch mode' },
    { flags: '-i, --interval <seconds>', description: 'Update interval' },
    { flags: '--json', description: 'Output in JSON format' },
    { flags: '--health-check', description: 'Perform health checks' }
  ],
  action: async (options) => {
    const status = await getSystemStatus();
    if (options.healthCheck) {
      status.health = await performHealthChecks();
    }
    if (options.watch) {
      await watchStatus(status, options.interval);
    } else {
      displayStatus(status, options.json);
    }
  }
};
```

#### task
```bash
# V2
npx ruflo task create --type implementation --description "Build feature"
npx ruflo task list --status running
npx ruflo task status <taskId>
npx ruflo task cancel <taskId>
npx ruflo task assign <taskId> --agent <agentId>

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/task.ts
export const taskCommand = {
  command: 'task',
  description: 'Manage tasks',
  subcommands: [
    {
      command: 'create',
      options: [
        { flags: '-t, --type <type>', description: 'Task type' },
        { flags: '-d, --description <desc>', description: 'Task description' },
        { flags: '-p, --priority <priority>', description: 'Task priority' },
        { flags: '-a, --assign <agentId>', description: 'Assign to agent' }
      ]
    },
    { command: 'list', options: [{ flags: '-s, --status <status>' }] },
    { command: 'status', args: '<taskId>' },
    { command: 'cancel', args: '<taskId>' },
    { command: 'assign', args: '<taskId>', options: [{ flags: '--agent <agentId>' }] }
  ]
};
```

#### session
```bash
# V2
npx ruflo session list
npx ruflo session save --description "Checkpoint"
npx ruflo session restore <sessionId>
npx ruflo session delete <sessionId>
npx ruflo session export --include-memory
npx ruflo session import <file>

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/session.ts
export const sessionCommand = {
  command: 'session',
  description: 'Manage Codex-Flow sessions',
  subcommands: [
    { command: 'list', options: [{ flags: '-a, --active' }] },
    { command: 'save', options: [{ flags: '-d, --description <desc>' }] },
    { command: 'restore', args: '<sessionId>' },
    { command: 'delete', args: '<sessionId>' },
    { command: 'export', options: [{ flags: '--include-memory' }] },
    { command: 'import', args: '<file>' }
  ]
};
```

### Priority 2 - MEDIUM

#### hive
```bash
# V2
npx ruflo hive --topology mesh --consensus quorum --max-agents 8
npx ruflo hive-mind init
npx ruflo hive-mind status
npx ruflo hive-mind spawn --type queen
npx ruflo hive-mind task --description "Task"
npx ruflo hive-mind wizard
npx ruflo hive-mind pause
npx ruflo hive-mind resume
npx ruflo hive-mind stop

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/hive.ts
export const hiveCommand = {
  command: 'hive',
  description: 'Hive Mind multi-agent coordination',
  options: [
    { flags: '--topology <type>', description: 'Topology: mesh, hierarchical, ring, star' },
    { flags: '--consensus <type>', description: 'Consensus: quorum, unanimous, weighted' },
    { flags: '--max-agents <n>', description: 'Maximum agents' }
  ],
  subcommands: [
    { command: 'init' },
    { command: 'status' },
    { command: 'spawn', options: [{ flags: '-t, --type <type>' }] },
    { command: 'task', options: [{ flags: '-d, --description <desc>' }] },
    { command: 'wizard' },
    { command: 'pause' },
    { command: 'resume' },
    { command: 'stop' }
  ]
};
```

#### sparc
```bash
# V2
npx ruflo sparc modes
npx ruflo sparc info <mode>
npx ruflo sparc run --mode specification
npx ruflo sparc tdd --sequential
npx ruflo sparc workflow --dry-run

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/sparc.ts
export const sparcCommand = {
  command: 'sparc',
  description: 'SPARC methodology commands',
  subcommands: [
    { command: 'modes', description: 'List SPARC modes' },
    { command: 'info', args: '<mode>' },
    { command: 'run', options: [{ flags: '-m, --mode <mode>' }] },
    { command: 'tdd', options: [{ flags: '--sequential' }] },
    { command: 'workflow', options: [{ flags: '--dry-run' }] }
  ]
};
```

#### monitor
```bash
# V2
npx ruflo monitor
npx ruflo monitor --interval 2
npx ruflo monitor --compact
npx ruflo monitor --focus agents

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/monitor.ts
export const monitorCommand = {
  command: 'monitor',
  description: 'Start live monitoring dashboard',
  options: [
    { flags: '-i, --interval <seconds>', description: 'Update interval' },
    { flags: '-c, --compact', description: 'Compact view' },
    { flags: '--focus <component>', description: 'Focus on component' }
  ],
  action: async (options) => {
    const dashboard = createDashboard(options);
    await dashboard.start();
  }
};
```

#### github
```bash
# V2
npx ruflo github init
npx ruflo github gh-coordinator
npx ruflo github pr-manager
npx ruflo github issue-tracker
npx ruflo github release-manager
npx ruflo github repo-architect
npx ruflo github sync-coordinator

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/github.ts
export const githubCommand = {
  command: 'github',
  description: 'GitHub workflow automation',
  subcommands: [
    { command: 'init' },
    { command: 'gh-coordinator' },
    { command: 'pr-manager' },
    { command: 'issue-tracker' },
    { command: 'release-manager' },
    { command: 'repo-architect' },
    { command: 'sync-coordinator' }
  ],
  options: [
    { flags: '--auto-approve', description: 'Auto-approve permissions' },
    { flags: '--dry-run', description: 'Preview only' }
  ]
};
```

### Priority 3 - LOW

#### neural
```bash
# V2
npx ruflo neural init
npx ruflo neural init --force --target .codex/agents/neural

# V3: Replaced by hooks pretrain
npx ruflo hooks pretrain
```

#### goal
```bash
# V2
npx ruflo goal init

# V3: Replaced by hooks system
npx ruflo hooks pretrain --include-goap
```

#### codex
```bash
# V2
npx ruflo codex spawn --tools View,Edit,Bash --mode full

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/codex.ts
export const codexCommand = {
  command: 'codex',
  description: 'Spawn Codex instances',
  subcommands: [
    {
      command: 'spawn',
      options: [
        { flags: '-t, --tools <tools>', description: 'Allowed tools' },
        { flags: '-m, --mode <mode>', description: 'Dev mode' },
        { flags: '--parallel', description: 'Enable parallel execution' }
      ]
    }
  ]
};
```

#### workflow
```bash
# V2
npx ruflo workflow create --name "my-workflow"
npx ruflo workflow execute <workflow>
npx ruflo workflow list

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/workflow.ts
```

#### repl
```bash
# V2
npx ruflo repl

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/repl.ts
export const replCommand = {
  command: 'repl',
  description: 'Start interactive REPL mode',
  action: async () => {
    const rl = createInterface({ input: stdin, output: stdout });
    // REPL loop
  }
};
```

#### version
```bash
# V2
npx ruflo version
npx ruflo version --short

# V3 Migration needed:
# Add version flag to CLI root
```

#### completion
```bash
# V2
npx ruflo completion bash
npx ruflo completion --install

# V3 Migration needed:
# Add to v3/@ruflo/cli/src/commands/completion.ts
```

## Implementation Plan

### Phase 1 (Week 1-2): Core Commands
1. `init` - Project initialization
2. `start` - System startup
3. `status` - System status
4. `task` - Task management
5. `session` - Session management

### Phase 2 (Week 3-4): Feature Commands
1. `hive` - Hive-mind mode
2. `sparc` - SPARC methodology
3. `monitor` - Live dashboard
4. `github` - GitHub integration

### Phase 3 (Week 5-6): Utilities
1. `workflow` - Workflow management
2. `codex` - Codex spawning
3. `repl` - Interactive mode
4. `version` - Version info
5. `completion` - Shell completion
