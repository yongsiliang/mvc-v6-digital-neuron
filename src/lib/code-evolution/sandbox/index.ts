/**
 * 沙箱系统 (L1)
 * 
 * 提供代码进化的安全执行环境
 */

export { SandboxManager } from './sandbox-manager';
export { TestExecutor, type EvolutionCandidate } from './test-executor';

// 类型重导出
export type {
  Sandbox,
  SandboxId,
  SandboxConfig,
  SandboxLimits,
  SandboxStatus,
  SandboxResult,
  Snapshot,
  SnapshotId,
} from '../types/core';

export type {
  TestSuite,
  TestSuiteResult,
  TestCase,
  TestResult,
} from '../types/core';
