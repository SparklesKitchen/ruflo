import { describe, it, expect } from 'vitest';
import {
  generateCodexMd,
  generateCodexLocalMd,
  generateSkillMd,
  generateAgentMd,
  generateAgentIndex,
  scaffold,
} from '../src/generators.js';
import type {
  ProjectProfile,
  LocalProfile,
  SkillDefinition,
  AgentDefinition,
} from '../src/generators.js';

// ============================================================================
// AGENTS.md Generator
// ============================================================================

describe('generateCodexMd', () => {
  const minimal: ProjectProfile = {
    name: 'my-app',
    languages: ['typescript'],
  };

  it('generates valid markdown with project name as heading', () => {
    const md = generateCodexMd(minimal);
    expect(md).toMatch(/^# my-app\n/);
  });

  it('includes language-specific invariants', () => {
    const md = generateCodexMd(minimal);
    expect(md).toContain('No `any` types');
    expect(md).toContain('Prefer `const` over `let`');
  });

  it('includes build and test section', () => {
    const md = generateCodexMd(minimal);
    expect(md).toContain('## Build & Test');
    expect(md).toContain('npm run build');
    expect(md).toContain('npm test');
  });

  it('uses custom package manager', () => {
    const md = generateCodexMd({ ...minimal, packageManager: 'pnpm' });
    expect(md).toContain('pnpm run build');
    expect(md).toContain('pnpm test');
  });

  it('uses custom build and test commands', () => {
    const md = generateCodexMd({
      ...minimal,
      buildCommand: 'make build',
      testCommand: 'make test',
    });
    expect(md).toContain('`make build`');
    expect(md).toContain('`make test`');
  });

  it('includes lint command when provided', () => {
    const md = generateCodexMd({ ...minimal, lintCommand: 'npm run lint' });
    expect(md).toContain('`npm run lint`');
  });

  it('includes description when provided', () => {
    const md = generateCodexMd({
      ...minimal,
      description: 'A web application for managing tasks',
    });
    expect(md).toContain('A web application for managing tasks');
  });

  it('includes monorepo note', () => {
    const md = generateCodexMd({ ...minimal, monorepo: true });
    expect(md).toContain('monorepo');
  });

  it('includes source and test directories', () => {
    const md = generateCodexMd({
      ...minimal,
      srcDir: 'src',
      testDir: 'tests',
    });
    expect(md).toContain('`src/`');
    expect(md).toContain('`tests/`');
  });

  it('includes domain rules', () => {
    const md = generateCodexMd({
      ...minimal,
      domainRules: [
        'Never write to the users table without a migration',
        'API responses must include requestId',
      ],
    });
    expect(md).toContain('## Domain Rules');
    expect(md).toContain('Never write to the users table');
    expect(md).toContain('requestId');
  });

  it('includes forbidden patterns', () => {
    const md = generateCodexMd({
      ...minimal,
      forbidden: ['Use eval()', 'Commit .env files'],
    });
    expect(md).toContain('NEVER: Use eval()');
    expect(md).toContain('NEVER: Commit .env files');
  });

  it('includes required patterns', () => {
    const md = generateCodexMd({
      ...minimal,
      required: ['Run tests before committing'],
    });
    expect(md).toContain('ALWAYS: Run tests before committing');
  });

  it('includes conventions', () => {
    const md = generateCodexMd({
      ...minimal,
      conventions: ['Use semantic commit messages', 'Keep functions under 30 lines'],
    });
    expect(md).toContain('## Coding Standards');
    expect(md).toContain('Use semantic commit messages');
  });

  it('includes framework rules', () => {
    const md = generateCodexMd({
      ...minimal,
      frameworks: ['React', 'Prisma'],
    });
    expect(md).toContain('## React Conventions');
    expect(md).toContain('functional components');
    expect(md).toContain('## Prisma Conventions');
    expect(md).toContain('prisma generate');
  });

  it('always includes security section', () => {
    const md = generateCodexMd(minimal);
    expect(md).toContain('## Security');
    expect(md).toContain('Never commit secrets');
    expect(md).toContain('destructive commands');
  });

  it('includes guidance control plane section when enabled', () => {
    const md = generateCodexMd({ ...minimal, guidanceControlPlane: true });
    expect(md).toContain('## Guidance Control Plane');
    expect(md).toContain('@ruflo/guidance');
    expect(md).toContain('Gates enforce');
  });

  it('includes WASM kernel note when enabled', () => {
    const md = generateCodexMd({
      ...minimal,
      guidanceControlPlane: true,
      wasmKernel: true,
    });
    expect(md).toContain('WASM kernel');
    expect(md).toContain('1.25-1.96x');
  });

  it('includes swarm configuration', () => {
    const md = generateCodexMd({
      ...minimal,
      swarm: { topology: 'hierarchical', maxAgents: 6, strategy: 'specialized' },
    });
    expect(md).toContain('## Swarm Configuration');
    expect(md).toContain('hierarchical');
    expect(md).toContain('6');
  });

  it('includes @imports', () => {
    const md = generateCodexMd({
      ...minimal,
      imports: ['~/.codex/my_instructions.md'],
    });
    expect(md).toContain('## Individual Preferences');
    expect(md).toContain('@~/.codex/my_instructions.md');
  });

  it('handles Python language', () => {
    const md = generateCodexMd({ name: 'pyapp', languages: ['python'] });
    expect(md).toContain('PEP 8');
    expect(md).toContain('type hints');
  });

  it('handles Rust language', () => {
    const md = generateCodexMd({ name: 'rustapp', languages: ['rust'] });
    expect(md).toContain('cargo clippy');
    expect(md).toContain('unwrap()');
  });

  it('handles Go language', () => {
    const md = generateCodexMd({ name: 'goapp', languages: ['go'] });
    expect(md).toContain('go vet');
    expect(md).toContain('handle errors');
  });

  it('handles unknown language with generic rule', () => {
    const md = generateCodexMd({ name: 'app', languages: ['elixir'] });
    expect(md).toContain('established elixir conventions');
  });

  it('handles multiple languages', () => {
    const md = generateCodexMd({
      name: 'fullstack',
      languages: ['typescript', 'python'],
    });
    expect(md).toContain('No `any` types');
    expect(md).toContain('PEP 8');
  });

  it('generates constitution-friendly structure (invariants near top)', () => {
    const md = generateCodexMd(minimal);
    const lines = md.split('\n');
    // Core Invariants should appear in first 20 lines
    const invariantLine = lines.findIndex(l => l.includes('Core Invariants'));
    expect(invariantLine).toBeGreaterThan(-1);
    expect(invariantLine).toBeLessThan(20);
  });
});

// ============================================================================
// .codex/AGENTS.override.md Generator
// ============================================================================

describe('generateCodexLocalMd', () => {
  it('generates markdown with local development header', () => {
    const md = generateCodexLocalMd({});
    expect(md).toContain('# Local Development Notes');
    expect(md).toContain('auto-gitignored');
  });

  it('includes developer name', () => {
    const md = generateCodexLocalMd({ developer: 'Alice' });
    expect(md).toContain('Developer: Alice');
  });

  it('includes local URLs', () => {
    const md = generateCodexLocalMd({
      localUrls: {
        API: 'http://localhost:3001',
        Frontend: 'http://localhost:3000',
      },
    });
    expect(md).toContain('## Local URLs');
    expect(md).toContain('API: http://localhost:3001');
    expect(md).toContain('Frontend: http://localhost:3000');
  });

  it('includes database connections', () => {
    const md = generateCodexLocalMd({
      databases: {
        dev: 'postgres://localhost:5432/myapp_dev',
      },
    });
    expect(md).toContain('## Local Databases');
    expect(md).toContain('postgres://localhost:5432/myapp_dev');
  });

  it('includes environment variables as bash exports', () => {
    const md = generateCodexLocalMd({
      envVars: { NODE_ENV: 'development', DEBUG: 'true' },
    });
    expect(md).toContain('## Environment Variables');
    expect(md).toContain('export NODE_ENV="development"');
    expect(md).toContain('export DEBUG="true"');
  });

  it('includes preferences', () => {
    const md = generateCodexLocalMd({
      preferences: ['Show git diffs before committing', 'Verbose error messages'],
    });
    expect(md).toContain('## Preferences');
    expect(md).toContain('Show git diffs');
  });

  it('includes machine notes with OS and editor', () => {
    const md = generateCodexLocalMd({
      os: 'macOS 15',
      editor: 'VS Code',
      machineNotes: ['16GB RAM', 'M2 chip'],
    });
    expect(md).toContain('## Machine Notes');
    expect(md).toContain('OS: macOS 15');
    expect(md).toContain('Editor: VS Code');
    expect(md).toContain('16GB RAM');
  });

  it('includes debug settings', () => {
    const md = generateCodexLocalMd({
      debug: ['Enable verbose logging', 'Skip rate limiting'],
    });
    expect(md).toContain('## Debug Settings');
    expect(md).toContain('Enable verbose logging');
  });
});

// ============================================================================
// Skill Generator
// ============================================================================

describe('generateSkillMd', () => {
  const skill: SkillDefinition = {
    name: 'deploy-to-staging',
    description: 'Deploy the application to the staging environment',
    category: 'deployment',
    tags: ['deploy', 'staging', 'ci-cd'],
    requires: ['docker', 'kubectl'],
    capabilities: ['Build Docker image', 'Push to registry', 'Apply k8s manifests'],
    instructions: '## Steps\n\n1. Build the Docker image\n2. Push to registry\n3. Apply manifests',
  };

  it('generates valid YAML frontmatter', () => {
    const md = generateSkillMd(skill);
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('name: deploy-to-staging');
    expect(md).toContain('version: 1.0.0');
    expect(md).toContain('description: Deploy the application');
    expect(md).toContain('category: deployment');
  });

  it('includes tags as array', () => {
    const md = generateSkillMd(skill);
    expect(md).toContain('tags: [deploy, staging, ci-cd]');
  });

  it('includes requires list', () => {
    const md = generateSkillMd(skill);
    expect(md).toContain('requires:');
    expect(md).toContain('  - docker');
    expect(md).toContain('  - kubectl');
  });

  it('includes capabilities list', () => {
    const md = generateSkillMd(skill);
    expect(md).toContain('capabilities:');
    expect(md).toContain('  - Build Docker image');
  });

  it('includes skill title in title case', () => {
    const md = generateSkillMd(skill);
    expect(md).toContain('# Deploy To Staging Skill');
  });

  it('includes instructions body', () => {
    const md = generateSkillMd(skill);
    expect(md).toContain('## Steps');
    expect(md).toContain('1. Build the Docker image');
  });

  it('uses custom version', () => {
    const md = generateSkillMd({ ...skill, version: '2.0.0-beta.1' });
    expect(md).toContain('version: 2.0.0-beta.1');
  });

  it('omits optional fields when not provided', () => {
    const md = generateSkillMd({
      name: 'simple',
      description: 'A simple skill',
      category: 'core',
      instructions: 'Do the thing.',
    });
    expect(md).not.toContain('tags:');
    expect(md).not.toContain('requires:');
    expect(md).not.toContain('capabilities:');
  });
});

// ============================================================================
// Agent Generator
// ============================================================================

describe('generateAgentMd', () => {
  const agent: AgentDefinition = {
    name: 'security-auditor',
    type: 'security-specialist',
    description: 'Audits code for security vulnerabilities',
    category: 'security',
    color: '#E74C3C',
    capabilities: ['secret-scanning', 'dependency-audit', 'sast'],
    focus: ['authentication', 'authorization', 'input-validation'],
    temperature: 0.1,
    priority: 'high',
    systemPrompt: 'You are a security specialist. Report all findings with severity levels.',
    instructions: 'Scan all changed files for OWASP Top 10 vulnerabilities.',
  };

  it('generates valid YAML frontmatter', () => {
    const md = generateAgentMd(agent);
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('name: security-auditor');
    expect(md).toContain('type: security-specialist');
    expect(md).toContain('color: "#E74C3C"');
    expect(md).toContain('temperature: 0.1');
    expect(md).toContain('priority: high');
  });

  it('includes capabilities list', () => {
    const md = generateAgentMd(agent);
    expect(md).toContain('capabilities:');
    expect(md).toContain('  - secret-scanning');
    expect(md).toContain('  - dependency-audit');
  });

  it('includes focus areas', () => {
    const md = generateAgentMd(agent);
    expect(md).toContain('focus:');
    expect(md).toContain('  - authentication');
  });

  it('includes system prompt section', () => {
    const md = generateAgentMd(agent);
    expect(md).toContain('## System Prompt');
    expect(md).toContain('security specialist');
  });

  it('includes instructions section', () => {
    const md = generateAgentMd(agent);
    expect(md).toContain('## Instructions');
    expect(md).toContain('OWASP Top 10');
  });

  it('includes agent title in title case', () => {
    const md = generateAgentMd(agent);
    expect(md).toContain('# Security Auditor Agent');
  });

  it('includes hooks when provided', () => {
    const md = generateAgentMd({
      ...agent,
      preHook: 'echo "Starting security audit"',
      postHook: 'echo "Audit complete"',
    });
    expect(md).toContain('hooks:');
    expect(md).toContain('pre: |');
    expect(md).toContain('Starting security audit');
    expect(md).toContain('post: |');
    expect(md).toContain('Audit complete');
  });

  it('defaults temperature to 0.2', () => {
    const md = generateAgentMd({
      name: 'basic',
      type: 'developer',
      description: 'Basic agent',
    });
    expect(md).toContain('temperature: 0.2');
  });

  it('omits optional fields when not provided', () => {
    const md = generateAgentMd({
      name: 'minimal',
      type: 'custom',
      description: 'Minimal agent',
    });
    expect(md).not.toContain('color:');
    expect(md).not.toContain('priority:');
    expect(md).not.toContain('hooks:');
    expect(md).not.toContain('## System Prompt');
    expect(md).not.toContain('## Instructions');
  });
});

// ============================================================================
// Agent Index Generator
// ============================================================================

describe('generateAgentIndex', () => {
  const agents: AgentDefinition[] = [
    { name: 'coordinator', type: 'coordinator', description: 'Coordinates work' },
    { name: 'coder', type: 'developer', description: 'Writes code' },
    { name: 'tester', type: 'tester', description: 'Writes tests' },
    { name: 'auditor', type: 'security-specialist', description: 'Audits security' },
  ];

  it('lists all agents', () => {
    const yaml = generateAgentIndex(agents);
    expect(yaml).toContain('  - coordinator');
    expect(yaml).toContain('  - coder');
    expect(yaml).toContain('  - tester');
    expect(yaml).toContain('  - auditor');
  });

  it('groups agents by type', () => {
    const yaml = generateAgentIndex(agents);
    expect(yaml).toContain('types:');
    expect(yaml).toContain('  coordinator:');
    expect(yaml).toContain('  developer:');
    expect(yaml).toContain('  tester:');
    expect(yaml).toContain('  security-specialist:');
  });

  it('handles empty list', () => {
    const yaml = generateAgentIndex([]);
    expect(yaml).toContain('agents:');
    expect(yaml).toContain('types:');
  });
});

// ============================================================================
// Scaffold (Full .codex/ Structure)
// ============================================================================

describe('scaffold', () => {
  it('generates AGENTS.md', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
    });
    expect(result.files.has('AGENTS.md')).toBe(true);
    expect(result.files.get('AGENTS.md')).toContain('# test-app');
  });

  it('generates .codex/AGENTS.override.md when local profile provided', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      local: { developer: 'Alice', preferences: ['Verbose output'] },
    });
    expect(result.files.has('.codex/AGENTS.override.md')).toBe(true);
    expect(result.files.get('.codex/AGENTS.override.md')).toContain('Alice');
  });

  it('does not generate .codex/AGENTS.override.md when not provided', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
    });
    expect(result.files.has('.codex/AGENTS.override.md')).toBe(false);
  });

  it('generates custom agents in correct paths', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      agents: [
        {
          name: 'my-agent',
          type: 'custom',
          description: 'A custom agent',
          category: 'custom',
        },
      ],
    });
    expect(result.files.has('.codex/agents/custom/my-agent.md')).toBe(true);
    expect(result.files.has('.codex/agents/index.yaml')).toBe(true);
  });

  it('generates custom skills in correct paths', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      skills: [
        {
          name: 'my-skill',
          description: 'A custom skill',
          category: 'custom',
          instructions: 'Do the thing',
        },
      ],
    });
    expect(result.files.has('.codex/skills/my-skill/SKILL.md')).toBe(true);
  });

  it('includes default agents when requested', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      includeDefaultAgents: true,
    });
    expect(result.files.has('.codex/agents/core/coordinator.md')).toBe(true);
    expect(result.files.has('.codex/agents/core/coder.md')).toBe(true);
    expect(result.files.has('.codex/agents/core/tester.md')).toBe(true);
    expect(result.files.has('.codex/agents/core/reviewer.md')).toBe(true);
    expect(result.files.has('.codex/agents/index.yaml')).toBe(true);
  });

  it('includes security agent when guidance control plane is enabled', () => {
    const result = scaffold({
      project: {
        name: 'test-app',
        languages: ['typescript'],
        guidanceControlPlane: true,
      },
      includeDefaultAgents: true,
    });
    expect(result.files.has('.codex/agents/security/security-auditor.md')).toBe(true);
  });

  it('includes default skills when requested', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      includeDefaultSkills: true,
    });
    expect(result.files.has('.codex/skills/build-and-test/SKILL.md')).toBe(true);
    expect(result.files.has('.codex/skills/code-review/SKILL.md')).toBe(true);
  });

  it('includes guidance skill when control plane is enabled', () => {
    const result = scaffold({
      project: {
        name: 'test-app',
        languages: ['typescript'],
        guidanceControlPlane: true,
      },
      includeDefaultSkills: true,
    });
    expect(result.files.has('.codex/skills/guidance-enforcement/SKILL.md')).toBe(true);
  });

  it('merges custom and default agents', () => {
    const result = scaffold({
      project: { name: 'test-app', languages: ['typescript'] },
      agents: [{ name: 'custom-bot', type: 'custom', description: 'Custom' }],
      includeDefaultAgents: true,
    });
    // Custom agent
    expect(result.files.has('.codex/agents/core/custom-bot.md')).toBe(true);
    // Default agents
    expect(result.files.has('.codex/agents/core/coordinator.md')).toBe(true);
    // Index includes all
    const index = result.files.get('.codex/agents/index.yaml')!;
    expect(index).toContain('custom-bot');
    expect(index).toContain('coordinator');
  });

  it('generates a full project scaffold with all features', () => {
    const result = scaffold({
      project: {
        name: 'enterprise-app',
        description: 'An enterprise SaaS application',
        languages: ['typescript', 'python'],
        frameworks: ['React', 'Express', 'Prisma'],
        packageManager: 'pnpm',
        monorepo: true,
        srcDir: 'packages/*/src',
        testDir: 'packages/*/tests',
        buildCommand: 'pnpm -r build',
        testCommand: 'pnpm -r test',
        lintCommand: 'pnpm -r lint',
        domainRules: ['All API endpoints require authentication'],
        conventions: ['Use conventional commits'],
        forbidden: ['console.log in production code'],
        required: ['Error boundary on every page'],
        guidanceControlPlane: true,
        wasmKernel: true,
        swarm: { topology: 'hierarchical', maxAgents: 8, strategy: 'specialized' },
        imports: ['~/.codex/my_prefs.md'],
      },
      local: {
        developer: 'Alice',
        localUrls: { API: 'http://localhost:4000' },
        databases: { dev: 'postgres://localhost/dev' },
        preferences: ['Dark mode', 'Verbose output'],
        editor: 'Cursor',
        os: 'macOS 15',
        machineNotes: ['Apple Silicon M2'],
      },
      includeDefaultAgents: true,
      includeDefaultSkills: true,
    });

    // Count files
    expect(result.files.size).toBeGreaterThanOrEqual(10);

    // AGENTS.md has all sections
    const codexMd = result.files.get('AGENTS.md')!;
    expect(codexMd).toContain('# enterprise-app');
    expect(codexMd).toContain('SaaS application');
    expect(codexMd).toContain('PEP 8');
    expect(codexMd).toContain('No `any` types');
    expect(codexMd).toContain('## React Conventions');
    expect(codexMd).toContain('## Prisma Conventions');
    expect(codexMd).toContain('## Domain Rules');
    expect(codexMd).toContain('authentication');
    expect(codexMd).toContain('NEVER: console.log');
    expect(codexMd).toContain('ALWAYS: Error boundary');
    expect(codexMd).toContain('## Guidance Control Plane');
    expect(codexMd).toContain('WASM kernel');
    expect(codexMd).toContain('## Swarm Configuration');
    expect(codexMd).toContain('@~/.codex/my_prefs.md');

    // .codex/AGENTS.override.md
    const localMd = result.files.get('.codex/AGENTS.override.md')!;
    expect(localMd).toContain('Alice');
    expect(localMd).toContain('http://localhost:4000');
    expect(localMd).toContain('postgres://localhost/dev');
    expect(localMd).toContain('Cursor');
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('edge cases', () => {
  it('handles empty arrays gracefully', () => {
    const md = generateCodexMd({
      name: 'app',
      languages: [],
    });
    expect(md).toContain('# app');
    // Should not crash even with empty languages
  });

  it('handles all framework types', () => {
    const frameworks = ['react', 'nextjs', 'express', 'fastify', 'django', 'flask', 'prisma', 'vitest', 'jest'];
    for (const fw of frameworks) {
      const md = generateCodexMd({
        name: 'test',
        languages: ['typescript'],
        frameworks: [fw],
      });
      expect(md).toContain(`## ${fw} Conventions`);
    }
  });

  it('handles unknown framework gracefully', () => {
    const md = generateCodexMd({
      name: 'test',
      languages: ['typescript'],
      frameworks: ['svelte'],
    });
    // Unknown framework should not produce a section (no rules to add)
    expect(md).not.toContain('## svelte Conventions');
  });

  it('agent index correctly groups multiple agents of same type', () => {
    const yaml = generateAgentIndex([
      { name: 'frontend-dev', type: 'developer', description: 'Frontend' },
      { name: 'backend-dev', type: 'developer', description: 'Backend' },
    ]);
    expect(yaml).toContain('  developer:');
    expect(yaml).toContain('    - frontend-dev');
    expect(yaml).toContain('    - backend-dev');
  });
});
