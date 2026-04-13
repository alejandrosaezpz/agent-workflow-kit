#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import {
  type OpenCodeInstallScope,
  opencodeWorkflowAdapter,
} from "./index";

export interface InstallOptions {
  scope: OpenCodeInstallScope;
  cwd: string;
}

export interface InstallResult {
  scope: OpenCodeInstallScope;
  rootDir: string;
  configPath: string;
  copiedFiles: string[];
}

export function installOpenCodeAdapter(options: InstallOptions): InstallResult {
  const packageRoot = resolve(__dirname, "../../..");
  const rootDir =
    options.scope === "global"
      ? join(homedir(), ".config", "opencode")
      : join(options.cwd, ".opencode");
  const configPath =
    options.scope === "global"
      ? join(rootDir, opencodeWorkflowAdapter.configInjection.targetFile)
      : join(options.cwd, opencodeWorkflowAdapter.configInjection.targetFile);

  mkdirSync(rootDir, { recursive: true });

  const copiedFiles: string[] = [];

  for (const managedFile of opencodeWorkflowAdapter.managedFiles) {
    if (
      managedFile.type === "config-fragment" ||
      managedFile.type === "example-config"
    ) {
      continue;
    }

    const sourcePath = join(packageRoot, managedFile.source);
    const targetPath = join(rootDir, managedFile.target);

    copyManagedPath(sourcePath, targetPath);
    copiedFiles.push(targetPath);
  }

  const mergedConfig = buildMergedConfig(packageRoot, rootDir, configPath);

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2) + "\n", "utf8");

  return {
    scope: options.scope,
    rootDir,
    configPath,
    copiedFiles,
  };
}

function copyManagedPath(sourcePath: string, targetPath: string): void {
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

function buildMergedConfig(
  packageRoot: string,
  rootDir: string,
  configPath: string,
): Record<string, unknown> {
  const currentConfig = existsSync(configPath) ? readJsonFile(configPath) : {};
  const normalizedCurrentConfig = removeLegacyWorkflowKeys(currentConfig);
  const fragmentPath = join(packageRoot, "adapters/opencode/assets/opencode.workflow.json");
  const fragmentConfig = readJsonFile(fragmentPath);
  const relativeInstructionsPath = toPortableRelativePath(
    dirname(configPath),
    join(rootDir, "agent-workflow-kit", "workflow-instructions.md"),
  );

  const merged = deepMerge(normalizedCurrentConfig, fragmentConfig);
  const instructions = ensureStringArray((merged as { instructions?: unknown }).instructions);

  if (!instructions.includes(relativeInstructionsPath)) {
    instructions.push(relativeInstructionsPath);
  }

  return {
    ...merged,
    instructions,
  };
}

function removeLegacyWorkflowKeys(config: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...config };
  delete normalized.agentWorkflowKit;
  return normalized;
}

function readJsonFile(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON file: ${filePath}`);
  }
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }

    result[key] = overrideValue;
  }

  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPortableRelativePath(fromDir: string, targetPath: string): string {
  const relative = targetPath.startsWith(fromDir)
    ? targetPath.slice(fromDir.length + 1)
    : targetPath;
  return relative.split("\\").join("/");
}

function parseScope(argv: string[]): OpenCodeInstallScope {
  const scopeFlag = argv.find((arg) => arg.startsWith("--scope="));
  const scope = scopeFlag?.split("=", 2)[1];

  if (scope === "project") {
    return "project";
  }

  return "global";
}

function main(): void {
  const result = installOpenCodeAdapter({
    scope: parseScope(process.argv.slice(2)),
    cwd: process.cwd(),
  });

  console.log(`Installed Agent Workflow Kit into ${result.rootDir}`);
  console.log(`Updated config: ${result.configPath}`);
  console.log("Installed files:");

  for (const filePath of result.copiedFiles) {
    console.log(`- ${filePath}`);
  }
}

if (require.main === module) {
  main();
}
