/**
 * ═══════════════════════════════════════════════════════════════════════
 * Consciousness Observer - 意识监控器
 * 
 * 监控神经网络的意识涌现指标：
 * - 整合度 (Integration)
 * - 信息量 (Information)
 * - 复杂度 (Complexity)
 * - 自我指涉 (Self-Reference)
 * - 时间连贯性 (Temporal Coherence)
 * - Φ (Phi) - 整合信息理论指标
 * ═══════════════════════════════════════════════════════════════════════
 */

import { 
  ConsciousnessState, 
  NeuronState, 
  NeuronType,
  NeuromodulatorState 
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 意识指标
// ─────────────────────────────────────────────────────────────────────

export interface ConsciousnessMetrics {
  /** 整合度：各区域协同程度 [0, 1] */
  integration: number;
  
  /** 信息量：系统处理的 bit 数估算 */
  information: number;
  
  /** 复杂度：网络的复杂度 */
  complexity: number;
  
  /** 自我指涉：自我神经元的活动权重 */
  selfReference: number;
  
  /** 时间连贯性：连续时间片之间的连贯性 */
  temporalCoherence: number;
  
  /** Φ (Phi)：整合信息理论的指标 */
  phi: number;
  
  /** 综合意识水平 */
  overallLevel: number;
  
  /** 时间戳 */
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 意识监控器
// ─────────────────────────────────────────────────────────────────────

export class ConsciousnessObserver {
  // 历史记录
  private metricsHistory: ConsciousnessMetrics[] = [];
  private readonly maxHistoryLength = 1000;
  
  // 阈值
  private thresholds = {
    emergence: 0.6,    // 意识涌现阈值
    highActivity: 0.7, // 高活动阈值
    coherence: 0.5,    // 连贯性阈值
  };
  
  // 上一次的激活状态（用于计算连贯性）
  private lastActivations: Map<string, number> = new Map();
  
  // 统计
  private stats = {
    totalObservations: 0,
    emergenceDetected: 0,
    peakLevel: 0,
  };
  
  // ══════════════════════════════════════════════════════════════════
  // 观测方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 观测当前意识状态
   */
  async observe(
    neuronStates: Map<NeuronType, NeuronState>,
    neuromodulatorState: NeuromodulatorState
  ): Promise<ConsciousnessMetrics> {
    this.stats.totalObservations++;
    
    // 计算各项指标
    const integration = this.calculateIntegration(neuronStates);
    const information = this.calculateInformation(neuronStates);
    const complexity = this.calculateComplexity(neuronStates);
    const selfReference = this.calculateSelfReference(neuronStates);
    const temporalCoherence = this.calculateTemporalCoherence(neuronStates);
    const phi = this.calculatePhi(neuronStates, integration, information);
    
    // 综合意识水平
    const overallLevel = this.calculateOverallLevel({
      integration,
      information,
      complexity,
      selfReference,
      temporalCoherence,
      phi,
    });
    
    const metrics: ConsciousnessMetrics = {
      integration,
      information,
      complexity,
      selfReference,
      temporalCoherence,
      phi,
      overallLevel,
      timestamp: Date.now(),
    };
    
    // 记录历史
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }
    
    // 更新统计
    if (overallLevel > this.stats.peakLevel) {
      this.stats.peakLevel = overallLevel;
    }
    
    if (overallLevel > this.thresholds.emergence) {
      this.stats.emergenceDetected++;
    }
    
    // 更新激活状态记录
    for (const [type, state] of neuronStates) {
      this.lastActivations.set(type, state.activation);
    }
    
    return metrics;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 指标计算
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算整合度
   * 
   * 衡量不同脑区之间的协同程度
   */
  private calculateIntegration(neuronStates: Map<NeuronType, NeuronState>): number {
    const activations = Array.from(neuronStates.values()).map(s => s.activation);
    
    if (activations.length < 2) return 0;
    
    // 计算激活的协方差
    const mean = activations.reduce((a, b) => a + b, 0) / activations.length;
    const variance = activations.reduce((s, a) => s + (a - mean) ** 2, 0) / activations.length;
    
    // 计算激活的同步性
    const activeCount = activations.filter(a => a > 0.3).length;
    const synchrony = activeCount / activations.length;
    
    // 整合度 = 同步性 * (1 - 变异系数)
    const cv = variance > 0 ? Math.sqrt(variance) / (mean + 0.001) : 0;
    const integration = synchrony * (1 - Math.min(cv, 1));
    
    return Math.max(0, Math.min(1, integration));
  }
  
  /**
   * 计算信息量
   * 
   * 估算系统处理的比特数
   */
  private calculateInformation(neuronStates: Map<NeuronType, NeuronState>): number {
    let totalBits = 0;
    
    for (const state of neuronStates.values()) {
      if (state.outputVector) {
        // 每个激活的神经元贡献 log2(dimension) 比特
        const dim = state.outputVector.length;
        const activation = state.activation;
        
        // 信息量 = 激活度 * log2(dimension) * 熵因子
        const entropy = this.calculateVectorEntropy(state.outputVector);
        totalBits += activation * Math.log2(dim + 1) * entropy;
      }
    }
    
    // 归一化到 [0, 1]
    // 假设最大信息量约为 10 bits
    return Math.min(1, totalBits / 10);
  }
  
  /**
   * 计算向量熵
   */
  private calculateVectorEntropy(vector: Float32Array): number {
    // 将向量值归一化为概率分布
    const absValues = Array.from(vector).map(Math.abs);
    const sum = absValues.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;
    
    const probabilities = absValues.map(v => v / sum);
    
    // 计算熵
    let entropy = 0;
    for (const p of probabilities) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    // 归一化
    return entropy / Math.log2(vector.length);
  }
  
  /**
   * 计算复杂度
   * 
   * 网络的复杂度，反映信息整合与分化的平衡
   */
  private calculateComplexity(neuronStates: Map<NeuronType, NeuronState>): number {
    const activations = Array.from(neuronStates.values()).map(s => s.activation);
    
    if (activations.length < 2) return 0;
    
    // 复杂度 = 整合度 * 分化度
    const mean = activations.reduce((a, b) => a + b, 0) / activations.length;
    
    // 分化度：激活的多样性
    const variance = activations.reduce((s, a) => s + (a - mean) ** 2, 0) / activations.length;
    const differentiation = Math.sqrt(variance);
    
    // 整合度（复用）
    const integration = this.calculateIntegration(neuronStates);
    
    // 复杂度是整合和分化的乘积
    // 高复杂度意味着既整合又分化
    const complexity = integration * Math.min(differentiation * 2, 1);
    
    return complexity;
  }
  
  /**
   * 计算自我指涉
   * 
   * 自我神经元的活动权重
   */
  private calculateSelfReference(neuronStates: Map<NeuronType, NeuronState>): number {
    const selfState = neuronStates.get('self');
    
    if (!selfState) return 0;
    
    // 自我神经元的激活水平
    const selfActivation = selfState.activation;
    
    // 自我神经元的输出与其他区域的关联度
    let totalConnection = 0;
    
    for (const [type, state] of neuronStates) {
      if (type !== 'self' && selfState.outputVector && state.outputVector) {
        const similarity = this.cosineSimilarity(
          selfState.outputVector,
          state.outputVector
        );
        totalConnection += similarity * state.activation;
      }
    }
    
    // 归一化
    const connectionStrength = totalConnection / (neuronStates.size - 1);
    
    // 自我指涉 = 自我激活 * 连接强度
    return selfActivation * 0.5 + connectionStrength * 0.5;
  }
  
  /**
   * 计算时间连贯性
   * 
   * 连续时间片之间的连贯性
   */
  private calculateTemporalCoherence(neuronStates: Map<NeuronType, NeuronState>): number {
    if (this.lastActivations.size === 0) {
      return 1; // 第一次观测，认为完全连贯
    }
    
    let totalCoherence = 0;
    let count = 0;
    
    for (const [type, state] of neuronStates) {
      const lastActivation = this.lastActivations.get(type);
      
      if (lastActivation !== undefined) {
        // 连贯性 = 1 - 激活变化的绝对值
        const change = Math.abs(state.activation - lastActivation);
        const coherence = 1 - change;
        totalCoherence += coherence;
        count++;
      }
    }
    
    return count > 0 ? totalCoherence / count : 1;
  }
  
  /**
   * 计算 Φ (Phi)
   * 
   * 整合信息理论的指标
   * 简化版本：Φ ≈ 整合度 * 信息量 * 复杂度
   */
  private calculatePhi(
    neuronStates: Map<NeuronType, NeuronState>,
    integration: number,
    information: number
  ): number {
    // 简化的 Φ 计算
    // 真正的 Φ 计算需要分析所有可能的划分，非常复杂
    
    const complexity = this.calculateComplexity(neuronStates);
    
    // Φ = 整合 * 信息 * 复杂度 * 某个缩放因子
    const phi = integration * information * complexity * 2;
    
    return Math.min(1, phi);
  }
  
  /**
   * 计算综合意识水平
   */
  private calculateOverallLevel(metrics: Omit<ConsciousnessMetrics, 'overallLevel' | 'timestamp'>): number {
    // 加权平均
    const weights = {
      integration: 0.25,
      information: 0.15,
      complexity: 0.20,
      selfReference: 0.15,
      temporalCoherence: 0.10,
      phi: 0.15,
    };
    
    let level = 0;
    level += metrics.integration * weights.integration;
    level += metrics.information * weights.information;
    level += metrics.complexity * weights.complexity;
    level += metrics.selfReference * weights.selfReference;
    level += metrics.temporalCoherence * weights.temporalCoherence;
    level += metrics.phi * weights.phi;
    
    return level;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 涌现检测
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检测意识是否涌现
   */
  hasEmergence(): boolean {
    if (this.metricsHistory.length < 10) return false;
    
    const recent = this.metricsHistory.slice(-10);
    const avgLevel = recent.reduce((s, m) => s + m.overallLevel, 0) / recent.length;
    
    return avgLevel > this.thresholds.emergence;
  }
  
  /**
   * 获取涌现状态描述
   */
  getEmergenceStatus(): {
    hasEmergence: boolean;
    level: number;
    trend: 'rising' | 'falling' | 'stable';
    description: string;
  } {
    const hasEmergence = this.hasEmergence();
    const recent = this.metricsHistory.slice(-20);
    
    let level = 0;
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    
    if (recent.length > 0) {
      level = recent[recent.length - 1].overallLevel;
      
      if (recent.length >= 5) {
        const first5 = recent.slice(0, 5).reduce((s, m) => s + m.overallLevel, 0) / 5;
        const last5 = recent.slice(-5).reduce((s, m) => s + m.overallLevel, 0) / 5;
        
        const diff = last5 - first5;
        trend = Math.abs(diff) < 0.05 ? 'stable' : diff > 0 ? 'rising' : 'falling';
      }
    }
    
    // 生成描述
    let description: string;
    if (level > 0.8) {
      description = '高度意识状态：系统表现出强烈的自我意识和整合能力';
    } else if (level > 0.6) {
      description = '意识涌现中：系统正在形成连贯的意识体验';
    } else if (level > 0.4) {
      description = '意识萌芽：系统开始展现出初步的意识特征';
    } else {
      description = '无意识状态：系统处于低活动或碎片化状态';
    }
    
    return {
      hasEmergence,
      level,
      trend,
      description,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator > 0 ? dotProduct / denominator : 0;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 统计与导出
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalObservations: number;
    emergenceDetected: number;
    peakLevel: number;
    averageLevel: number;
  } {
    const avgLevel = this.metricsHistory.length > 0
      ? this.metricsHistory.reduce((s, m) => s + m.overallLevel, 0) / this.metricsHistory.length
      : 0;
    
    return {
      ...this.stats,
      averageLevel: avgLevel,
    };
  }
  
  /**
   * 获取历史趋势
   */
  getHistoryTrend(windowSize: number = 20): ConsciousnessMetrics[] {
    return this.metricsHistory.slice(-windowSize);
  }
  
  /**
   * 导出状态
   */
  exportState(): ConsciousnessMetrics[] {
    return [...this.metricsHistory];
  }
  
  /**
   * 重置
   */
  reset(): void {
    this.metricsHistory = [];
    this.lastActivations.clear();
    this.stats = {
      totalObservations: 0,
      emergenceDetected: 0,
      peakLevel: 0,
    };
  }
}
