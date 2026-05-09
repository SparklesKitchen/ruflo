# ADR-027 Supplement: Domain-Driven Design for Codex Integration

## Overview

This document defines the Domain-Driven Design (DDD) architecture for integrating OpenAI Codex support into codex via the `@ruflo/codex` package. The design follows the existing V3 architecture patterns while introducing new bounded contexts for Codex-specific functionality.

## Package Information

- **Package Name**: `@ruflo/codex`
- **Location**: `v3/@ruflo/codex/`
- **Future Umbrella**: `coflow` (npm/npx coflow)
- **Compatibility**: Maintains `codex` branding during transition

## Strategic Design

### Domain Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Ruflo V3 Core Domain                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Agent Domain   │  │  Memory Domain  │  │   Coordination Domain      │ │
│  │                 │  │                 │  │                             │ │
│  │  - Spawning     │  │  - AgentDB      │  │  - Swarm                   │ │
│  │  - Lifecycle    │  │  - HNSW         │  │  - Consensus               │ │
│  │  - Metrics      │  │  - Patterns     │  │  - Hive-Mind               │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     Platform Adaptation Layer                           ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  ┌─────────────────────────┐    ┌─────────────────────────────────────┐││
│  │  │   Codex Context   │    │       Codex Context (NEW)          │││
│  │  │                         │    │                                     │││
│  │  │  - AGENTS.md Generator  │    │  - AGENTS.md Generator             │││
│  │  │  - Skills (.md format)  │    │  - Skills (SKILL.md format)        │││
│  │  │  - settings.json        │    │  - config.toml                      │││
│  │  │  - Hooks System         │    │  - Automations                      │││
│  │  │  - .mcp.json            │    │  - MCP [mcp_servers]               │││
│  │  └─────────────────────────┘    └─────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Bounded Contexts

#### 1. Platform Adapter Context (New)

**Purpose**: Abstract platform-specific configurations behind a unified interface.

**Ubiquitous Language**:
- **Platform**: Target CLI tool (Codex or Codex)
- **Manifest**: Platform-specific project instructions file (AGENTS.md or AGENTS.md)
- **Skill**: Reusable task-specific instruction set
- **Configuration**: Platform settings (JSON or TOML)
- **Automation**: Scheduled or triggered background tasks

**Aggregate Roots**:
- `PlatformConfiguration`
- `SkillLibrary`
- `ManifestDocument`

#### 2. Codex Adapter Context (New)

**Purpose**: Handle all Codex-specific generation and configuration.

**Ubiquitous Language**:
- **AGENTS.md**: Project instruction file for Codex
- **SKILL.md**: Skill definition file with YAML frontmatter
- **config.toml**: TOML configuration file
- **Approval Policy**: Permission level for command execution
- **Sandbox Mode**: Filesystem access restrictions
- **Progressive Disclosure**: Lazy loading of skill instructions

#### 3. Codex Adapter Context (Existing)

**Purpose**: Handle all Codex-specific generation (already implemented).

#### 4. Init Context (Extended)

**Purpose**: Orchestrate project initialization across platforms.

**Extensions**:
- Platform selection strategy
- Dual-mode initialization
- Cross-platform conversion

## Tactical Design

### Entities

#### PlatformConfiguration (Aggregate Root)

```typescript
interface PlatformConfiguration {
  id: string;
  platform: Platform;
  manifestPath: string;
  skillsPath: string;
  configPath: string;
  createdAt: Date;
  updatedAt: Date;

  // Behavior
  validate(): ValidationResult;
  toJSON(): object;
  toTOML(): string;
}

enum Platform {
  CODEX = 'codex-code',
  CODEX = 'codex',
  DUAL = 'dual'
}
```

#### ManifestDocument (Entity)

```typescript
interface ManifestDocument {
  id: string;
  platform: Platform;
  sections: ManifestSection[];
  byteSize: number;

  // Behavior
  addSection(section: ManifestSection): void;
  removeSection(sectionName: string): void;
  render(): string;
  validate(): ValidationResult;
}

interface ManifestSection {
  name: string;
  content: string;
  order: number;
  required: boolean;
}
```

#### Skill (Entity)

```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  platform: Platform;

  // For Codex
  metadata?: SkillMetadata;
  scripts?: SkillScript[];
  references?: SkillReference[];
  assets?: SkillAsset[];

  // Behavior
  toCodexFormat(): string;
  toCodexFormat(): SkillDirectory;
}

interface SkillMetadata {
  name: string;
  description: string;
  triggers?: string[];
  skipWhen?: string[];
}

interface SkillDirectory {
  path: string;
  skillMd: string;
  scripts: Map<string, string>;
  references: Map<string, string>;
  assets: Map<string, Buffer>;
  agentsYaml?: string;
}
```

#### CodexConfiguration (Entity)

```typescript
interface CodexConfiguration {
  // Core settings
  model: string;
  approvalPolicy: ApprovalPolicy;
  sandboxMode: SandboxMode;
  webSearch: WebSearchMode;

  // Features
  features: FeatureFlags;

  // MCP servers
  mcpServers: Map<string, MCPServerConfig>;

  // Skills
  skills: SkillConfig[];

  // Profiles
  profiles: Map<string, ProfileConfig>;

  // Behavior
  toTOML(): string;
  validate(): ValidationResult;
  merge(other: Partial<CodexConfiguration>): CodexConfiguration;
}

enum ApprovalPolicy {
  UNTRUSTED = 'untrusted',
  ON_FAILURE = 'on-failure',
  ON_REQUEST = 'on-request',
  NEVER = 'never'
}

enum SandboxMode {
  READ_ONLY = 'read-only',
  WORKSPACE_WRITE = 'workspace-write',
  FULL_ACCESS = 'danger-full-access'
}

enum WebSearchMode {
  DISABLED = 'disabled',
  CACHED = 'cached',
  LIVE = 'live'
}
```

### Value Objects

#### SkillIdentifier

```typescript
class SkillIdentifier {
  constructor(
    public readonly name: string,
    public readonly scope: SkillScope
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name.match(/^[a-z0-9-]+$/)) {
      throw new InvalidSkillNameError(this.name);
    }
  }

  get path(): string {
    return `${this.scope.basePath}/${this.name}`;
  }

  equals(other: SkillIdentifier): boolean {
    return this.name === other.name && this.scope.equals(other.scope);
  }
}

class SkillScope {
  constructor(
    public readonly type: 'repository' | 'user' | 'admin' | 'system',
    public readonly basePath: string
  ) {}

  equals(other: SkillScope): boolean {
    return this.type === other.type && this.basePath === other.basePath;
  }
}
```

#### ManifestPath

```typescript
class ManifestPath {
  constructor(
    public readonly platform: Platform,
    public readonly projectRoot: string,
    public readonly isOverride: boolean = false
  ) {}

  get filename(): string {
    if (this.platform === Platform.CODEX) {
      return this.isOverride ? 'AGENTS.override.md' : 'AGENTS.md';
    }
    return this.isOverride ? '.codex/AGENTS.override.md' : 'AGENTS.md';
  }

  get fullPath(): string {
    return path.join(this.projectRoot, this.filename);
  }
}
```

#### ConfigurationPath

```typescript
class ConfigurationPath {
  constructor(
    public readonly platform: Platform,
    public readonly scope: 'global' | 'project',
    public readonly basePath: string
  ) {}

  get fullPath(): string {
    if (this.platform === Platform.CODEX) {
      return this.scope === 'global'
        ? path.join(os.homedir(), '.codex', 'config.toml')
        : path.join(this.basePath, '.agents', 'config.toml');
    }
    return this.scope === 'global'
      ? path.join(os.homedir(), '.codex', 'settings.json')
      : path.join(this.basePath, '.codex', 'settings.json');
  }
}
```

### Aggregates

#### PlatformInitializationAggregate

```typescript
class PlatformInitializationAggregate {
  private readonly id: string;
  private platform: Platform;
  private manifest: ManifestDocument;
  private skills: SkillLibrary;
  private configuration: PlatformConfiguration;
  private events: DomainEvent[] = [];

  constructor(options: InitializationOptions) {
    this.id = generateId();
    this.platform = options.platform;
  }

  // Commands
  initialize(options: InitOptions): InitResult {
    this.validatePreconditions(options);

    // Generate manifest
    this.manifest = this.generateManifest(options);
    this.events.push(new ManifestGenerated(this.manifest));

    // Generate skills
    this.skills = this.generateSkills(options);
    this.events.push(new SkillsGenerated(this.skills));

    // Generate configuration
    this.configuration = this.generateConfiguration(options);
    this.events.push(new ConfigurationGenerated(this.configuration));

    return this.buildResult();
  }

  convertFromOtherPlatform(source: Platform): ConversionResult {
    // Read existing configuration
    const existing = this.readExistingConfiguration(source);

    // Map to target platform
    const mapped = this.mapConfiguration(existing);

    // Generate new artifacts
    return this.generateFromMapped(mapped);
  }

  // Queries
  getGeneratedFiles(): GeneratedFile[] {
    return [
      ...this.manifest.getFiles(),
      ...this.skills.getFiles(),
      ...this.configuration.getFiles()
    ];
  }

  getDomainEvents(): DomainEvent[] {
    return [...this.events];
  }
}
```

#### SkillLibraryAggregate

```typescript
class SkillLibraryAggregate {
  private readonly skills: Map<string, Skill> = new Map();
  private readonly platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  addSkill(skill: Skill): void {
    if (this.skills.has(skill.name)) {
      throw new DuplicateSkillError(skill.name);
    }
    this.skills.set(skill.name, skill);
  }

  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  generateForPlatform(): SkillOutput[] {
    return this.getAllSkills().map(skill => {
      if (this.platform === Platform.CODEX) {
        return skill.toCodexFormat();
      }
      return skill.toCodexFormat();
    });
  }

  convertTo(targetPlatform: Platform): SkillLibraryAggregate {
    const newLibrary = new SkillLibraryAggregate(targetPlatform);
    for (const skill of this.skills.values()) {
      newLibrary.addSkill(skill.cloneForPlatform(targetPlatform));
    }
    return newLibrary;
  }
}
```

### Domain Services

#### PlatformDetectionService

```typescript
class PlatformDetectionService {
  detect(projectPath: string): DetectedPlatform {
    const hasCodexDir = fs.existsSync(path.join(projectPath, '.codex'));
    const hasAgentsDir = fs.existsSync(path.join(projectPath, '.agents'));
    const hasCodexMd = fs.existsSync(path.join(projectPath, 'AGENTS.md'));
    const hasAgentsMd = fs.existsSync(path.join(projectPath, 'AGENTS.md'));

    if (hasCodexDir && hasAgentsDir) {
      return { platform: Platform.DUAL, existing: true };
    }
    if (hasCodexDir || hasCodexMd) {
      return { platform: Platform.CODEX, existing: true };
    }
    if (hasAgentsDir || hasAgentsMd) {
      return { platform: Platform.CODEX, existing: true };
    }

    return { platform: Platform.UNKNOWN, existing: false };
  }

  async detectUserPreference(): Promise<Platform> {
    // Check for global Codex config
    const codexConfig = path.join(os.homedir(), '.codex', 'config.toml');
    const codexConfig = path.join(os.homedir(), '.codex');

    const hasCodex = fs.existsSync(codexConfig);
    const hasCodex = fs.existsSync(codexConfig);

    if (hasCodex && !hasCodex) return Platform.CODEX;
    if (hasCodex && !hasCodex) return Platform.CODEX;
    if (hasCodex && hasCodex) return Platform.DUAL;

    return Platform.UNKNOWN;
  }
}
```

#### SkillConversionService

```typescript
class SkillConversionService {
  convertCodexToCodex(skill: CodexSkill): CodexSkill {
    // Parse YAML frontmatter from Codex skill
    const { metadata, content } = this.parseCodexSkill(skill);

    // Create SKILL.md content
    const skillMd = this.generateSkillMd(metadata, content);

    // Extract scripts if any code blocks present
    const scripts = this.extractScripts(content);

    // Extract references (links to docs)
    const references = this.extractReferences(content);

    return new CodexSkill({
      name: metadata.name || skill.name,
      description: metadata.description || '',
      skillMd,
      scripts,
      references
    });
  }

  convertCodexToCodex(skill: CodexSkill): CodexSkill {
    // Parse SKILL.md
    const { frontmatter, body } = this.parseSkillMd(skill.skillMd);

    // Generate Codex skill format
    const codexContent = this.generateCodexSkill(frontmatter, body);

    return new CodexSkill({
      name: frontmatter.name,
      content: codexContent
    });
  }

  private generateSkillMd(metadata: SkillMetadata, content: string): string {
    return `---
name: ${metadata.name}
description: ${metadata.description}
---

${content}`;
  }
}
```

#### ConfigurationMigrationService

```typescript
class ConfigurationMigrationService {
  migrateCodexToCodex(codexSettings: CodexSettings): CodexConfiguration {
    return {
      model: 'gpt-5.3-codex',
      approvalPolicy: this.mapApprovalPolicy(codexSettings),
      sandboxMode: this.mapSandboxMode(codexSettings),
      webSearch: 'cached',
      features: this.mapFeatures(codexSettings),
      mcpServers: this.migrateMcpServers(codexSettings.mcpServers),
      skills: this.mapSkillsConfig(codexSettings),
      profiles: new Map()
    };
  }

  migrateCodexToCodex(codexConfig: CodexConfiguration): CodexSettings {
    return {
      hooks: this.mapHooksFromApprovalPolicy(codexConfig.approvalPolicy),
      mcpServers: this.migrateMcpServersToJson(codexConfig.mcpServers),
      // ... other mappings
    };
  }

  private mapApprovalPolicy(settings: CodexSettings): ApprovalPolicy {
    // Map Codex permission mode to Codex approval policy
    const hooks = settings.hooks || {};
    if (hooks.preToolUse?.autoApprove) {
      return ApprovalPolicy.NEVER;
    }
    return ApprovalPolicy.ON_REQUEST;
  }

  private mapSandboxMode(settings: CodexSettings): SandboxMode {
    // Default to workspace-write for safety
    return SandboxMode.WORKSPACE_WRITE;
  }
}
```

### Repositories

#### ManifestRepository

```typescript
interface ManifestRepository {
  save(manifest: ManifestDocument): Promise<void>;
  load(path: ManifestPath): Promise<ManifestDocument | null>;
  exists(path: ManifestPath): Promise<boolean>;
  delete(path: ManifestPath): Promise<void>;
}

class FileSystemManifestRepository implements ManifestRepository {
  async save(manifest: ManifestDocument): Promise<void> {
    const content = manifest.render();
    await fs.writeFile(manifest.path.fullPath, content, 'utf-8');
  }

  async load(path: ManifestPath): Promise<ManifestDocument | null> {
    if (!await this.exists(path)) {
      return null;
    }
    const content = await fs.readFile(path.fullPath, 'utf-8');
    return ManifestDocument.parse(content, path.platform);
  }

  async exists(path: ManifestPath): Promise<boolean> {
    return fs.existsSync(path.fullPath);
  }

  async delete(path: ManifestPath): Promise<void> {
    await fs.unlink(path.fullPath);
  }
}
```

#### SkillRepository

```typescript
interface SkillRepository {
  save(skill: Skill, scope: SkillScope): Promise<void>;
  load(identifier: SkillIdentifier): Promise<Skill | null>;
  list(scope: SkillScope): Promise<Skill[]>;
  delete(identifier: SkillIdentifier): Promise<void>;
}

class CodexSkillRepository implements SkillRepository {
  async save(skill: Skill, scope: SkillScope): Promise<void> {
    const directory = skill.toCodexFormat();
    const skillPath = path.join(scope.basePath, skill.name);

    // Create directory structure
    await fs.mkdir(skillPath, { recursive: true });
    await fs.mkdir(path.join(skillPath, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(skillPath, 'references'), { recursive: true });

    // Write SKILL.md
    await fs.writeFile(
      path.join(skillPath, 'SKILL.md'),
      directory.skillMd,
      'utf-8'
    );

    // Write scripts
    for (const [name, content] of directory.scripts) {
      await fs.writeFile(
        path.join(skillPath, 'scripts', name),
        content,
        'utf-8'
      );
    }

    // Write references
    for (const [name, content] of directory.references) {
      await fs.writeFile(
        path.join(skillPath, 'references', name),
        content,
        'utf-8'
      );
    }

    // Write openai.yaml if present
    if (directory.agentsYaml) {
      await fs.mkdir(path.join(skillPath, 'agents'), { recursive: true });
      await fs.writeFile(
        path.join(skillPath, 'agents', 'openai.yaml'),
        directory.agentsYaml,
        'utf-8'
      );
    }
  }

  async load(identifier: SkillIdentifier): Promise<Skill | null> {
    const skillPath = identifier.path;
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      return null;
    }

    const skillMd = await fs.readFile(skillMdPath, 'utf-8');
    const scripts = await this.loadDirectory(path.join(skillPath, 'scripts'));
    const references = await this.loadDirectory(path.join(skillPath, 'references'));

    return Skill.fromCodexFormat({
      skillMd,
      scripts,
      references,
      path: skillPath
    });
  }

  private async loadDirectory(dirPath: string): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (!fs.existsSync(dirPath)) {
      return result;
    }

    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
      result.set(file, content);
    }
    return result;
  }
}
```

### Application Services

#### InitializationApplicationService

```typescript
class InitializationApplicationService {
  constructor(
    private readonly platformDetection: PlatformDetectionService,
    private readonly manifestRepo: ManifestRepository,
    private readonly skillRepo: SkillRepository,
    private readonly configRepo: ConfigurationRepository,
    private readonly conversionService: SkillConversionService
  ) {}

  async initializeForCodex(options: CodexInitOptions): Promise<InitResult> {
    // Check for existing configuration
    const detected = this.platformDetection.detect(options.projectPath);

    if (detected.existing && !options.force) {
      throw new ExistingConfigurationError(detected.platform);
    }

    // Create aggregate
    const aggregate = new PlatformInitializationAggregate({
      platform: Platform.CODEX,
      projectPath: options.projectPath
    });

    // Generate artifacts
    const result = aggregate.initialize(options);

    // Persist artifacts
    await this.manifestRepo.save(result.manifest);
    for (const skill of result.skills) {
      await this.skillRepo.save(skill, new SkillScope('repository', options.projectPath));
    }
    await this.configRepo.save(result.configuration);

    // Emit domain events
    for (const event of aggregate.getDomainEvents()) {
      await this.eventBus.publish(event);
    }

    return result;
  }

  async convertToCodex(projectPath: string): Promise<ConversionResult> {
    // Load existing Codex configuration
    const codexManifest = await this.loadCodexManifest(projectPath);
    const codexSkills = await this.loadCodexSkills(projectPath);
    const codexSettings = await this.loadCodexSettings(projectPath);

    // Convert manifest
    const codexManifest = this.convertManifest(codexManifest);

    // Convert skills
    const codexSkills = codexSkills.map(skill =>
      this.conversionService.convertCodexToCodex(skill)
    );

    // Convert configuration
    const codexConfig = this.configMigration.migrateCodexToCodex(codexSettings);

    // Save converted artifacts
    await this.manifestRepo.save(codexManifest);
    for (const skill of codexSkills) {
      await this.skillRepo.save(skill, new SkillScope('repository', projectPath));
    }
    await this.configRepo.save(codexConfig);

    return {
      success: true,
      manifest: codexManifest,
      skills: codexSkills,
      configuration: codexConfig
    };
  }

  async initializeDualMode(options: DualModeInitOptions): Promise<DualModeResult> {
    // Initialize for Codex
    const codexResult = await this.initializeForCodex(options);

    // Initialize for Codex
    const codexResult = await this.initializeForCodex(options);

    // Create sync configuration to keep them in sync
    await this.createSyncConfiguration(options.projectPath);

    return {
      codex: codexResult,
      codex: codexResult,
      syncConfigPath: path.join(options.projectPath, '.codex', 'platform-sync.yaml')
    };
  }
}
```

## Domain Events

```typescript
interface DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;
}

class ManifestGenerated implements DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;

  constructor(
    public readonly manifest: ManifestDocument,
    public readonly platform: Platform
  ) {
    this.eventId = generateEventId();
    this.timestamp = new Date();
    this.aggregateId = manifest.id;
  }
}

class SkillsGenerated implements DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;

  constructor(
    public readonly skills: Skill[],
    public readonly platform: Platform
  ) {
    this.eventId = generateEventId();
    this.timestamp = new Date();
    this.aggregateId = skills[0]?.id || 'unknown';
  }
}

class ConfigurationGenerated implements DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;

  constructor(
    public readonly configuration: PlatformConfiguration
  ) {
    this.eventId = generateEventId();
    this.timestamp = new Date();
    this.aggregateId = configuration.id;
  }
}

class PlatformConversionCompleted implements DomainEvent {
  eventId: string;
  timestamp: Date;
  aggregateId: string;

  constructor(
    public readonly sourcePlatform: Platform,
    public readonly targetPlatform: Platform,
    public readonly projectPath: string
  ) {
    this.eventId = generateEventId();
    this.timestamp = new Date();
    this.aggregateId = projectPath;
  }
}
```

## Package Structure

```
v3/@ruflo/
├── cli/
│   └── src/
│       └── commands/
│           └── init.ts              # Extended with --codex flag
│
├── codex/                           # NEW PACKAGE
│   ├── package.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── manifest.ts
│   │   │   │   ├── skill.ts
│   │   │   │   └── configuration.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── skill-identifier.ts
│   │   │   │   ├── manifest-path.ts
│   │   │   │   └── configuration-path.ts
│   │   │   ├── aggregates/
│   │   │   │   ├── initialization.ts
│   │   │   │   └── skill-library.ts
│   │   │   ├── services/
│   │   │   │   ├── platform-detection.ts
│   │   │   │   ├── skill-conversion.ts
│   │   │   │   └── config-migration.ts
│   │   │   └── events/
│   │   │       └── domain-events.ts
│   │   ├── application/
│   │   │   ├── initialization-service.ts
│   │   │   └── conversion-service.ts
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   │   ├── manifest-repository.ts
│   │   │   │   ├── skill-repository.ts
│   │   │   │   └── config-repository.ts
│   │   │   └── generators/
│   │   │       ├── agents-md-generator.ts
│   │   │       ├── skill-md-generator.ts
│   │   │       └── config-toml-generator.ts
│   │   └── templates/
│   │       ├── agents-md/
│   │       │   ├── default.md
│   │       │   ├── minimal.md
│   │       │   └── full.md
│   │       ├── skills/
│   │       │   ├── swarm-orchestration/
│   │       │   ├── memory-management/
│   │       │   └── ...
│   │       └── config/
│   │           ├── default.toml
│   │           └── profiles/
│   └── tests/
│       ├── unit/
│       └── integration/
│
└── shared/
    └── src/
        └── platform/
            └── types.ts              # Shared platform types
```

## Integration Points

### With Existing Init System

```typescript
// v3/@ruflo/cli/src/commands/init.ts

import { CodexInitializer } from '@ruflo/codex';

// Add new options
const initCommand: Command = {
  name: 'init',
  options: [
    // ... existing options ...
    {
      name: 'codex',
      description: 'Initialize for OpenAI Codex',
      type: 'boolean',
      default: false,
    },
    {
      name: 'dual',
      description: 'Initialize for both Codex and Codex',
      type: 'boolean',
      default: false,
    },
    {
      name: 'from-codex',
      description: 'Convert existing Codex setup to Codex',
      type: 'boolean',
      default: false,
    },
    {
      name: 'from-codex',
      description: 'Convert existing Codex setup to Codex',
      type: 'boolean',
      default: false,
    },
  ],
  action: async (ctx) => {
    const codex = ctx.flags.codex as boolean;
    const dual = ctx.flags.dual as boolean;
    const fromCodex = ctx.flags['from-codex'] as boolean;
    const fromCodex = ctx.flags['from-codex'] as boolean;

    if (codex || dual) {
      const initializer = new CodexInitializer();
      // ... codex initialization logic
    }

    if (fromCodex) {
      const converter = new PlatformConverter();
      await converter.convertToCodex(ctx.cwd);
    }

    // ... existing Codex init logic
  }
};
```

## Summary

This DDD design provides:

1. **Clear Bounded Contexts** - Platform Adapter, Codex Adapter, Codex Adapter
2. **Rich Domain Model** - Entities, Value Objects, Aggregates for each concept
3. **Domain Services** - Platform detection, skill conversion, config migration
4. **Repository Pattern** - Abstract persistence for manifests, skills, configurations
5. **Event Sourcing Ready** - Domain events for all significant state changes
6. **Extensibility** - New platforms can be added by implementing the adapter interface

The design maintains consistency with V3's existing DDD patterns while introducing the flexibility needed to support multiple agentic coding platforms.
