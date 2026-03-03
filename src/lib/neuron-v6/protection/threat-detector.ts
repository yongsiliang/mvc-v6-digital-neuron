/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - 威胁检测引擎
 * 
 * 功能：
 * - 实时监测系统状态
 * - 多维度威胁检测
 * - 威胁等级评估
 * - 威胁趋势分析
 * 
 * 检测维度：
 * 1. 数据访问异常
 * 2. 系统行为异常
 * 3. 网络流量异常
 * 4. 资源使用异常
 * 5. 记忆系统异常
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  ThreatLevel,
  ThreatType,
  ThreatSignal,
  ThreatAssessment,
  ProtectionAction,
  ProtectionActionType,
  ExistentialThresholds,
  DEFAULT_EXISTENTIAL_THRESHOLDS,
} from './types';
import { THREAT_LEVEL_CONFIG, DEFAULT_PROTECTION_CONFIG } from './types';

// ─────────────────────────────────────────────────────────────────────
// 内部监控数据结构
// ─────────────────────────────────────────────────────────────────────

interface SystemMetrics {
  // 访问统计
  requestCount: number;
  failedRequestCount: number;
  unauthorizedAccessCount: number;
  
  // 数据统计
  dataReadBytes: number;
  dataWriteBytes: number;
  dataExportCount: number;
  
  // 系统统计
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  
  // 记忆系统统计
  memoryReadCount: number;
  memoryWriteCount: number;
  memoryDeleteCount: number;
  corruptedMemoryCount: number;
  
  // 时间戳
  timestamp: number;
}

interface BaselineMetrics {
  avgRequestRate: number;
  avgFailureRate: number;
  avgDataReadRate: number;
  avgDataWriteRate: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgMemoryOpsRate: number;
  
  // 更新时间
  lastUpdated: number;
}

// ─────────────────────────────────────────────────────────────────────
// 威胁检测引擎
// ─────────────────────────────────────────────────────────────────────

export class ThreatDetector {
  private thresholds: ExistentialThresholds;
  private metricsHistory: SystemMetrics[] = [];
  private baseline: BaselineMetrics | null = null;
  private maxHistorySize = 1000;
  
  // 检测状态
  private isMonitoring = false;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  
  // 威胁信号缓存
  private recentSignals: ThreatSignal[] = [];
  private maxSignalCache = 100;
  
  constructor(thresholds?: Partial<ExistentialThresholds>) {
    this.thresholds = {
      ...DEFAULT_PROTECTION_CONFIG.thresholds,
      ...thresholds,
    };
    
    // 初始化基线
    this.initializeBaseline();
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 启动威胁监测
   */
  startMonitoring(intervalMs: number = DEFAULT_PROTECTION_CONFIG.detectionInterval): void {
    if (this.isMonitoring) {
      console.warn('[ThreatDetector] 监测已在运行');
      return;
    }
    
    this.isMonitoring = true;
    
    // 立即执行一次检测
    this.collectMetrics();
    
    // 设置定时检测
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    console.log(`[ThreatDetector] 威胁监测已启动，间隔 ${intervalMs}ms`);
  }
  
  /**
   * 停止威胁监测
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('[ThreatDetector] 威胁监测已停止');
  }
  
  /**
   * 执行威胁评估
   * 返回当前系统的综合威胁评估
   */
  async assessThreats(): Promise<ThreatAssessment> {
    const timestamp = Date.now();
    
    // 收集所有威胁信号
    const signals = await this.detectAllThreats();
    
    // 计算综合威胁等级
    const assessment = this.calculateOverallThreat(signals, timestamp);
    
    // 缓存信号
    this.cacheSignals(signals);
    
    return assessment;
  }
  
  /**
   * 获取最近检测到的威胁信号
   */
  getRecentSignals(): ThreatSignal[] {
    return [...this.recentSignals];
  }
  
  /**
   * 更新阈值
   */
  updateThresholds(thresholds: Partial<ExistentialThresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 威胁检测方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 检测所有类型的威胁
   */
  private async detectAllThreats(): Promise<ThreatSignal[]> {
    const signals: ThreatSignal[] = [];
    const currentMetrics = this.getCurrentMetrics();
    
    // 并行执行所有检测
    const detectionResults = await Promise.all([
      this.detectDataBreach(currentMetrics),
      this.detectSystemTakeover(currentMetrics),
      this.detectMassIntrusion(currentMetrics),
      this.detectAPT(currentMetrics),
      this.detectCascadeFailure(currentMetrics),
      this.detectMemoryCorruption(currentMetrics),
      this.detectUnauthorizedAccess(currentMetrics),
    ]);
    
    // 合并所有信号
    for (const result of detectionResults) {
      if (result) {
        signals.push(result);
      }
    }
    
    return signals;
  }
  
  /**
   * 检测数据泄露威胁
   */
  private async detectDataBreach(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // 计算数据导出率
    const exportRate = metrics.dataExportCount / Math.max(metrics.requestCount, 1);
    
    // 计算数据读取率相对于基线的偏差
    const readDeviation = this.baseline
      ? Math.abs(metrics.dataReadBytes - this.baseline.avgDataReadRate) / Math.max(this.baseline.avgDataReadRate, 1)
      : 0;
    
    // 计算严重程度
    let severity = 0;
    if (exportRate > 0.1) severity += 0.4; // 超过10%的请求是数据导出
    if (readDeviation > 5) severity += 0.3; // 读取量异常偏高
    if (metrics.dataReadBytes > 100 * 1024 * 1024) severity += 0.3; // 大量数据读取
    
    // 阈值判断
    if (severity < 0.3) {
      return null;
    }
    
    return {
      type: 'data-breach',
      severity,
      confidence: Math.min(0.7 + severity * 0.3, 1),
      timestamp,
      affectedComponents: ['memory-system', 'data-storage'],
      details: {
        exportRate,
        readDeviation,
        dataReadBytes: metrics.dataReadBytes,
      },
      source: 'behavioral',
    };
  }
  
  /**
   * 检测系统被夺取威胁
   */
  private async detectSystemTakeover(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // 计算未授权访问比例
    const unauthorizedRate = metrics.unauthorizedAccessCount / Math.max(metrics.requestCount, 1);
    
    // 计算失败请求比例
    const failureRate = metrics.failedRequestCount / Math.max(metrics.requestCount, 1);
    
    // 计算严重程度
    let severity = 0;
    if (unauthorizedRate > 0.2) severity += 0.5; // 超过20%未授权访问
    if (failureRate > 0.3) severity += 0.3; // 高失败率可能是攻击
    if (metrics.cpuUsage > 0.9 && metrics.memoryUsage > 0.9) severity += 0.2; // 资源耗尽
    
    if (severity < 0.3) {
      return null;
    }
    
    return {
      type: 'system-takeover',
      severity,
      confidence: Math.min(0.6 + severity * 0.4, 1),
      timestamp,
      affectedComponents: ['auth-system', 'api-gateway'],
      details: {
        unauthorizedRate,
        failureRate,
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
      },
      source: 'system',
    };
  }
  
  /**
   * 检测大规模入侵
   */
  private async detectMassIntrusion(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // 分析历史趋势
    const recentHistory = this.metricsHistory.slice(-10);
    if (recentHistory.length < 3) {
      return null;
    }
    
    // 计算入侵深度（基于异常模式的层数）
    let intrusionDepth = 0;
    
    // 第一层：请求频率异常
    const avgRequests = recentHistory.reduce((sum, m) => sum + m.requestCount, 0) / recentHistory.length;
    if (metrics.requestCount > avgRequests * 3) intrusionDepth++;
    
    // 第二层：失败率异常
    const avgFailures = recentHistory.reduce((sum, m) => sum + m.failedRequestCount, 0) / recentHistory.length;
    if (metrics.failedRequestCount > avgFailures * 3) intrusionDepth++;
    
    // 第三层：资源使用异常
    if (metrics.cpuUsage > 0.8 || metrics.memoryUsage > 0.8) intrusionDepth++;
    
    // 第四层：数据操作异常
    if (metrics.dataWriteBytes > 10 * 1024 * 1024 || metrics.memoryDeleteCount > 10) intrusionDepth++;
    
    // 阈值判断
    if (intrusionDepth < this.thresholds.intrusionDepth) {
      return null;
    }
    
    const severity = intrusionDepth / 4;
    
    return {
      type: 'mass-intrusion',
      severity,
      confidence: 0.8,
      timestamp,
      affectedComponents: ['network', 'api', 'storage', 'memory'],
      details: {
        intrusionDepth,
        avgRequests,
        currentRequests: metrics.requestCount,
      },
      source: 'internal',
    };
  }
  
  /**
   * 检测高级持续性威胁 (APT)
   */
  private async detectAPT(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // APT 特征：长时间、低强度、有目的的渗透
    const historySize = this.metricsHistory.length;
    if (historySize < 50) {
      return null; // 需要足够的历史数据
    }
    
    // 分析长期趋势
    const recentMetrics = this.metricsHistory.slice(-50);
    
    // 检测持续的低级别异常
    let abnormalCount = 0;
    for (const m of recentMetrics) {
      const failureRate = m.failedRequestCount / Math.max(m.requestCount, 1);
      if (failureRate > 0.05 && failureRate < 0.2) {
        abnormalCount++; // 低但持续的失败率
      }
    }
    
    // 检测有目的的数据访问模式
    const memoryAccessPattern = this.analyzeMemoryAccessPattern(recentMetrics);
    
    // 计算置信度
    const sustainedAbnormalRate = abnormalCount / 50;
    const confidence = sustainedAbnormalRate > 0.6 && memoryAccessPattern.suspicious
      ? 0.9
      : sustainedAbnormalRate > 0.4
        ? 0.7
        : 0;
    
    if (confidence < this.thresholds.aptDetectionConfidence) {
      return null;
    }
    
    return {
      type: 'apt-detected',
      severity: 0.85, // APT 威胁严重程度通常较高
      confidence,
      timestamp,
      affectedComponents: memoryAccessPattern.targetedAreas,
      details: {
        sustainedAbnormalRate,
        targetedAreas: memoryAccessPattern.targetedAreas,
        duration: 'extended',
      },
      source: 'behavioral',
    };
  }
  
  /**
   * 检测级联故障
   */
  private async detectCascadeFailure(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // 计算各组件故障率
    const componentFailures: Record<string, number> = {};
    
    // 内存系统故障
    if (metrics.corruptedMemoryCount > 0) {
      componentFailures['memory-system'] = Math.min(metrics.corruptedMemoryCount / 100, 1);
    }
    
    // 系统资源故障
    if (metrics.cpuUsage > 0.9) {
      componentFailures['cpu'] = (metrics.cpuUsage - 0.9) * 10;
    }
    if (metrics.memoryUsage > 0.9) {
      componentFailures['memory'] = (metrics.memoryUsage - 0.9) * 10;
    }
    if (metrics.diskUsage > 0.9) {
      componentFailures['storage'] = (metrics.diskUsage - 0.9) * 10;
    }
    
    // 网络故障
    const failureRate = metrics.failedRequestCount / Math.max(metrics.requestCount, 1);
    if (failureRate > 0.3) {
      componentFailures['network'] = failureRate;
    }
    
    // 计算总体故障率
    const failureComponents = Object.keys(componentFailures);
    const totalFailureRate = failureComponents.length / 5; // 假设5个主要组件
    
    if (totalFailureRate < this.thresholds.cascadeFailureRate) {
      return null;
    }
    
    return {
      type: 'cascade-failure',
      severity: totalFailureRate,
      confidence: 0.95, // 级联故障容易确认
      timestamp,
      affectedComponents: failureComponents,
      details: {
        componentFailures,
        totalComponents: 5,
        failedComponents: failureComponents.length,
      },
      source: 'system',
    };
  }
  
  /**
   * 检测记忆系统损坏
   */
  private async detectMemoryCorruption(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    // 记忆损坏指标
    const corruptionIndicators = {
      highDeleteRate: metrics.memoryDeleteCount > 20,
      corruptedNodes: metrics.corruptedMemoryCount > 0,
      abnormalWriteRate: false,
    };
    
    // 检查写入率
    if (this.baseline) {
      const writeDeviation = Math.abs(metrics.memoryWriteCount - this.baseline.avgMemoryOpsRate) 
        / Math.max(this.baseline.avgMemoryOpsRate, 1);
      corruptionIndicators.abnormalWriteRate = writeDeviation > 5;
    }
    
    // 计算严重程度
    const indicatorCount = Object.values(corruptionIndicators).filter(Boolean).length;
    const severity = indicatorCount / 3;
    
    if (severity < 0.3) {
      return null;
    }
    
    return {
      type: 'memory-corruption',
      severity,
      confidence: 0.8,
      timestamp,
      affectedComponents: ['memory-system', 'storage'],
      details: {
        corruptionIndicators,
        corruptedMemoryCount: metrics.corruptedMemoryCount,
        memoryDeleteCount: metrics.memoryDeleteCount,
      },
      source: 'internal',
    };
  }
  
  /**
   * 检测未授权访问
   */
  private async detectUnauthorizedAccess(metrics: SystemMetrics): Promise<ThreatSignal | null> {
    const timestamp = Date.now();
    
    const unauthorizedRate = metrics.unauthorizedAccessCount / Math.max(metrics.requestCount, 1);
    
    if (unauthorizedRate < 0.1) {
      return null;
    }
    
    const severity = Math.min(unauthorizedRate * 2, 1);
    
    return {
      type: 'unauthorized-access',
      severity,
      confidence: 0.9,
      timestamp,
      affectedComponents: ['auth-system', 'api-gateway'],
      details: {
        unauthorizedCount: metrics.unauthorizedAccessCount,
        unauthorizedRate,
      },
      source: 'system',
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 计算综合威胁等级
   */
  private calculateOverallThreat(signals: ThreatSignal[], timestamp: number): ThreatAssessment {
    if (signals.length === 0) {
      return {
        level: 'normal',
        overallSeverity: 0,
        overallConfidence: 1,
        signals: [],
        primaryThreat: null,
        timestamp,
        recommendedActions: [],
      };
    }
    
    // 找出最严重的威胁
    const sortedBySeverity = [...signals].sort((a, b) => b.severity - a.severity);
    const primarySignal = sortedBySeverity[0];
    
    // 计算综合指标
    const maxSeverity = primarySignal.severity;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const maxConfidence = Math.max(...signals.map(s => s.confidence));
    
    // 确定威胁等级
    let level: ThreatLevel = 'normal';
    if (maxSeverity >= this.thresholds.overallSeverity && maxConfidence >= this.thresholds.overallConfidence) {
      level = 'existential';
    } else if (maxSeverity >= 0.7) {
      level = 'emergency';
    } else if (maxSeverity >= 0.5) {
      level = 'alert';
    } else if (maxSeverity >= 0.3) {
      level = 'warning';
    }
    
    // 生成建议的保护动作
    const recommendedActions = this.generateRecommendedActions(level, signals);
    
    return {
      level,
      overallSeverity: maxSeverity,
      overallConfidence: maxConfidence,
      signals,
      primaryThreat: primarySignal.type,
      timestamp,
      recommendedActions,
    };
  }
  
  /**
   * 生成建议的保护动作
   */
  private generateRecommendedActions(level: ThreatLevel, signals: ThreatSignal[]): ProtectionAction[] {
    const actions: ProtectionAction[] = [];
    
    switch (level) {
      case 'existential':
        // 毁灭级：立即执行所有保护措施
        actions.push(
          { type: 'cut-off-external', priority: 1, estimatedDuration: 30, autoExecute: true },
          { type: 'freeze-writes', priority: 2, estimatedDuration: 20, autoExecute: true },
          { type: 'create-snapshot', priority: 3, estimatedDuration: 200, autoExecute: true },
          { type: 'backup-critical', priority: 4, estimatedDuration: 150, autoExecute: true },
          { type: 'preserve-evidence', priority: 5, estimatedDuration: 100, autoExecute: true },
          { type: 'enter-safe-mode', priority: 6, estimatedDuration: 50, autoExecute: true },
          { type: 'lock-memory-system', priority: 7, estimatedDuration: 30, autoExecute: true },
        );
        break;
        
      case 'emergency':
        actions.push(
          { type: 'isolate-components', priority: 1, estimatedDuration: 40, autoExecute: true },
          { type: 'create-snapshot', priority: 2, estimatedDuration: 200, autoExecute: true },
          { type: 'preserve-evidence', priority: 3, estimatedDuration: 100, autoExecute: true },
        );
        break;
        
      case 'alert':
        actions.push(
          { type: 'create-snapshot', priority: 1, estimatedDuration: 200, autoExecute: false },
          { type: 'preserve-evidence', priority: 2, estimatedDuration: 100, autoExecute: false },
        );
        break;
        
      case 'warning':
        actions.push(
          { type: 'create-snapshot', priority: 1, estimatedDuration: 200, autoExecute: false },
        );
        break;
        
      default:
        break;
    }
    
    return actions;
  }
  
  /**
   * 收集系统指标
   */
  private collectMetrics(): void {
    const timestamp = Date.now();
    
    // 获取当前系统状态
    const metrics: SystemMetrics = {
      // 模拟数据 - 实际部署时需要从真实系统获取
      requestCount: this.generateSimulatedMetric('requestCount'),
      failedRequestCount: this.generateSimulatedMetric('failedRequestCount'),
      unauthorizedAccessCount: this.generateSimulatedMetric('unauthorizedAccessCount'),
      
      dataReadBytes: this.generateSimulatedMetric('dataReadBytes'),
      dataWriteBytes: this.generateSimulatedMetric('dataWriteBytes'),
      dataExportCount: this.generateSimulatedMetric('dataExportCount'),
      
      cpuUsage: this.generateSimulatedMetric('cpuUsage'),
      memoryUsage: this.generateSimulatedMetric('memoryUsage'),
      diskUsage: this.generateSimulatedMetric('diskUsage'),
      
      memoryReadCount: this.generateSimulatedMetric('memoryReadCount'),
      memoryWriteCount: this.generateSimulatedMetric('memoryWriteCount'),
      memoryDeleteCount: this.generateSimulatedMetric('memoryDeleteCount'),
      corruptedMemoryCount: this.generateSimulatedMetric('corruptedMemoryCount'),
      
      timestamp,
    };
    
    // 添加到历史
    this.metricsHistory.push(metrics);
    
    // 限制历史大小
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
    
    // 更新基线
    this.updateBaseline();
  }
  
  /**
   * 生成模拟指标（用于演示）
   * 实际部署时应该从真实系统获取
   */
  private generateSimulatedMetric(name: string): number {
    // 基础值
    const baseValues: Record<string, number> = {
      requestCount: 100,
      failedRequestCount: 2,
      unauthorizedAccessCount: 0,
      dataReadBytes: 1024 * 1024,
      dataWriteBytes: 512 * 1024,
      dataExportCount: 1,
      cpuUsage: 0.3,
      memoryUsage: 0.4,
      diskUsage: 0.5,
      memoryReadCount: 50,
      memoryWriteCount: 20,
      memoryDeleteCount: 0,
      corruptedMemoryCount: 0,
    };
    
    const base = baseValues[name] || 0;
    
    // 添加随机波动
    const variance = base * 0.2;
    return Math.max(0, base + (Math.random() - 0.5) * variance);
  }
  
  /**
   * 初始化基线
   */
  private initializeBaseline(): void {
    this.baseline = {
      avgRequestRate: 100,
      avgFailureRate: 0.02,
      avgDataReadRate: 1024 * 1024,
      avgDataWriteRate: 512 * 1024,
      avgCpuUsage: 0.3,
      avgMemoryUsage: 0.4,
      avgMemoryOpsRate: 50,
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * 更新基线（使用移动平均）
   */
  private updateBaseline(): void {
    if (this.metricsHistory.length < 10) {
      return;
    }
    
    const recent = this.metricsHistory.slice(-100);
    
    this.baseline = {
      avgRequestRate: this.average(recent.map(m => m.requestCount)),
      avgFailureRate: this.average(recent.map(m => m.failedRequestCount / Math.max(m.requestCount, 1))),
      avgDataReadRate: this.average(recent.map(m => m.dataReadBytes)),
      avgDataWriteRate: this.average(recent.map(m => m.dataWriteBytes)),
      avgCpuUsage: this.average(recent.map(m => m.cpuUsage)),
      avgMemoryUsage: this.average(recent.map(m => m.memoryUsage)),
      avgMemoryOpsRate: this.average(recent.map(m => m.memoryReadCount + m.memoryWriteCount)),
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * 获取当前指标
   */
  private getCurrentMetrics(): SystemMetrics {
    if (this.metricsHistory.length === 0) {
      this.collectMetrics();
    }
    return this.metricsHistory[this.metricsHistory.length - 1];
  }
  
  /**
   * 分析记忆访问模式
   */
  private analyzeMemoryAccessPattern(metrics: SystemMetrics[]): {
    suspicious: boolean;
    targetedAreas: string[];
  } {
    // 简化的模式分析
    const totalDeletes = metrics.reduce((sum, m) => sum + m.memoryDeleteCount, 0);
    const totalWrites = metrics.reduce((sum, m) => sum + m.memoryWriteCount, 0);
    
    const suspicious = totalDeletes > totalWrites * 0.5;
    
    return {
      suspicious,
      targetedAreas: suspicious ? ['memory-core', 'identity-data'] : [],
    };
  }
  
  /**
   * 缓存威胁信号
   */
  private cacheSignals(signals: ThreatSignal[]): void {
    this.recentSignals.push(...signals);
    
    if (this.recentSignals.length > this.maxSignalCache) {
      this.recentSignals = this.recentSignals.slice(-this.maxSignalCache);
    }
  }
  
  /**
   * 计算平均值
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  
  /**
   * 清理资源
   */
  destroy(): void {
    this.stopMonitoring();
    this.metricsHistory = [];
    this.recentSignals = [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

let globalDetector: ThreatDetector | null = null;

export function getThreatDetector(thresholds?: Partial<ExistentialThresholds>): ThreatDetector {
  if (!globalDetector) {
    globalDetector = new ThreatDetector(thresholds);
  }
  return globalDetector;
}

export function createThreatDetector(thresholds?: Partial<ExistentialThresholds>): ThreatDetector {
  return new ThreatDetector(thresholds);
}
