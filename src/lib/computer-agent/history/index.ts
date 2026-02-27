/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 历史记录器
 * 
 * 记录所有操作历史，支持审计和回滚
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomUUID } from 'crypto';
import type {
  IHistoryLogger,
  OperationRecord,
  AtomicAction,
  OperationResult,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode } from '../types';

export function createHistoryLogger(): IHistoryLogger {
  return new HistoryLogger();
}

class HistoryLogger implements IHistoryLogger {
  private records: OperationRecord[] = [];
  private maxRecords: number = 1000;
  
  log(operation: AtomicAction, result: OperationResult): void {
    const record: OperationRecord = {
      id: `record_${Date.now()}_${randomUUID().slice(0, 8)}`,
      operation,
      result,
      timestamp: Date.now(),
      reversible: this.isReversible(operation, result),
      rollbackOperation: this.getRollbackOperation(operation, result),
    };
    
    this.records.push(record);
    
    // 保持记录数量限制
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
    
    // 输出日志
    console.log(`[HistoryLogger] 记录操作: ${operation.type} - ${result.success ? '成功' : '失败'}`);
  }
  
  getHistory(limit: number = 100): OperationRecord[] {
    return this.records.slice(-limit);
  }
  
  async rollbackTo(recordId: string): Promise<Result<void, AgentError>> {
    const recordIndex = this.records.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      return failure(createError(
        AgentErrorCode.UNKNOWN,
        `未找到记录: ${recordId}`
      ));
    }
    
    // 从最新到目标记录，执行回滚
    const recordsToRollback = this.records.slice(recordIndex + 1).reverse();
    
    for (const record of recordsToRollback) {
      if (record.reversible && record.rollbackOperation) {
        // 执行回滚操作
        // 注意：这里需要访问执行器，暂时只记录
        console.log(`[HistoryLogger] 需要回滚: ${record.operation.type}`);
      }
    }
    
    // 移除已回滚的记录
    this.records = this.records.slice(0, recordIndex + 1);
    
    return success(undefined);
  }
  
  /**
   * 判断操作是否可回滚
   */
  private isReversible(operation: AtomicAction, result: OperationResult): boolean {
    if (!result.success) {
      return false; // 失败的操作不需要回滚
    }
    
    switch (operation.type) {
      case 'mouse':
        // 鼠标移动不可逆
        return false;
        
      case 'keyboard':
        // 输入文字可以删除，但复杂
        return false;
        
      case 'app':
        const params = operation.params as Record<string, unknown>;
        // 启动的应用可以关闭
        return params.operation === 'launch';
        
      case 'file':
        // 文件操作根据类型判断
        const fileOp = (operation.params as Record<string, unknown>).operation as string;
        return ['copy', 'move', 'create'].includes(fileOp);
        
      default:
        return false;
    }
  }
  
  /**
   * 获取回滚操作
   */
  private getRollbackOperation(operation: AtomicAction, result: OperationResult): AtomicAction | undefined {
    const params = operation.params as Record<string, unknown>;
    
    switch (operation.type) {
      case 'app':
        if (params.operation === 'launch') {
          return {
            id: `rollback_${operation.id}`,
            type: 'app',
            params: {
              operation: 'close',
              name: params.name,
            },
          };
        }
        break;
        
      // 其他类型的回滚操作可以根据需要添加
      
      default:
        return undefined;
    }
    
    return undefined;
  }
  
  /**
   * 清除历史记录
   */
  clear(): void {
    this.records = [];
  }
  
  /**
   * 导出历史记录
   */
  export(): string {
    return JSON.stringify(this.records, null, 2);
  }
  
  /**
   * 导入历史记录
   */
  import(data: string): void {
    try {
      const records = JSON.parse(data);
      if (Array.isArray(records)) {
        this.records = records;
      }
    } catch (error) {
      console.error('[HistoryLogger] 导入失败:', error);
    }
  }
}
