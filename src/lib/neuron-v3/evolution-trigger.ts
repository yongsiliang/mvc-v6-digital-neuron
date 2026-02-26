/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化触发器 - Evolution Trigger
 * 
 * 核心功能：
 * 1. 监控系统状态，判断是否需要进化
 * 2. 多维度评估：性能、学习饱和、能力缺口、环境变化
 * 3. 自动触发进化流程
 * 
 * 进化触发条件：
 * - 性能下降：响应质量降低、用户满意度下降
 * - 学习饱和：长期无新学习、神经元激活停滞
 * - 能力缺口：检测到无法处理的任务类型
 * - 环境变化：用户偏好明显改变
 * - 周期性：达到进化周期阈值
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 系统状态快照
 */
export interface SystemStateSnapshot {
  /** 时间戳 */
  timestamp: number;
  
  /** 性能指标 */
  performance: {
    /** 平均响应时间（毫秒） */
    avgResponseTime: number;
    
    /** 响应质量评分 [0, 1] */
    responseQuality: number;
    
    /** 用户满意度趋势 [-1, 1] */
    satisfactionTrend: number;
    
    /** 错误率 [0, 1] */
    errorRate: number;
  };
  
  /** 学习指标 */
  learning: {
    /** 最近N次交互的平均惊讶度 */
    avgSurprise: number;
    
    /** 新神经元生成率 */
    neuronGenerationRate: number;
    
    /** 概念学习率 */
    conceptLearningRate: number;
    
    /** 学习停滞次数 */
    stagnationCount: number;
  };
  
  /** 激活指标 */
  activation: {
    /** 神经元平均激活率 */
    avgActivationRate: number;
    
    /** 连接利用率 */
    connectionUtilization: number;
    
    /** 死神经元比例 */
    deadNeuronRatio: number;
  };
  
  /** 能力指标 */
  capabilities: {
    /** 未处理的任务类型 */
    unhandledTaskTypes: string[];
    
    /** 能力覆盖率 [0, 1] */
    coverageRate: number;
    
    /** 新能力需求列表 */
    newCapabilityRequests: string[];
  };
  
  /** 用户指标 */
  user: {
    /** 用户互动模式变化度 */
    patternChangeScore: number;
    
    /** 新话题出现率 */
    newTopicRate: number;
    
    /** 用户参与度变化 */
    engagementChange: number;
  };
}

/**
 * 进化触发原因
 */
export type EvolutionTriggerReason =
  | 'performance_decline'     // 性能下降
  | 'learning_saturation'     // 学习饱和
  | 'capability_gap'          // 能力缺口
  | 'environment_change'      // 环境变化
  | 'periodic'                // 周期性进化
  | 'manual'                  // 手动触发
  | 'dead_neuron_accumulation' // 死神经元积累
  | 'user_request';           // 用户请求

/**
 * 进化触发结果
 */
export interface EvolutionTriggerResult {
  /** 是否应该触发进化 */
  shouldEvolve: boolean;
  
  /** 触发原因列表 */
  reasons: Array<{
    type: EvolutionTriggerReason;
    severity: number;  // 严重程度 [0, 1]
    description: string;
    metrics: Record<string, number>;
  }>;
  
  /** 推荐的进化强度 */
  recommendedIntensity: 'minor' | 'moderate' | 'major';
  
  /** 当前系统健康评分 [0, 1] */
  systemHealthScore: number;
  
  /** 建议 */
  suggestions: string[];
}

/**
 * 触发阈值配置
 */
export interface TriggerThresholds {
  // 性能阈值
  maxResponseTime: number;         // 最大响应时间（毫秒）
  minResponseQuality: number;      // 最小响应质量
  maxErrorRate: number;            // 最大错误率
  
  // 学习阈值
  minSurprise: number;             // 最小惊讶度（低于此值认为学习饱和）
  maxStagnationCount: number;      // 最大停滞次数
  
  // 激活阈值
  minActivationRate: number;       // 最小激活率
  maxDeadNeuronRatio: number;      // 最大死神经元比例
  
  // 能力阈值
  minCoverageRate: number;         // 最小能力覆盖率
  
  // 进化周期
  minEvolutionInterval: number;    // 最小进化间隔（毫秒）
  maxEvolutionInterval: number;    // 最大进化间隔（毫秒）
}

const DEFAULT_THRESHOLDS: TriggerThresholds = {
  maxResponseTime: 3000,
  minResponseQuality: 0.6,
  maxErrorRate: 0.1,
  
  minSurprise: 0.1,
  maxStagnationCount: 100,
  
  minActivationRate: 0.3,
  maxDeadNeuronRatio: 0.2,
  
  minCoverageRate: 0.7,
  
  minEvolutionInterval: 24 * 60 * 60 * 1000,  // 1天
  maxEvolutionInterval: 7 * 24 * 60 * 60 * 1000,  // 1周
};

// ─────────────────────────────────────────────────────────────────────
// 进化触发器
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化触发器
 */
export class EvolutionTrigger {
  private thresholds: TriggerThresholds;
  private stateHistory: SystemStateSnapshot[] = [];
  private lastEvolutionTime: number = 0;
  private maxHistoryLength = 100;
  
  constructor(thresholds: Partial<TriggerThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }
  
  /**
   * 记录系统状态
   */
  recordState(state: SystemStateSnapshot): void {
    this.stateHistory.push(state);
    
    // 限制历史长度
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory = this.stateHistory.slice(-this.maxHistoryLength);
    }
  }
  
  /**
   * 评估是否应该进化
   */
  evaluate(): EvolutionTriggerResult {
    const reasons: EvolutionTriggerResult['reasons'] = [];
    const suggestions: string[] = [];
    
    // 获取最新状态
    const currentState = this.stateHistory[this.stateHistory.length - 1];
    if (!currentState) {
      return {
        shouldEvolve: false,
        reasons: [],
        recommendedIntensity: 'minor',
        systemHealthScore: 1,
        suggestions: ['系统状态数据不足，无法评估'],
      };
    }
    
    // 1. 检查性能下降
    const performanceIssue = this.checkPerformanceDecline(currentState);
    if (performanceIssue) {
      reasons.push(performanceIssue);
      suggestions.push('性能下降，建议优化响应机制');
    }
    
    // 2. 检查学习饱和
    const learningIssue = this.checkLearningSaturation(currentState);
    if (learningIssue) {
      reasons.push(learningIssue);
      suggestions.push('学习饱和，需要探索新的学习方向');
    }
    
    // 3. 检查能力缺口
    const capabilityIssue = this.checkCapabilityGap(currentState);
    if (capabilityIssue) {
      reasons.push(capabilityIssue);
      suggestions.push(`检测到能力缺口: ${currentState.capabilities.unhandledTaskTypes.join(', ')}`);
    }
    
    // 4. 检查环境变化
    const environmentIssue = this.checkEnvironmentChange(currentState);
    if (environmentIssue) {
      reasons.push(environmentIssue);
      suggestions.push('用户互动模式发生变化，需要适应');
    }
    
    // 5. 检查死神经元积累
    const deadNeuronIssue = this.checkDeadNeuronAccumulation(currentState);
    if (deadNeuronIssue) {
      reasons.push(deadNeuronIssue);
      suggestions.push('存在较多无效神经元，需要清理和优化');
    }
    
    // 6. 检查周期性进化
    const periodicIssue = this.checkPeriodicEvolution();
    if (periodicIssue) {
      reasons.push(periodicIssue);
      suggestions.push('达到进化周期，建议进行常规进化');
    }
    
    // 计算系统健康评分
    const healthScore = this.calculateHealthScore(currentState);
    
    // 决定进化强度
    const intensity = this.determineIntensity(reasons, healthScore);
    
    // 决定是否进化
    const shouldEvolve = reasons.length > 0 && (
      healthScore < 0.6 ||
      reasons.some(r => r.severity > 0.7) ||
      reasons.some(r => r.type === 'periodic' && healthScore < 0.8)
    );
    
    return {
      shouldEvolve,
      reasons,
      recommendedIntensity: intensity,
      systemHealthScore: healthScore,
      suggestions,
    };
  }
  
  /**
   * 记录进化完成
   */
  recordEvolution(): void {
    this.lastEvolutionTime = Date.now();
  }
  
  /**
   * 获取状态历史
   */
  getStateHistory(): SystemStateSnapshot[] {
    return [...this.stateHistory];
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有检查方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查性能下降
   */
  private checkPerformanceDecline(state: SystemStateSnapshot): EvolutionTriggerResult['reasons'][0] | null {
    const { performance } = state;
    
    let severity = 0;
    const metrics: Record<string, number> = {};
    
    // 响应时间过长
    if (performance.avgResponseTime > this.thresholds.maxResponseTime) {
      severity += 0.3;
      metrics.responseTime = performance.avgResponseTime;
    }
    
    // 响应质量下降
    if (performance.responseQuality < this.thresholds.minResponseQuality) {
      severity += 0.4;
      metrics.responseQuality = performance.responseQuality;
    }
    
    // 错误率过高
    if (performance.errorRate > this.thresholds.maxErrorRate) {
      severity += 0.3;
      metrics.errorRate = performance.errorRate;
    }
    
    // 满意度下降趋势
    if (performance.satisfactionTrend < -0.3) {
      severity += 0.2;
      metrics.satisfactionTrend = performance.satisfactionTrend;
    }
    
    if (severity > 0) {
      return {
        type: 'performance_decline',
        severity: Math.min(1, severity),
        description: `系统性能下降: 响应质量 ${(performance.responseQuality * 100).toFixed(0)}%, 错误率 ${(performance.errorRate * 100).toFixed(0)}%`,
        metrics,
      };
    }
    
    return null;
  }
  
  /**
   * 检查学习饱和
   */
  private checkLearningSaturation(state: SystemStateSnapshot): EvolutionTriggerResult['reasons'][0] | null {
    const { learning } = state;
    
    let severity = 0;
    const metrics: Record<string, number> = {};
    
    // 惊讶度过低
    if (learning.avgSurprise < this.thresholds.minSurprise) {
      severity += 0.4;
      metrics.avgSurprise = learning.avgSurprise;
    }
    
    // 停滞次数过多
    if (learning.stagnationCount > this.thresholds.maxStagnationCount) {
      severity += 0.3;
      metrics.stagnationCount = learning.stagnationCount;
    }
    
    // 神经元生成率和概念学习率都很低
    if (learning.neuronGenerationRate < 0.01 && learning.conceptLearningRate < 0.01) {
      severity += 0.3;
      metrics.neuronGenerationRate = learning.neuronGenerationRate;
      metrics.conceptLearningRate = learning.conceptLearningRate;
    }
    
    if (severity > 0) {
      return {
        type: 'learning_saturation',
        severity: Math.min(1, severity),
        description: `学习饱和: 平均惊讶度 ${learning.avgSurprise.toFixed(3)}, 停滞次数 ${learning.stagnationCount}`,
        metrics,
      };
    }
    
    return null;
  }
  
  /**
   * 检查能力缺口
   */
  private checkCapabilityGap(state: SystemStateSnapshot): EvolutionTriggerResult['reasons'][0] | null {
    const { capabilities } = state;
    
    let severity = 0;
    const metrics: Record<string, number> = {};
    
    // 能力覆盖率不足
    if (capabilities.coverageRate < this.thresholds.minCoverageRate) {
      severity += 0.4;
      metrics.coverageRate = capabilities.coverageRate;
    }
    
    // 存在未处理的任务类型
    if (capabilities.unhandledTaskTypes.length > 0) {
      severity += Math.min(0.5, capabilities.unhandledTaskTypes.length * 0.1);
      metrics.unhandledCount = capabilities.unhandledTaskTypes.length;
    }
    
    // 有新能力请求
    if (capabilities.newCapabilityRequests.length > 0) {
      severity += 0.2;
      metrics.newRequests = capabilities.newCapabilityRequests.length;
    }
    
    if (severity > 0) {
      return {
        type: 'capability_gap',
        severity: Math.min(1, severity),
        description: `能力缺口: 覆盖率 ${(capabilities.coverageRate * 100).toFixed(0)}%, 未处理类型 ${capabilities.unhandledTaskTypes.length}个`,
        metrics,
      };
    }
    
    return null;
  }
  
  /**
   * 检查环境变化
   */
  private checkEnvironmentChange(state: SystemStateSnapshot): EvolutionTriggerResult['reasons'][0] | null {
    const { user } = state;
    
    let severity = 0;
    const metrics: Record<string, number> = {};
    
    // 用户互动模式变化
    if (user.patternChangeScore > 0.5) {
      severity += 0.4;
      metrics.patternChangeScore = user.patternChangeScore;
    }
    
    // 新话题出现率高
    if (user.newTopicRate > 0.3) {
      severity += 0.3;
      metrics.newTopicRate = user.newTopicRate;
    }
    
    // 参与度变化明显
    if (Math.abs(user.engagementChange) > 0.3) {
      severity += 0.3;
      metrics.engagementChange = user.engagementChange;
    }
    
    if (severity > 0) {
      return {
        type: 'environment_change',
        severity: Math.min(1, severity),
        description: `环境变化: 模式变化 ${user.patternChangeScore.toFixed(2)}, 新话题率 ${(user.newTopicRate * 100).toFixed(0)}%`,
        metrics,
      };
    }
    
    return null;
  }
  
  /**
   * 检查死神经元积累
   */
  private checkDeadNeuronAccumulation(state: SystemStateSnapshot): EvolutionTriggerResult['reasons'][0] | null {
    const { activation } = state;
    
    if (activation.deadNeuronRatio > this.thresholds.maxDeadNeuronRatio) {
      return {
        type: 'dead_neuron_accumulation',
        severity: activation.deadNeuronRatio,
        description: `死神经元比例过高: ${(activation.deadNeuronRatio * 100).toFixed(0)}%`,
        metrics: { deadNeuronRatio: activation.deadNeuronRatio },
      };
    }
    
    // 激活率过低
    if (activation.avgActivationRate < this.thresholds.minActivationRate) {
      return {
        type: 'dead_neuron_accumulation',
        severity: 1 - activation.avgActivationRate,
        description: `神经元激活率过低: ${(activation.avgActivationRate * 100).toFixed(0)}%`,
        metrics: { avgActivationRate: activation.avgActivationRate },
      };
    }
    
    return null;
  }
  
  /**
   * 检查周期性进化
   */
  private checkPeriodicEvolution(): EvolutionTriggerResult['reasons'][0] | null {
    const timeSinceLastEvolution = Date.now() - this.lastEvolutionTime;
    
    // 超过最大间隔，必须进化
    if (timeSinceLastEvolution > this.thresholds.maxEvolutionInterval) {
      return {
        type: 'periodic',
        severity: 1,
        description: `超过最大进化周期: ${Math.floor(timeSinceLastEvolution / (24 * 60 * 60 * 1000))}天`,
        metrics: { daysSinceEvolution: timeSinceLastEvolution / (24 * 60 * 60 * 1000) },
      };
    }
    
    // 超过最小间隔，可以进化
    if (timeSinceLastEvolution > this.thresholds.minEvolutionInterval) {
      return {
        type: 'periodic',
        severity: 0.5,
        description: `达到进化周期: ${Math.floor(timeSinceLastEvolution / (24 * 60 * 60 * 1000))}天`,
        metrics: { daysSinceEvolution: timeSinceLastEvolution / (24 * 60 * 60 * 1000) },
      };
    }
    
    return null;
  }
  
  /**
   * 计算系统健康评分
   */
  private calculateHealthScore(state: SystemStateSnapshot): number {
    let score = 1;
    
    // 性能因素
    score *= state.performance.responseQuality;
    score *= (1 - state.performance.errorRate);
    score *= Math.min(1, this.thresholds.maxResponseTime / state.performance.avgResponseTime);
    
    // 学习因素
    score *= Math.min(1, 0.5 + state.learning.avgSurprise);
    score *= (1 - Math.min(1, state.learning.stagnationCount / 200));
    
    // 激活因素
    score *= state.activation.avgActivationRate;
    score *= (1 - state.activation.deadNeuronRatio);
    
    // 能力因素
    score *= state.capabilities.coverageRate;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * 决定进化强度
   */
  private determineIntensity(
    reasons: EvolutionTriggerResult['reasons'],
    healthScore: number
  ): 'minor' | 'moderate' | 'major' {
    // 严重问题或健康评分很低
    if (healthScore < 0.4 || reasons.some(r => r.severity > 0.8)) {
      return 'major';
    }
    
    // 中等问题
    if (healthScore < 0.6 || reasons.some(r => r.severity > 0.5)) {
      return 'moderate';
    }
    
    // 轻微问题或仅周期性
    return 'minor';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let evolutionTriggerInstance: EvolutionTrigger | null = null;

export function getEvolutionTrigger(
  thresholds?: Partial<TriggerThresholds>
): EvolutionTrigger {
  if (!evolutionTriggerInstance) {
    evolutionTriggerInstance = new EvolutionTrigger(thresholds);
  }
  return evolutionTriggerInstance;
}
