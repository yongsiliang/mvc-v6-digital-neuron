/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工具执行引擎
 * Tool Execution Engine
 * 
 * 核心执行引擎，负责安全检查、权限验证、工具调用和结果处理
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomUUID } from 'crypto';
import * as path from 'path';
import type {
  ToolCallRequest,
  ToolResult,
  SecurityPolicy,
  SecurityCheckResult,
  ExecutionContext,
  ToolExecutor,
  ToolExecutionEvent,
  BatchExecutionRequest,
  BatchExecutionResult,
} from './types';
import { getToolDefinition, ALL_TOOLS } from './definitions';
import { createFilesystemExecutor } from './executors/filesystem';
import { createSystemExecutor } from './executors/system';
import { createCodeExecutor } from './executors/code';
import { createWebExecutor } from './executors/web';
import { createLocalExecutor } from './executors/local';

// ─────────────────────────────────────────────────────────────────────
// 默认安全策略
// ─────────────────────────────────────────────────────────────────────

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  // 允许的路径模式
  allowedPaths: [
    '/workspace/projects',
    '/workspace/projects/**',
    '/tmp',
    '/tmp/**',
    '/app/work',
    '/app/work/**',
  ],
  // 禁止的路径模式
  blockedPaths: [
    '/etc/**',
    '/root/**',
    '/.ssh/**',
    '/.env*',
    '**/secrets/**',
    '**/.git/**',
  ],
  // 允许的命令
  allowedCommands: [
    'ls', 'dir', 'cat', 'head', 'tail', 'grep', 'find',
    'git', 'npm', 'pnpm', 'node', 'python', 'python3',
    'echo', 'pwd', 'which', 'date', 'whoami',
    'mkdir', 'touch', 'cp', 'mv', 'rm',
  ],
  // 禁止的命令
  blockedCommands: [
    'rm -rf /',
    'sudo',
    'su',
    'chmod 777',
    'dd',
    'mkfs',
    'fdisk',
    '> /dev/',
    'curl | bash',
    'wget | bash',
  ],
  // 允许的网络域名
  allowedDomains: [
    '*.google.com',
    '*.github.com',
    '*.stackoverflow.com',
    '*.wikipedia.org',
    '*.npmjs.com',
    '*.pypi.org',
  ],
  // 最大文件大小 50MB
  maxFileSize: 50 * 1024 * 1024,
  // 命令超时 60秒
  commandTimeout: 60000,
  // 不允许删除文件（需要用户确认）
  allowDelete: false,
  // 不允许修改系统文件
  allowSystemModification: false,
};

// ─────────────────────────────────────────────────────────────────────
// 工具执行引擎类
// ─────────────────────────────────────────────────────────────────────

export class ToolEngine {
  private executors: Map<string, ToolExecutor> = new Map();
  private securityPolicy: SecurityPolicy;
  private eventListeners: Set<(event: ToolExecutionEvent) => void> = new Set();
  private logger: (message: string, level: 'info' | 'warn' | 'error') => void;

  constructor(
    securityPolicy: SecurityPolicy = DEFAULT_SECURITY_POLICY,
    logger?: (message: string, level: 'info' | 'warn' | 'error') => void
  ) {
    this.securityPolicy = securityPolicy;
    this.logger = logger || ((msg, level) => console[level](`[ToolEngine] ${msg}`));
    this.registerExecutors();
  }

  /**
   * 注册所有执行器
   */
  private registerExecutors(): void {
    // 文件系统执行器
    const fsExecutor = createFilesystemExecutor();
    FILESYSTEM_TOOL_NAMES.forEach(name => {
      this.executors.set(name, fsExecutor);
    });

    // 系统执行器
    const sysExecutor = createSystemExecutor();
    SYSTEM_TOOL_NAMES.forEach(name => {
      this.executors.set(name, sysExecutor);
    });

    // 代码执行器
    const codeExecutor = createCodeExecutor();
    CODE_TOOL_NAMES.forEach(name => {
      this.executors.set(name, codeExecutor);
    });

    // 网络执行器
    const webExecutor = createWebExecutor();
    WEB_TOOL_NAMES.forEach(name => {
      this.executors.set(name, webExecutor);
    });

    // 本地操作执行器（浏览器、应用、自动化、屏幕等）
    const localExecutor = createLocalExecutor();
    LOCAL_TOOL_NAMES.forEach(name => {
      this.executors.set(name, localExecutor);
    });

    this.logger(`已注册 ${this.executors.size} 个工具执行器`, 'info');
  }

  /**
   * 执行工具调用
   */
  async execute(request: ToolCallRequest, context: Partial<ExecutionContext> = {}): Promise<ToolResult> {
    const startTime = Date.now();
    const callId = request.id || randomUUID();

    // 获取工具定义
    const toolDef = getToolDefinition(request.name);
    if (!toolDef) {
      return {
        callId,
        toolName: request.name,
        success: false,
        error: `未知的工具: ${request.name}`,
        duration: 0,
        timestamp: Date.now(),
      };
    }

    // 发送开始事件
    this.emitEvent({
      type: 'started',
      callId,
      toolName: request.name,
      timestamp: startTime,
    });

    try {
      // 获取执行器
      const executor = this.executors.get(request.name);
      if (!executor) {
        throw new Error(`工具 ${request.name} 没有注册执行器`);
      }

      // 安全检查
      const securityResult = await this.performSecurityCheck(request, toolDef);
      if (!securityResult.allowed) {
        return {
          callId,
          toolName: request.name,
          success: false,
          error: `安全检查失败: ${securityResult.reason}`,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
          securityWarnings: securityResult.warnings,
        };
      }

      // 如果需要用户确认
      if (toolDef.requiresConfirmation || securityResult.requiresConfirmation) {
        this.emitEvent({
          type: 'confirmation_required',
          callId,
          toolName: request.name,
          timestamp: Date.now(),
          data: {
            message: this.generateConfirmationMessage(request, toolDef, securityResult),
          },
        });

        // 返回需要确认的结果
        return {
          callId,
          toolName: request.name,
          success: false,
          requiresConfirmation: true,
          confirmationMessage: this.generateConfirmationMessage(request, toolDef, securityResult),
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }

      // 构建执行上下文
      const executionContext: ExecutionContext = {
        workingDirectory: context.workingDirectory || process.cwd(),
        userId: context.userId,
        sessionId: context.sessionId,
        env: context.env || {},
        securityPolicy: this.securityPolicy,
        headers: context.headers,
        logger: this.logger,
      };

      // 参数验证
      if (executor.validateParams) {
        const validation = executor.validateParams(request.arguments);
        if (!validation.valid) {
          throw new Error(`参数验证失败: ${validation.errors.join(', ')}`);
        }
      }

      // 执行超时处理
      const timeout = toolDef.timeout || 30000;
      // 在参数中添加工具名称，供类别执行器使用
      const executionParams = {
        ...request.arguments,
        _toolName: request.name,
      };
      const result = await Promise.race([
        executor.execute(executionParams, executionContext),
        new Promise<ToolResult>((_, reject) =>
          setTimeout(() => reject(new Error(`执行超时 (${timeout}ms)`)), timeout)
        ),
      ]);

      // 发送完成事件
      this.emitEvent({
        type: 'completed',
        callId,
        toolName: request.name,
        timestamp: Date.now(),
        data: { result },
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger(`工具执行失败: ${request.name} - ${errorMessage}`, 'error');

      // 发送错误事件
      this.emitEvent({
        type: 'error',
        callId,
        toolName: request.name,
        timestamp: Date.now(),
        data: { error: errorMessage },
      });

      return {
        callId,
        toolName: request.name,
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 批量执行工具调用
   */
  async executeBatch(request: BatchExecutionRequest, context: Partial<ExecutionContext> = {}): Promise<BatchExecutionResult> {
    const startTime = Date.now();
    const results: ToolResult[] = [];
    const errors: string[] = [];

    if (request.parallel) {
      // 并行执行
      const promises = request.calls.map(call => this.execute(call, context));
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          if (!result.value.success && request.stopOnError) {
            errors.push(`步骤 ${index + 1} 失败: ${result.value.error}`);
          }
        } else {
          errors.push(`步骤 ${index + 1} 异常: ${result.reason}`);
          if (request.stopOnError) {
            // 停止后续执行
          }
        }
      });
    } else {
      // 串行执行
      for (const call of request.calls) {
        const result = await this.execute(call, context);
        results.push(result);
        
        if (!result.success && request.stopOnError) {
          errors.push(`工具 ${call.name} 执行失败: ${result.error}`);
          break;
        }
      }
    }

    return {
      id: request.id,
      results,
      success: errors.length === 0,
      totalDuration: Date.now() - startTime,
      errors,
    };
  }

  /**
   * 安全检查
   */
  private async performSecurityCheck(
    request: ToolCallRequest,
    toolDef: typeof ALL_TOOLS[0]
  ): Promise<SecurityCheckResult> {
    const warnings: string[] = [];
    let requiresConfirmation = false;
    let riskLevel: SecurityCheckResult['riskLevel'] = 'low';

    // 检查危险级别
    if (toolDef.dangerLevel === 'dangerous') {
      riskLevel = 'high';
      requiresConfirmation = true;
      warnings.push('此操作具有高风险，可能造成数据丢失或系统变更');
    } else if (toolDef.dangerLevel === 'moderate') {
      riskLevel = 'medium';
      if (!toolDef.requiresConfirmation) {
        warnings.push('此操作可能修改文件或系统状态');
      }
    }

    // 检查路径参数
    const pathArgs = ['path', 'destination', 'source', 'cwd'];
    for (const argName of pathArgs) {
      const rawPath = request.arguments[argName] as string | undefined;
      if (rawPath) {
        // 解析相对路径为绝对路径
        const resolvedPath = path.isAbsolute(rawPath) 
          ? path.normalize(rawPath)
          : path.resolve(process.cwd(), rawPath);
        
        // 检查是否在禁止路径中
        for (const blocked of this.securityPolicy.blockedPaths) {
          if (this.matchPath(resolvedPath, blocked)) {
            return {
              allowed: false,
              reason: `路径 ${rawPath} (解析为 ${resolvedPath}) 在禁止访问列表中`,
              requiresConfirmation: false,
              riskLevel: 'critical',
              warnings: ['尝试访问受保护的系统路径'],
            };
          }
        }
        // 检查是否在允许路径中
        const isAllowed = this.securityPolicy.allowedPaths.some(
          allowed => this.matchPath(resolvedPath, allowed)
        );
        if (!isAllowed && this.securityPolicy.allowedPaths.length > 0) {
          warnings.push(`路径 ${rawPath} (解析为 ${resolvedPath}) 不在预设的允许路径列表中`);
          requiresConfirmation = true;
        }
      }
    }

    // 检查命令参数
    if (request.arguments.command || request.arguments.script) {
      const cmd = String(request.arguments.command || request.arguments.script);
      
      // 检查禁止的命令
      for (const blocked of this.securityPolicy.blockedCommands) {
        if (cmd.toLowerCase().includes(blocked.toLowerCase())) {
          return {
            allowed: false,
            reason: `命令包含禁止的操作: ${blocked}`,
            requiresConfirmation: false,
            riskLevel: 'critical',
            warnings: ['尝试执行危险的系统命令'],
          };
        }
      }
    }

    // 检查删除操作
    if (request.name.includes('delete') && !this.securityPolicy.allowDelete) {
      requiresConfirmation = true;
      warnings.push('删除操作需要用户明确确认');
    }

    return {
      allowed: true,
      requiresConfirmation: requiresConfirmation || toolDef.requiresConfirmation,
      riskLevel,
      warnings,
    };
  }

  /**
   * 路径匹配
   */
  private matchPath(path: string, pattern: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    if (pattern.includes('**')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
      );
      return regex.test(normalizedPath);
    }
    if (pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '[^/]*') + '$'
      );
      return regex.test(normalizedPath);
    }
    return normalizedPath.startsWith(pattern) || normalizedPath === pattern;
  }

  /**
   * 生成确认消息
   */
  private generateConfirmationMessage(
    request: ToolCallRequest,
    toolDef: typeof ALL_TOOLS[0],
    securityResult: SecurityCheckResult
  ): string {
    const args = Object.entries(request.arguments)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(', ');
    
    let message = `确认执行: ${toolDef.displayName}\n\n`;
    message += `工具: ${request.name}\n`;
    message += `参数: ${args}\n\n`;
    
    if (securityResult.warnings.length > 0) {
      message += `⚠️ 警告:\n${securityResult.warnings.map(w => `• ${w}`).join('\n')}\n\n`;
    }
    
    if (toolDef.dangerLevel === 'dangerous') {
      message += '🔴 此操作不可撤销，请谨慎确认。';
    } else {
      message += '请确认是否继续执行？';
    }
    
    return message;
  }

  /**
   * 发送事件
   */
  private emitEvent(event: ToolExecutionEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        this.logger(`事件监听器错误: ${e}`, 'error');
      }
    });
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: (event: ToolExecutionEvent) => void): void {
    this.eventListeners.add(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: (event: ToolExecutionEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  /**
   * 获取所有可用工具
   */
  getAvailableTools(): typeof ALL_TOOLS {
    return ALL_TOOLS;
  }

  /**
   * 更新安全策略
   */
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy };
    this.logger('安全策略已更新', 'info');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工具名称常量
// ─────────────────────────────────────────────────────────────────────

const FILESYSTEM_TOOL_NAMES = [
  'fs_read_file', 'fs_list_directory', 'fs_search', 'fs_get_info',
  'fs_write_file', 'fs_append_file', 'fs_create_directory',
  'fs_copy', 'fs_move', 'fs_delete',
];

const SYSTEM_TOOL_NAMES = [
  'sys_info', 'sys_processes', 'sys_env', 'sys_execute',
];

const CODE_TOOL_NAMES = [
  'code_run_python', 'code_run_javascript', 'code_run_shell',
];

const WEB_TOOL_NAMES = [
  'web_fetch', 'web_search', 'web_download',
];

const LOCAL_TOOL_NAMES = [
  // 浏览器控制
  'web_open',
  // 应用控制
  'app_launch', 'app_list', 'app_window_list', 'app_window_focus',
  // 自动化
  'auto_type', 'auto_hotkey', 'auto_click', 'auto_script',
  // 屏幕操作
  'screen_capture', 'screen_analyze', 'screen_find_element',
  // 鼠标操作
  'mouse_move', 'mouse_click', 'mouse_drag', 'mouse_scroll',
  // 键盘操作
  'keyboard_type', 'keyboard_press', 'keyboard_hotkey',
  // 浏览器自动化
  'browser_navigate', 'browser_click', 'browser_type', 'browser_screenshot', 'browser_evaluate',
  // 自动化任务
  'automation_execute', 'automation_status', 'automation_stop',
  // 系统通知
  'sys_notify',
];

// ─────────────────────────────────────────────────────────────────────
// 单例实例
// ─────────────────────────────────────────────────────────────────────

let engineInstance: ToolEngine | null = null;

/**
 * 获取工具引擎实例
 */
export function getToolEngine(
  securityPolicy?: SecurityPolicy,
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void
): ToolEngine {
  if (!engineInstance) {
    engineInstance = new ToolEngine(securityPolicy, logger);
  }
  return engineInstance;
}

/**
 * 重置工具引擎实例（用于测试）
 */
export function resetToolEngine(): void {
  engineInstance = null;
}
