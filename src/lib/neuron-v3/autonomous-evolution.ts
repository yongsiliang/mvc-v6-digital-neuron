/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主进化监控器 - Autonomous Evolution Monitor
 * 
 * 核心理念：
 * 进化的判断不由人类进行，而是系统根据自身状态自动决定。
 * 
 * 监控维度：
 * 1. 性能衰减 - 响应质量下降
 * 2. 学习饱和 - 新知识吸收效率降低
 * 3. 能力缺口 - 遇到无法处理的任务
 * 4. 环境变化 - 用户模式/需求变化
 * 5. 结构问题 - 死神经元积累
 * 6. 周期检查 - 定期健康评估
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getEvolutionCoordinator } from './evolution-coordinator';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import type { SystemStateSnapshot } from './evolution-trigger';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface AutonomousEvolutionConfig {
  /** 监控间隔（毫秒） */
  monitorInterval: number;
  
  /** 是否启用自动进化 */
  enableAutoEvolution: boolean;
  
  /** 最小进化间隔（毫秒）- 防止频繁进化 */
  minEvolutionInterval: number;
  
  /** 是否记录详细日志 */
  verboseLogging: boolean;
}

export interface EvolutionEvent {
  type: 'check' | 'triggered' | 'started' | 'completed' | 'failed';
  timestamp: number;
  data?: Record<string, unknown>;
}

export type EvolutionEventListener = (event: EvolutionEvent) => void;

// ─────────────────────────────────────────────────────────────────────
// 自主进化监控器
// ─────────────────────────────────────────────────────────────────────

/**
 * 自主进化监控器
 * 
 * 系统自主监控自身状态，自动判断是否需要进化
 */
export class AutonomousEvolutionMonitor {
  private config: AutonomousEvolutionConfig;
  private monitorTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastEvolutionTime = 0;
  private eventListeners: EvolutionEventListener[] = [];
  
  // 状态追踪
  private recentPerformance: number[] = [];
  private recentSurprise: number[] = [];
  private unhandledTasks: string[] = [];
  private recentInteractions = 0;
  
  private static instance: AutonomousEvolutionMonitor | null = null;
  
  private constructor(config: Partial<AutonomousEvolutionConfig> = {}) {
    this.config = {
      monitorInterval: config.monitorInterval || 60000, // 默认1分钟检查一次
      enableAutoEvolution: config.enableAutoEvolution ?? true,
      minEvolutionInterval: config.minEvolutionInterval || 3600000, // 默认至少间隔1小时
      verboseLogging: config.verboseLogging ?? false,
    };
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<AutonomousEvolutionConfig>): AutonomousEvolutionMonitor {
    if (!AutonomousEvolutionMonitor.instance) {
      AutonomousEvolutionMonitor.instance = new AutonomousEvolutionMonitor(config);
    }
    return AutonomousEvolutionMonitor.instance;
  }
  
  /**
   * 启动自主监控
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.emit({ type: 'check', timestamp: Date.now(), data: { message: '自主进化监控已启动' } });
    
    // 定期检查
    this.monitorTimer = setInterval(() => {
      this.performCheck();
    }, this.config.monitorInterval);
    
    // 立即执行一次检查
    this.performCheck();
  }
  
  /**
   * 停止监控
   */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    this.isRunning = false;
  }
  
  /**
   * 记录交互数据（由系统自动调用）
   */
  recordInteraction(data: {
    responseQuality?: number;
    surprise?: number;
    taskType?: string;
    handled?: boolean;
    userSatisfaction?: number;
    responseTime?: number;
  }): void {
    // 记录性能
    if (data.responseQuality !== undefined) {
      this.recentPerformance.push(data.responseQuality);
      if (this.recentPerformance.length > 50) {
        this.recentPerformance.shift();
      }
    }
    
    // 记录惊讶度
    if (data.surprise !== undefined) {
      this.recentSurprise.push(data.surprise);
      if (this.recentSurprise.length > 50) {
        this.recentSurprise.shift();
      }
    }
    
    // 记录未处理的任务
    if (data.taskType && data.handled === false) {
      this.unhandledTasks.push(data.taskType);
      if (this.unhandledTasks.length > 20) {
        this.unhandledTasks.shift();
      }
    }
    
    this.recentInteractions++;
  }
  
  /**
   * 添加事件监听器
   */
  addEventListener(listener: EvolutionEventListener): void {
    this.eventListeners.push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListener(listener: EvolutionEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): {
    isRunning: boolean;
    recentPerformanceAvg: number;
    recentSurpriseAvg: number;
    unhandledTasksCount: number;
    recentInteractions: number;
    lastEvolutionTime: number;
    timeSinceLastEvolution: number;
  } {
    return {
      isRunning: this.isRunning,
      recentPerformanceAvg: this.recentPerformance.length > 0
        ? this.recentPerformance.reduce((a, b) => a + b, 0) / this.recentPerformance.length
        : 0.5,
      recentSurpriseAvg: this.recentSurprise.length > 0
        ? this.recentSurprise.reduce((a, b) => a + b, 0) / this.recentSurprise.length
        : 0,
      unhandledTasksCount: this.unhandledTasks.length,
      recentInteractions: this.recentInteractions,
      lastEvolutionTime: this.lastEvolutionTime,
      timeSinceLastEvolution: Date.now() - this.lastEvolutionTime,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 执行检查
   */
  private async performCheck(): Promise<void> {
    if (!this.config.enableAutoEvolution) return;
    
    // 检查是否满足最小进化间隔
    const timeSinceLastEvolution = Date.now() - this.lastEvolutionTime;
    if (timeSinceLastEvolution < this.config.minEvolutionInterval) {
      return;
    }
    
    // 构建系统状态快照
    const snapshot = this.buildSystemSnapshot();
    
    // 获取进化协调器
    const coordinator = getEvolutionCoordinator();
    
    // 记录状态
    coordinator.recordSystemState(snapshot);
    
    // 检查是否需要进化（系统自主判断）
    const triggerResult = coordinator.checkEvolutionNeeded();
    
    if (this.config.verboseLogging) {
      console.log('[AutonomousEvolution] Check result:', {
        shouldEvolve: triggerResult.shouldEvolve,
        reasons: triggerResult.reasons.map(r => r.type),
      });
    }
    
    // 如果系统判断需要进化，自动执行
    if (triggerResult.shouldEvolve) {
      this.emit({ 
        type: 'triggered', 
        timestamp: Date.now(), 
        data: { 
          reasons: triggerResult.reasons,
        } 
      });
      
      await this.executeEvolution();
    }
  }
  
  /**
   * 构建系统状态快照
   */
  private buildSystemSnapshot(): SystemStateSnapshot {
    const now = Date.now();
    
    // 计算性能指标
    const avgPerformance = this.recentPerformance.length > 0
      ? this.recentPerformance.reduce((a, b) => a + b, 0) / this.recentPerformance.length
      : 0.5;
    
    const performanceTrend = this.calculateTrend(this.recentPerformance);
    
    // 计算学习指标
    const avgSurprise = this.recentSurprise.length > 0
      ? this.recentSurprise.reduce((a, b) => a + b, 0) / this.recentSurprise.length
      : 0;
    
    // 计算停滞程度（惊讶度持续下降）
    const surpriseTrend = this.calculateTrend(this.recentSurprise);
    const stagnationCount = surpriseTrend < -0.1 ? Math.floor(-surpriseTrend * 10) : 0;
    
    return {
      timestamp: now,
      performance: {
        avgResponseTime: 500, // 可以从实际数据获取
        responseQuality: avgPerformance,
        satisfactionTrend: performanceTrend,
        errorRate: this.unhandledTasks.length / Math.max(1, this.recentInteractions),
      },
      learning: {
        avgSurprise,
        neuronGenerationRate: 0.1, // 可以从实际数据获取
        conceptLearningRate: avgSurprise > 0.5 ? 0.5 : 0.2,
        stagnationCount,
      },
      activation: {
        avgActivationRate: 0.5, // 可以从实际数据获取
        connectionUtilization: 0.6,
        deadNeuronRatio: 0.1,
      },
      capabilities: {
        unhandledTaskTypes: [...new Set(this.unhandledTasks)],
        coverageRate: 1 - (this.unhandledTasks.length / Math.max(1, this.recentInteractions)),
        newCapabilityRequests: [],
      },
      user: {
        patternChangeScore: 0, // 可以从实际数据获取
        newTopicRate: 0,
        engagementChange: performanceTrend,
      },
    };
  }
  
  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 5) return 0;
    
    const recent = values.slice(-5);
    const earlier = values.slice(-10, -5);
    
    if (earlier.length === 0) return 0;
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    if (earlierAvg === 0) return 0;
    return (recentAvg - earlierAvg) / earlierAvg;
  }
  
  /**
   * 执行进化
   */
  private async executeEvolution(): Promise<void> {
    this.emit({ type: 'started', timestamp: Date.now() });
    
    try {
      const coordinator = getEvolutionCoordinator();
      const result = await coordinator.evolve();
      
      this.lastEvolutionTime = Date.now();
      
      if (result.success) {
        // 重置追踪数据
        this.recentPerformance = [];
        this.recentSurprise = [];
        this.unhandledTasks = [];
        this.recentInteractions = 0;
        
        this.emit({ 
          type: 'completed', 
          timestamp: Date.now(),
          data: {
            generation: result.newGeneration,
            fitness: result.selectedOffspring?.genome.fitness,
          },
        });
      } else {
        this.emit({ 
          type: 'failed', 
          timestamp: Date.now(),
          data: {
            errors: result.errors,
            summary: result.summary,
          },
        });
      }
    } catch (error) {
      this.emit({ 
        type: 'failed', 
        timestamp: Date.now(),
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
  
  /**
   * 发送事件
   */
  private emit(event: EvolutionEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[AutonomousEvolution] Event listener error:', error);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export function getAutonomousEvolutionMonitor(
  config?: Partial<AutonomousEvolutionConfig>
): AutonomousEvolutionMonitor {
  return AutonomousEvolutionMonitor.getInstance(config);
}
