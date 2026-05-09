#!/usr/bin/env node
/**
 * @ruflo/codex - CLI
 *
 * Command-line interface for Codex integration
 * Part of the coflow rebranding initiative
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { CodexInitializer } from './initializer.js';
import { validateAgentsMd, validateSkillMd, validateConfigToml } from './validators/index.js';
import { listTemplates, BUILT_IN_SKILLS } from './templates/index.js';
import { generateSkillMd } from './generators/skill-md.js';
import { VERSION, PACKAGE_INFO } from './index.js';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

// Custom error handler for better output
function handleError(error: unknown, message?: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(chalk.red.bold('\nError:'), chalk.red(message ?? errorMessage));

  if (error instanceof Error && error.stack && process.env.DEBUG) {
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error.stack));
  }

  process.exit(1);
}

// Validate project path exists and is accessible
async function validatePath(projectPath: string): Promise<string> {
  const resolvedPath = path.resolve(projectPath);

  try {
    const stats = await fs.stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${resolvedPath}`);
    }
    return resolvedPath;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory doesn't exist, try to create it
      console.log(chalk.yellow(`Creating directory: ${resolvedPath}`));
      await fs.ensureDir(resolvedPath);
      return resolvedPath;
    }
    throw error;
  }
}

// Validate skill name format
function validateSkillName(name: string): boolean {
  const validPattern = /^[a-z][a-z0-9-]*$/;
  return validPattern.test(name);
}

// Print banner
function printBanner(): void {
  console.log(chalk.cyan.bold('\n  Ruflo Codex'));
  console.log(chalk.gray('  OpenAI Codex integration for Ruflo'));
  console.log(chalk.gray('  ----------------------------------------\n'));
}

program
  .name('ruflo-codex')
  .description('OpenAI Codex integration for Ruflo')
  .version(VERSION, '-v, --version', 'Display version number')
  .option('--debug', 'Enable debug mode', false)
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      process.env.DEBUG = 'true';
    }
  });

// Init command
program
  .command('init')
  .description('Initialize a new Codex project with AGENTS.md and skills')
  .option('-t, --template <template>', 'Template to use (minimal, default, full, enterprise)', 'default')
  .option('-s, --skills <skills>', 'Comma-separated list of skills to include')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-q, --quiet', 'Suppress verbose output', false)
  .action(async (options) => {
    try {
      if (!options.quiet) {
        printBanner();
      }

      // Validate template
      const validTemplates = ['minimal', 'default', 'full', 'enterprise'];
      if (!validTemplates.includes(options.template)) {
        console.error(chalk.red(`Invalid template: ${options.template}`));
        console.log(chalk.gray(`Valid templates: ${validTemplates.join(', ')}`));
        process.exit(1);
      }

      const projectPath = await validatePath(options.path);

      console.log(chalk.blue('Initializing Codex project...'));
      console.log(chalk.gray(`  Path:     ${projectPath}`));
      console.log(chalk.gray(`  Template: ${options.template}`));
      if (options.skills) {
        console.log(chalk.gray(`  Skills:   ${options.skills}`));
      }
      if (options.force) {
        console.log(chalk.yellow('  Force:    enabled (will overwrite existing files)'));
      }
      const initializer = new CodexInitializer();
      const skills = options.skills?.split(',').map((s: string) => s.trim()).filter(Boolean);

      // Validate skill names if provided
      if (skills) {
        for (const skill of skills) {
          if (!validateSkillName(skill)) {
            console.error(chalk.red(`Invalid skill name: ${skill}`));
            console.log(chalk.gray('Skill names must be kebab-case (lowercase letters, numbers, hyphens)'));
            process.exit(1);
          }
        }
      }

      const result = await initializer.initialize({
        projectPath,
        template: options.template,
        skills,
        force: options.force,
      });

      if (result.success) {
        console.log(chalk.green.bold('\n  Project initialized successfully!'));

        if (result.filesCreated.length > 0) {
          console.log(chalk.white('\n  Files created:'));
          for (const file of result.filesCreated) {
            console.log(chalk.gray(`    ${chalk.green('+')} ${file}`));
          }
        }

        if (result.skillsGenerated.length > 0) {
          console.log(chalk.white('\n  Skills generated:'));
          for (const skill of result.skillsGenerated) {
            console.log(chalk.gray(`    ${chalk.cyan('$')}${skill}`));
          }
        }

        if (result.warnings && result.warnings.length > 0) {
          console.log(chalk.yellow('\n  Warnings:'));
          for (const warning of result.warnings) {
            console.log(chalk.yellow(`    ! ${warning}`));
          }
        }

        console.log(chalk.blue.bold('\n  Next steps:'));
        console.log(chalk.gray('    1. Review AGENTS.md and customize for your project'));
        console.log(chalk.gray('    2. Review .agents/config.toml settings'));
        console.log(chalk.gray('    3. Start using skills with $skill-name syntax'));
        console.log();
      } else {
        console.log(chalk.red.bold('\n  Initialization failed'));
        if (result.errors) {
          for (const error of result.errors) {
            console.log(chalk.red(`    - ${error}`));
          }
        }
        process.exit(1);
      }
    } catch (error) {
      handleError(error, 'Failed to initialize project');
    }
  });

// Generate skill command
program
  .command('generate-skill')
  .alias('gs')
  .description('Generate a new SKILL.md file')
  .requiredOption('-n, --name <name>', 'Skill name (kebab-case)')
  .option('-d, --description <description>', 'Skill description')
  .option('-t, --triggers <triggers>', 'Comma-separated trigger conditions')
  .option('-s, --skip <skip>', 'Comma-separated skip conditions')
  .option('-p, --path <path>', 'Output path', process.cwd())
  .option('--dry-run', 'Show what would be generated without writing', false)
  .action(async (options) => {
    try {
      printBanner();

      // Validate skill name
      if (!validateSkillName(options.name)) {
        console.error(chalk.red(`Invalid skill name: ${options.name}`));
        console.log(chalk.gray('Skill names must be kebab-case (lowercase letters, numbers, hyphens)'));
        console.log(chalk.gray('Examples: my-skill, code-analyzer, data-processor'));
        process.exit(1);
      }

      const projectPath = await validatePath(options.path);

      console.log(chalk.blue(`Generating skill: ${chalk.white(options.name)}`));

      const triggers = options.triggers?.split(',').map((s: string) => s.trim()).filter(Boolean);
      const skipWhen = options.skip?.split(',').map((s: string) => s.trim()).filter(Boolean);

      const skillMd = await generateSkillMd({
        name: options.name,
        description: options.description ?? `Custom skill: ${options.name}`,
        triggers: triggers ?? ['Define when to trigger this skill'],
        skipWhen: skipWhen ?? ['Define when to skip this skill'],
      });

      if (options.dryRun) {
        console.log(chalk.yellow('\nDry run - would generate:'));
        console.log(chalk.gray('---'));
        console.log(skillMd);
        console.log(chalk.gray('---'));
        return;
      }

      const skillDir = path.join(projectPath, '.agents', 'skills', options.name);
      await fs.ensureDir(skillDir);
      const skillPath = path.join(skillDir, 'SKILL.md');

      // Check if skill already exists
      if (await fs.pathExists(skillPath)) {
        console.log(chalk.yellow(`Skill already exists: ${skillPath}`));
        console.log(chalk.gray('Use --force to overwrite (not yet implemented)'));
        process.exit(1);
      }

      await fs.writeFile(skillPath, skillMd);

      console.log(chalk.green.bold(`\n  Skill created successfully!`));
      console.log(chalk.gray(`  Path: ${skillPath}`));
      console.log(chalk.gray(`  Use:  ${chalk.cyan('$' + options.name)}`));
      console.log();
    } catch (error) {
      handleError(error, 'Failed to generate skill');
    }
  });

// Validate command
program
  .command('validate')
  .alias('check')
  .description('Validate AGENTS.md, SKILL.md, or config.toml files')
  .option('-f, --file <file>', 'File to validate')
  .option('-p, --path <path>', 'Project path to validate all files', process.cwd())
  .option('--fix', 'Attempt to fix issues (not yet implemented)', false)
  .option('--strict', 'Treat warnings as errors', false)
  .action(async (options) => {
    try {
      printBanner();

      const projectPath = path.resolve(options.path);
      const filesToValidate: Array<{ path: string; type: 'agents' | 'skill' | 'config' }> = [];

      if (options.file) {
        // Validate specific file
        const filePath = path.resolve(options.file);

        if (!await fs.pathExists(filePath)) {
          console.error(chalk.red(`File not found: ${filePath}`));
          process.exit(1);
        }

        const fileName = path.basename(filePath).toLowerCase();
        if (fileName === 'agents.md') {
          filesToValidate.push({ path: filePath, type: 'agents' });
        } else if (fileName === 'skill.md') {
          filesToValidate.push({ path: filePath, type: 'skill' });
        } else if (fileName === 'config.toml') {
          filesToValidate.push({ path: filePath, type: 'config' });
        } else {
          console.error(chalk.red(`Unknown file type: ${fileName}`));
          console.log(chalk.gray('Supported files: AGENTS.md, SKILL.md, config.toml'));
          process.exit(1);
        }
      } else {
        // Validate all files in project
        console.log(chalk.blue(`Scanning project: ${projectPath}`));

        const agentsMd = path.join(projectPath, 'AGENTS.md');
        const configToml = path.join(projectPath, '.agents', 'config.toml');

        if (await fs.pathExists(agentsMd)) {
          filesToValidate.push({ path: agentsMd, type: 'agents' });
        }
        if (await fs.pathExists(configToml)) {
          filesToValidate.push({ path: configToml, type: 'config' });
        }

        // Find skill files
        const skillsDir = path.join(projectPath, '.agents', 'skills');
        if (await fs.pathExists(skillsDir)) {
          try {
            const skills = await fs.readdir(skillsDir);
            for (const skill of skills) {
              const skillPath = path.join(skillsDir, skill);
              const skillStats = await fs.stat(skillPath);
              if (skillStats.isDirectory()) {
                const skillMd = path.join(skillPath, 'SKILL.md');
                if (await fs.pathExists(skillMd)) {
                  filesToValidate.push({ path: skillMd, type: 'skill' });
                }
              }
            }
          } catch {
            // Ignore errors reading skills directory
          }
        }
      }

      if (filesToValidate.length === 0) {
        console.log(chalk.yellow('No files found to validate'));
        console.log(chalk.gray('Run `ruflo-codex init` to create a project'));
        return;
      }

      console.log(chalk.blue(`\nValidating ${filesToValidate.length} file(s)...\n`));

      let hasErrors = false;
      let hasWarnings = false;
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const file of filesToValidate) {
        let content: string;
        try {
          content = await fs.readFile(file.path, 'utf-8');
        } catch (error) {
          console.log(chalk.red(`  ! Cannot read: ${file.path}`));
          hasErrors = true;
          continue;
        }

        let result;

        switch (file.type) {
          case 'agents':
            result = await validateAgentsMd(content);
            break;
          case 'skill':
            result = await validateSkillMd(content);
            break;
          case 'config':
            result = await validateConfigToml(content);
            break;
        }

        const relativePath = path.relative(projectPath, file.path);

        if (result.valid && result.warnings.length === 0) {
          console.log(chalk.green(`  ${chalk.green.bold('PASS')} ${relativePath}`));
        } else if (result.valid) {
          console.log(chalk.yellow(`  ${chalk.yellow.bold('WARN')} ${relativePath}`));
          hasWarnings = true;
        } else {
          console.log(chalk.red(`  ${chalk.red.bold('FAIL')} ${relativePath}`));
          hasErrors = true;
        }

        for (const error of result.errors) {
          totalErrors++;
          const lineInfo = error.line ? chalk.gray(` (line ${error.line})`) : '';
          console.log(chalk.red(`       ${chalk.red('x')} ${error.message}${lineInfo}`));
        }

        for (const warning of result.warnings) {
          totalWarnings++;
          console.log(chalk.yellow(`       ${chalk.yellow('!')} ${warning.message}`));
          if (warning.suggestion) {
            console.log(chalk.gray(`         ${warning.suggestion}`));
          }
        }
      }

      // Summary
      console.log();
      if (hasErrors) {
        console.log(chalk.red.bold(`  ${totalErrors} error(s), ${totalWarnings} warning(s)`));
        process.exit(1);
      } else if (hasWarnings && options.strict) {
        console.log(chalk.yellow.bold(`  ${totalWarnings} warning(s) (strict mode)`));
        process.exit(1);
      } else if (hasWarnings) {
        console.log(chalk.yellow(`  All files valid with ${totalWarnings} warning(s)`));
      } else {
        console.log(chalk.green.bold('  All files valid!'));
      }
    } catch (error) {
      handleError(error, 'Validation failed');
    }
  });

// Templates command
program
  .command('templates')
  .alias('list-templates')
  .description('List available templates')
  .option('--json', 'Output as JSON', false)
  .action((options) => {
    try {
      const templates = listTemplates();

      if (options.json) {
        console.log(JSON.stringify(templates, null, 2));
        return;
      }

      printBanner();
      console.log(chalk.white.bold('Available templates:\n'));

      for (const template of templates) {
        console.log(chalk.cyan.bold(`  ${template.name}`));
        console.log(chalk.gray(`    ${template.description}`));
        console.log(chalk.gray(`    Skills: ${template.skillCount} included`));
        console.log();
      }

      console.log(chalk.gray('Use: ruflo-codex init --template <name>'));
      console.log();
    } catch (error) {
      handleError(error, 'Failed to list templates');
    }
  });

// Skills command
program
  .command('skills')
  .alias('list-skills')
  .description('List available built-in skills')
  .option('--json', 'Output as JSON', false)
  .action((options) => {
    try {
      if (options.json) {
        console.log(JSON.stringify(BUILT_IN_SKILLS, null, 2));
        return;
      }

      printBanner();
      console.log(chalk.white.bold('Built-in skills:\n'));

      for (const [name, info] of Object.entries(BUILT_IN_SKILLS)) {
        console.log(chalk.cyan(`  $${name}`));
        console.log(chalk.gray(`    ${info.description}`));
        console.log(chalk.gray(`    Category: ${info.category}`));
        console.log();
      }

      console.log(chalk.gray('Use: ruflo-codex generate-skill -n <name> to create a custom skill'));
      console.log();
    } catch (error) {
      handleError(error, 'Failed to list skills');
    }
  });

// Info command
program
  .command('info')
  .description('Show package information')
  .option('--json', 'Output as JSON', false)
  .action((options) => {
    try {
      if (options.json) {
        console.log(JSON.stringify(PACKAGE_INFO, null, 2));
        return;
      }

      console.log(chalk.cyan.bold('\n  Ruflo Codex'));
      console.log(chalk.gray('  ' + '='.repeat(40)));
      console.log(chalk.white(`  Version:     ${PACKAGE_INFO.version}`));
      console.log(chalk.white(`  Description: ${PACKAGE_INFO.description}`));
      console.log(chalk.white(`  Future:      ${PACKAGE_INFO.futureUmbrella} (umbrella package)`));
      console.log(chalk.white(`  Repository:  ${PACKAGE_INFO.repository}`));
      console.log(chalk.gray('  ' + '='.repeat(40)));
      console.log(chalk.gray('\n  Part of the coflow rebranding initiative'));
      console.log();
    } catch (error) {
      handleError(error, 'Failed to show info');
    }
  });

// Doctor command - check system health
program
  .command('doctor')
  .description('Check system health and dependencies')
  .action(async () => {
    try {
      printBanner();
      console.log(chalk.blue('Running health checks...\n'));

      const checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }> = [];

      // Check Node.js version
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
      if (nodeMajor >= 18) {
        checks.push({ name: 'Node.js', status: 'pass', message: `${nodeVersion} (>= 18 required)` });
      } else {
        checks.push({ name: 'Node.js', status: 'fail', message: `${nodeVersion} (>= 18 required)` });
      }

      // Check for AGENTS.md in current directory
      const agentsMdExists = await fs.pathExists(path.join(process.cwd(), 'AGENTS.md'));
      if (agentsMdExists) {
        checks.push({ name: 'AGENTS.md', status: 'pass', message: 'Found in current directory' });
      } else {
        checks.push({ name: 'AGENTS.md', status: 'warn', message: 'Not found - run init to create' });
      }

      // Check for .agents directory
      const agentsDir = await fs.pathExists(path.join(process.cwd(), '.agents'));
      if (agentsDir) {
        checks.push({ name: '.agents/', status: 'pass', message: 'Directory exists' });
      } else {
        checks.push({ name: '.agents/', status: 'warn', message: 'Not found - run init to create' });
      }

      // Check for config.toml
      const configExists = await fs.pathExists(path.join(process.cwd(), '.agents', 'config.toml'));
      if (configExists) {
        checks.push({ name: 'config.toml', status: 'pass', message: 'Found in .agents/' });
      } else {
        checks.push({ name: 'config.toml', status: 'warn', message: 'Not found' });
      }

      // Check for git
      try {
        const gitExists = await fs.pathExists(path.join(process.cwd(), '.git'));
        if (gitExists) {
          checks.push({ name: 'Git', status: 'pass', message: 'Repository detected' });
        } else {
          checks.push({ name: 'Git', status: 'warn', message: 'Not a git repository' });
        }
      } catch {
        checks.push({ name: 'Git', status: 'warn', message: 'Cannot check' });
      }

      // Print results
      let hasFailures = false;
      for (const check of checks) {
        const icon = check.status === 'pass' ? chalk.green('PASS')
          : check.status === 'warn' ? chalk.yellow('WARN')
          : chalk.red('FAIL');

        console.log(`  ${icon}  ${chalk.white(check.name)}`);
        console.log(chalk.gray(`       ${check.message}`));

        if (check.status === 'fail') {
          hasFailures = true;
        }
      }

      console.log();
      if (hasFailures) {
        console.log(chalk.red.bold('  Some checks failed'));
        process.exit(1);
      } else {
        console.log(chalk.green.bold('  All checks passed!'));
      }
      console.log();
    } catch (error) {
      handleError(error, 'Health check failed');
    }
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.gray(`Run ${chalk.white('ruflo-codex --help')} for available commands.`));
  process.exit(1);
});

// Parse and run
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  printBanner();
  program.outputHelp();
}
