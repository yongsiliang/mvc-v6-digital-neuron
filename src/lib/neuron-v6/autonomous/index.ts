/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识系统 - 导出
 * Autonomous Consciousness System - Exports
 * ═══════════════════════════════════════════════════════════════════════
 */

export { AutonomousConsciousness } from './core';
export type { AutonomousResponse, ReasoningStep, AutonomousConfig } from './core';

export { ToolRegistry, BUILTIN_TOOLS } from './tools';
export type { 
  ToolDefinition, 
  ToolParameter, 
  ToolResult, 
  ToolExecutor 
} from './tools';

export { createExecutors } from './executors';
export type { ExecutorContext } from './executors';

// 动态工具系统
export { DynamicToolManager, CREATE_TOOL_DEFINITION } from './dynamic-tools';
export type { ToolCreationRequest } from './dynamic-tools';

// 桌面系统工具
export { DESKTOP_TOOLS, APP_ALIASES, createDesktopExecutors, isTauri } from './desktop-tools';
