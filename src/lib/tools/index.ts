/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具系统入口
 * Tool System Entry Point
 * 
 * 导出所有工具相关的类型、定义和执行器
 * ═══════════════════════════════════════════════════════════════════════
 */

// 类型导出
export type {
  ToolDefinition,
  ToolParameter,
  ToolParamType,
  ToolCategory,
  ToolCallRequest,
  ToolResult,
  SecurityPolicy,
  SecurityCheckResult,
  ExecutionContext,
  ToolExecutor,
  AIToolCall,
  ToolCallMessage,
  ToolCallPlan,
  ToolCallStep,
  BatchExecutionRequest,
  BatchExecutionResult,
  ToolExecutionEvent,
  ToolUsageLog,
  GeneratedFile,
} from './types';

// 定义导出
export {
  ALL_TOOLS,
  TOOL_REGISTRY,
  TOOLS_BY_CATEGORY,
  FILESYSTEM_TOOLS,
  SYSTEM_TOOLS,
  CODE_TOOLS,
  WEB_TOOLS,
  SCREEN_TOOLS,
  APPLICATION_TOOLS,
  AUTOMATION_TOOLS,
  getToolDefinition,
  getToolsByCategory,
  getSafeTools,
  getDangerousTools,
} from './definitions';

// 引擎导出
export {
  ToolEngine,
  getToolEngine,
  resetToolEngine,
  DEFAULT_SECURITY_POLICY,
} from './engine';
