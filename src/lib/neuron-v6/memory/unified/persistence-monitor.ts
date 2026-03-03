/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - 持久化监控服务
 * 
 * 功能：
 * - 定期检查数据库连接状态
 * - 监控 S3 对象存储可用性
 * - 追踪持久化操作统计
 * - 提供健康状态报告
 * ═══════════════════════════════════════════════════════════════════════
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import { db } from '@/storage/index';
import { sql } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface DatabaseHealth {
  status: HealthStatus;
  latencyMs: number | null;
  connectionCount: number | null;
  lastCheckTime: number;
  errorMessage?: string;
}

export interface S3Health {
  status: HealthStatus;
  latencyMs: number | null;
  bucketAccessible: boolean;
  lastCheckTime: number;
  errorMessage?: string;
}

export interface PersistenceHealthReport {
  overall: HealthStatus;
  timestamp: number;
  database: DatabaseHealth;
  s3: S3Health;
  stats: PersistenceMonitorStats;
  recommendations: string[];
}

export interface PersistenceMonitorStats {
  /** 总保存次数 */
  totalSaves: number;
  
  /** 总加载次数 */
  totalLoads: number;
  
  /** 数据库写入次数 */
  dbWrites: number;
  
  /** S3 备份次数 */
  s3Backups: number;
  
  /** 失败次数 */
  failures: number;
  
  /** 平均延迟 (ms) */
  avgLatencyMs: number;
  
  /** 上次成功保存时间 */
  lastSaveTime: number | null;
  
  /** 待写入队列大小 */
  pendingWrites: number;
}

// ─────────────────────────────────────────────────────────────────────
// 监控服务类
// ─────────────────────────────────────────────────────────────────────

export class PersistenceMonitor {
  private s3Client: S3Storage | null = null;
  
  // 统计数据
  private stats: PersistenceMonitorStats = {
    totalSaves: 0,
    totalLoads: 0,
    dbWrites: 0,
    s3Backups: 0,
    failures: 0,
    avgLatencyMs: 0,
    lastSaveTime: null,
    pendingWrites: 0,
  };
  
  // 延迟记录（用于计算平均值）
  private latencyRecords: number[] = [];
  private maxLatencyRecords = 100;
  
  // 健康状态缓存
  private lastHealthCheck: PersistenceHealthReport | null = null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor() {
    // 初始化 S3 客户端
    try {
      if (process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME) {
        this.s3Client = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });
      }
    } catch (e) {
      console.warn('[PersistenceMonitor] S3 客户端初始化失败:', e);
    }
  }
  
  /**
   * 启动定期健康检查
   */
  startHealthCheck(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // 立即执行一次检查
    this.performHealthCheck();
    
    // 设置定期检查
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
    
    console.log(`[PersistenceMonitor] 健康检查已启动，间隔 ${intervalMs}ms`);
  }
  
  /**
   * 停止健康检查
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<PersistenceHealthReport> {
    const timestamp = Date.now();
    
    // 检查数据库
    const databaseHealth = await this.checkDatabaseHealth();
    
    // 检查 S3
    const s3Health = await this.checkS3Health();
    
    // 计算整体健康状态
    const overall = this.calculateOverallHealth(databaseHealth.status, s3Health.status);
    
    // 生成建议
    const recommendations = this.generateRecommendations(databaseHealth, s3Health);
    
    const report: PersistenceHealthReport = {
      overall,
      timestamp,
      database: databaseHealth,
      s3: s3Health,
      stats: { ...this.stats },
      recommendations,
    };
    
    this.lastHealthCheck = report;
    
    // 记录日志
    if (overall !== 'healthy') {
      console.warn(`[PersistenceMonitor] 健康检查结果: ${overall}`, {
        database: databaseHealth.status,
        s3: s3Health.status,
      });
    }
    
    return report;
  }
  
  /**
   * 获取最近的健康报告
   */
  getLastHealthReport(): PersistenceHealthReport | null {
    return this.lastHealthCheck;
  }
  
  /**
   * 检查数据库健康状态
   */
  private async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const lastCheckTime = startTime;
    
    try {
      // 执行简单查询测试连接
      await db.execute(sql`SELECT 1 as test`);
      
      const latencyMs = Date.now() - startTime;
      
      // 获取连接数（如果支持）
      let connectionCount: number | null = null;
      try {
        const connResult = await db.execute(sql`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `);
        if (connResult.rows[0]) {
          connectionCount = Number(connResult.rows[0].count);
        }
      } catch {
        // 忽略连接数查询失败
      }
      
      return {
        status: latencyMs < 1000 ? 'healthy' : 'degraded',
        latencyMs,
        connectionCount,
        lastCheckTime,
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      return {
        status: 'unhealthy',
        latencyMs: null,
        connectionCount: null,
        lastCheckTime,
        errorMessage,
      };
    }
  }
  
  /**
   * 检查 S3 健康状态
   */
  private async checkS3Health(): Promise<S3Health> {
    const startTime = Date.now();
    const lastCheckTime = startTime;
    
    if (!this.s3Client) {
      return {
        status: 'unhealthy',
        latencyMs: null,
        bucketAccessible: false,
        lastCheckTime,
        errorMessage: 'S3 客户端未配置',
      };
    }
    
    try {
      // 尝试列出文件来验证访问权限
      await this.s3Client.listFiles({
        prefix: 'unified-memory/',
        maxKeys: 1,
      });
      
      const latencyMs = Date.now() - startTime;
      
      return {
        status: latencyMs < 2000 ? 'healthy' : 'degraded',
        latencyMs,
        bucketAccessible: true,
        lastCheckTime,
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      return {
        status: 'unhealthy',
        latencyMs: null,
        bucketAccessible: false,
        lastCheckTime,
        errorMessage,
      };
    }
  }
  
  /**
   * 计算整体健康状态
   */
  private calculateOverallHealth(
    dbStatus: HealthStatus,
    s3Status: HealthStatus
  ): HealthStatus {
    if (dbStatus === 'unhealthy') {
      return 'unhealthy';
    }
    
    if (dbStatus === 'degraded' || s3Status === 'unhealthy') {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  /**
   * 生成优化建议
   */
  private generateRecommendations(
    database: DatabaseHealth,
    s3: S3Health
  ): string[] {
    const recommendations: string[] = [];
    
    if (database.status === 'unhealthy') {
      recommendations.push('数据库连接失败，请检查数据库配置和网络连接');
      recommendations.push('考虑启用降级模式，使用内存存储');
    } else if (database.status === 'degraded') {
      recommendations.push('数据库响应较慢，可能需要优化查询或增加连接池');
    }
    
    if (s3.status === 'unhealthy') {
      recommendations.push('S3 存储不可用，快照功能将无法使用');
      recommendations.push('检查 COZE_BUCKET_ENDPOINT_URL 和 COZE_BUCKET_NAME 环境变量');
    } else if (s3.status === 'degraded') {
      recommendations.push('S3 响应较慢，可能影响快照创建');
    }
    
    if (this.stats.failures > 10) {
      recommendations.push(`发现 ${this.stats.failures} 次持久化失败，建议检查日志`);
    }
    
    if (this.stats.pendingWrites > 100) {
      recommendations.push(`待写入队列积压 ${this.stats.pendingWrites} 条，考虑增加写入频率`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('所有系统运行正常');
    }
    
    return recommendations;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 统计记录方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 记录保存操作
   */
  recordSave(latencyMs: number, success: boolean): void {
    this.stats.totalSaves++;
    
    if (success) {
      this.stats.lastSaveTime = Date.now();
      this.recordLatency(latencyMs);
    } else {
      this.stats.failures++;
    }
  }
  
  /**
   * 记录加载操作
   */
  recordLoad(latencyMs: number, success: boolean): void {
    this.stats.totalLoads++;
    
    if (success) {
      this.recordLatency(latencyMs);
    } else {
      this.stats.failures++;
    }
  }
  
  /**
   * 记录数据库写入
   */
  recordDbWrite(latencyMs: number, success: boolean): void {
    this.stats.dbWrites++;
    
    if (!success) {
      this.stats.failures++;
    } else {
      this.recordLatency(latencyMs);
    }
  }
  
  /**
   * 记录 S3 备份
   */
  recordS3Backup(latencyMs: number, success: boolean): void {
    this.stats.s3Backups++;
    
    if (!success) {
      this.stats.failures++;
    } else {
      this.recordLatency(latencyMs);
    }
  }
  
  /**
   * 更新待写入队列大小
   */
  updatePendingWrites(count: number): void {
    this.stats.pendingWrites = count;
  }
  
  /**
   * 记录延迟
   */
  private recordLatency(latencyMs: number): void {
    this.latencyRecords.push(latencyMs);
    
    if (this.latencyRecords.length > this.maxLatencyRecords) {
      this.latencyRecords.shift();
    }
    
    // 计算平均延迟
    const sum = this.latencyRecords.reduce((a, b) => a + b, 0);
    this.stats.avgLatencyMs = Math.round(sum / this.latencyRecords.length);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): PersistenceMonitorStats {
    return { ...this.stats };
  }
  
  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalSaves: 0,
      totalLoads: 0,
      dbWrites: 0,
      s3Backups: 0,
      failures: 0,
      avgLatencyMs: 0,
      lastSaveTime: null,
      pendingWrites: 0,
    };
    this.latencyRecords = [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例实例
// ─────────────────────────────────────────────────────────────────────

let defaultMonitor: PersistenceMonitor | null = null;

/**
 * 获取默认监控实例
 */
export function getPersistenceMonitor(): PersistenceMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new PersistenceMonitor();
  }
  return defaultMonitor;
}

/**
 * 创建新的监控实例
 */
export function createPersistenceMonitor(): PersistenceMonitor {
  return new PersistenceMonitor();
}
