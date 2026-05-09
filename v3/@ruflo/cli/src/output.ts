/**
 * V3 CLI Output Formatter — re-export shim (ADR-100, alpha.5).
 *
 * Authoritative source: @ruflo/cli-core/output. Was a byte-identical
 * 640-line copy. The OutputFormatter class and `output` instance plus all
 * helper exports flow through unchanged. Edit cli-core for behavior changes.
 */

export * from '@ruflo/cli-core/output';
