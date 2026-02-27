/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 安全检查器
 * 
 * 检查操作安全性，防止危险操作
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  AgentConfig,
  ISecurityChecker,
  AtomicAction,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';
import { SECURITY_POLICY, DANGEROUS_OPERATIONS } from '../constants';

export function createSecurityChecker(config: AgentConfig): ISecurityChecker {
  return new SecurityChecker(config);
}

class SecurityChecker implements ISecurityChecker {
  private config: AgentConfig;
  
  constructor(config: AgentConfig) {
    this.config = config;
  }
  
  async checkOperation(operation: AtomicAction): Promise<Result<boolean, AgentError>> {
    if (!this.config.enableSecurityCheck) {
      return success(true);
    }
    
    // 检查操作类型
    const checkResult = this.checkByType(operation);
    
    if (!checkResult.success) {
      return checkResult;
    }
    
    // 检查路径安全性
    if (operation.type === 'file' || operation.type === 'app') {
      const pathCheck = this.checkPath(operation);
      if (!pathCheck.success) {
        return pathCheck;
      }
    }
    
    return success(true);
  }
  
  requiresConfirmation(operation: AtomicAction): boolean {
    if (!this.config.confirmDangerousOperations) {
      return false;
    }
    
    const params = operation.params as Record<string, unknown>;
    
    // 文件删除
    if (params.operation === 'delete' || params.operation === 'remove') {
      return true;
    }
    
    // 系统操作
    if (params.operation === 'shutdown' || params.operation === 'restart') {
      return true;
    }
    
    // 敏感按键组合
    if (operation.type === 'keyboard') {
      const keys = (params.keys as string[]) || [];
      const keyStr = keys.join('+').toLowerCase();
      
      // 危险快捷键
      const dangerousHotkeys = [
        'ctrl+alt+delete',
        'alt+f4',
        'cmd+q',
        'ctrl+s', // 保存可能覆盖文件
      ];
      
      if (dangerousHotkeys.some(h => keyStr.includes(h))) {
        return true;
      }
    }
    
    // 应用启动 - 某些应用需要确认
    if (operation.type === 'app' && params.operation === 'launch') {
      const appName = (params.name as string)?.toLowerCase() || '';
      const sensitiveApps = ['terminal', 'cmd', 'powershell', 'registry'];
      if (sensitiveApps.some(a => appName.includes(a))) {
        return true;
      }
    }
    
    return false;
  }
  
  getConfirmationMessage(operation: AtomicAction): string {
    const params = operation.params as Record<string, unknown>;
    
    if (params.operation === 'delete') {
      return `⚠️ 即将删除文件: ${params.path || params.name}\n\n此操作不可撤销，是否继续？`;
    }
    
    if (params.operation === 'shutdown') {
      return '⚠️ 即将关闭/重启系统，是否继续？';
    }
    
    if (operation.type === 'keyboard') {
      return `⚠️ 即将执行快捷键: ${(params.keys as string[])?.join('+')}\n\n是否继续？`;
    }
    
    if (operation.type === 'app') {
      return `⚠️ 即将启动应用: ${params.name}\n\n是否继续？`;
    }
    
    return '⚠️ 此操作需要确认，是否继续？';
  }
  
  /**
   * 按类型检查
   */
  private checkByType(operation: AtomicAction): Result<boolean, AgentError> {
    const params = operation.params as Record<string, unknown>;
    
    switch (operation.type) {
      case 'file':
        return this.checkFileOperation(params);
        
      case 'app':
        return this.checkAppOperation(params);
        
      case 'mouse':
        // 鼠标操作一般安全
        return success(true);
        
      case 'keyboard':
        // 键盘操作检查危险组合
        return this.checkKeyboardOperation(params);
        
      default:
        return success(true);
    }
  }
  
  /**
   * 检查文件操作
   */
  private checkFileOperation(params: Record<string, unknown>): Result<boolean, AgentError> {
    const operation = params.operation as string;
    const path = params.path as string | undefined;
    
    // 检查是否在禁止路径
    if (path) {
      for (const blocked of SECURITY_POLICY.blockedPaths) {
        if (path.startsWith(blocked)) {
          return failure(createError(
            AgentErrorCode.PERMISSION_DENIED,
            `禁止访问路径: ${path}`,
            { details: { path, blockedPath: blocked } }
          ));
        }
      }
    }
    
    // 检查危险操作
    if (DANGEROUS_OPERATIONS.fileDelete.some(k => operation?.includes(k))) {
      // 允许但需要确认
      return success(true);
    }
    
    return success(true);
  }
  
  /**
   * 检查应用操作
   */
  private checkAppOperation(params: Record<string, unknown>): Result<boolean, AgentError> {
    const appName = (params.name as string)?.toLowerCase() || '';
    
    // 检查是否在允许列表（如果配置了的话）
    // 这里暂时允许所有应用
    
    return success(true);
  }
  
  /**
   * 检查键盘操作
   */
  private checkKeyboardOperation(params: Record<string, unknown>): Result<boolean, AgentError> {
    const keys = (params.keys as string[]) || [];
    const keyStr = keys.join('+').toLowerCase();
    
    // 禁止的操作
    const forbiddenPatterns = [
      'ctrl+alt+delete',  // 系统安全界面
      'ctrl+alt+del',
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (keyStr.includes(pattern)) {
        return failure(createError(
          AgentErrorCode.PERMISSION_DENIED,
          `禁止执行快捷键: ${keys.join('+')}`,
          { details: { keys } }
        ));
      }
    }
    
    return success(true);
  }
  
  /**
   * 检查路径安全性
   */
  private checkPath(operation: AtomicAction): Result<boolean, AgentError> {
    const params = operation.params as Record<string, unknown>;
    const path = (params.path as string) || (params.name as string);
    
    if (!path) {
      return success(true);
    }
    
    // 检查禁止路径
    for (const blocked of SECURITY_POLICY.blockedPaths) {
      if (path.toLowerCase().startsWith(blocked.toLowerCase())) {
        return failure(createError(
          AgentErrorCode.PERMISSION_DENIED,
          `禁止访问路径: ${path}`,
          { details: { path, blockedPath: blocked } }
        ));
      }
    }
    
    return success(true);
  }
}
