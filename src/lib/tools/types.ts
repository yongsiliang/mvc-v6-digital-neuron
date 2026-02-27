/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具系统类型定义
 * Tool System Type Definitions
 * 
 * 定义工具调用、执行结果、安全策略等核心类型
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 基础类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 工具参数类型
 */
export type ToolParamType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file_path' | 'url';

/**
 * 工具参数定义
 */
export interface ToolParameter {
  name: string;
  displayName?: string;
  type: ToolParamType;
  description: string;
  required: boolean;
  default?: unknown;
  defaultValue?: unknown;
  enum?: string[];
  min?: number;
  max?: number;
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  /** 工具唯一标识 */
  name: string;
  /** 工具显示名称 */
  displayName: string;
  /** 工具描述 */
  description: string;
  /** 参数定义 */
  parameters: ToolParameter[];
  /** 危险等级：safe(安全) | moderate(中等) | dangerous(危险) */
  dangerLevel: 'safe' | 'moderate' | 'dangerous';
  /** 是否需要用户确认 */
  requiresConfirmation: boolean;
  /** 执行超时时间(毫秒) */
  timeout: number;
  /** 所属类别 */
  category: ToolCategory;
  /** 示例用法 */
  examples?: string[];
  /** 图标 */
  icon?: string;
}

/**
 * 工具类别
 */
export type ToolCategory = 
  | 'filesystem'    // 文件系统
  | 'system'        // 系统信息
  | 'code'          // 代码执行
  | 'web'           // 网络操作
  | 'screen'        // 屏幕操作
  | 'application'   // 应用控制
  | 'search'        // 搜索工具
  | 'database'      // 数据库操作
  | 'automation';   // 自动化脚本

// ─────────────────────────────────────────────────────────────────────
// 执行类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 工具调用请求
 */
export interface ToolCallRequest {
  /** 调用ID */
  id: string;
  /** 工具名称 */
  name: string;
  /** 参数 */
  arguments: Record<string, unknown>;
  /** 调用来源 */
  source: 'user' | 'ai' | 'system' | 'llm';
  /** 关联的对话ID */
  conversationId?: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  /** 调用ID */
  callId: string;
  /** 工具名称 */
  toolName: string;
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  output?: unknown;
  /** 错误信息 */
  error?: string;
  /** 执行时长(毫秒) */
  duration: number;
  /** 是否需要用户确认 */
  requiresConfirmation?: boolean;
  /** 确认提示信息 */
  confirmationMessage?: string;
  /** 时间戳 */
  timestamp: number;
  /** 安全警告 */
  securityWarnings?: string[];
  /** 生成的文件 */
  generatedFiles?: GeneratedFile[];
}

/**
 * 生成的文件
 */
export interface GeneratedFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

// ─────────────────────────────────────────────────────────────────────
// 安全类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 安全策略
 */
export interface SecurityPolicy {
  /** 允许的路径模式 */
  allowedPaths: string[];
  /** 禁止的路径模式 */
  blockedPaths: string[];
  /** 允许的命令 */
  allowedCommands: string[];
  /** 禁止的命令 */
  blockedCommands: string[];
  /** 允许的网络域名 */
  allowedDomains: string[];
  /** 最大文件大小(字节) */
  maxFileSize: number;
  /** 命令执行超时(毫秒) */
  commandTimeout: number;
  /** 是否允许删除文件 */
  allowDelete: boolean;
  /** 是否允许修改系统文件 */
  allowSystemModification: boolean;
}

/**
 * 安全检查结果
 */
export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 工具执行器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 工具执行器接口
 */
export interface ToolExecutor {
  /** 工具定义 */
  definition: ToolDefinition;
  /** 执行方法 */
  execute(params: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult>;
  /** 验证参数 */
  validateParams?(params: Record<string, unknown>): { valid: boolean; errors: string[] };
  /** 安全检查 */
  securityCheck?(params: Record<string, unknown>, policy: SecurityPolicy): Promise<SecurityCheckResult>;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  /** 工作目录 */
  workingDirectory: string;
  /** 用户ID */
  userId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 安全策略 */
  securityPolicy: SecurityPolicy;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 日志记录器 */
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

// ─────────────────────────────────────────────────────────────────────
// AI 工具调用类型
// ─────────────────────────────────────────────────────────────────────

/**
 * AI 工具调用格式 (与 LLM API 兼容)
 */
export interface AIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON 字符串
  };
}

/**
 * 工具调用消息 (用于对话)
 */
export interface ToolCallMessage {
  role: 'assistant' | 'user' | 'tool';
  content: string | null;
  tool_calls?: AIToolCall[];
  tool_call_id?: string;
  name?: string;
}

/**
 * 工具调用规划
 */
export interface ToolCallPlan {
  /** 规划ID */
  id: string;
  /** 目标描述 */
  goal: string;
  /** 步骤列表 */
  steps: ToolCallStep[];
  /** 预估时间 */
  estimatedTime?: number;
  /** 风险评估 */
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    concerns: string[];
  };
}

/**
 * 工具调用步骤
 */
export interface ToolCallStep {
  id: string;
  description: string;
  toolName: string;
  arguments: Record<string, unknown>;
  dependsOn?: string[];
  condition?: string;
  onFailure?: 'abort' | 'skip' | 'retry';
}

// ─────────────────────────────────────────────────────────────────────
// 批量执行
// ─────────────────────────────────────────────────────────────────────

/**
 * 批量执行请求
 */
export interface BatchExecutionRequest {
  id: string;
  calls: ToolCallRequest[];
  stopOnError: boolean;
  parallel: boolean;
}

/**
 * 批量执行结果
 */
export interface BatchExecutionResult {
  id: string;
  results: ToolResult[];
  success: boolean;
  totalDuration: number;
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 事件和日志
// ─────────────────────────────────────────────────────────────────────

/**
 * 工具执行事件
 */
export interface ToolExecutionEvent {
  type: 'started' | 'progress' | 'confirmation_required' | 'completed' | 'error';
  callId: string;
  toolName: string;
  timestamp: number;
  data?: {
    progress?: number;
    message?: string;
    result?: ToolResult;
    error?: string;
  };
}

/**
 * 工具使用日志
 */
export interface ToolUsageLog {
  id: string;
  timestamp: number;
  toolName: string;
  arguments: Record<string, unknown>;
  result: 'success' | 'error' | 'cancelled';
  duration: number;
  userId?: string;
  sessionId?: string;
  errorMessage?: string;
}
