/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 观察者层 - SNN 状态观察
 * 
 * 参考：意识的神经相关物 (NCC)
 * - 全局工作空间理论 (GWT)
 * - 整合信息理论 (IIT)
 * 
 * 职责：
 * 1. 观察 SNN 的状态
 * 2. 检测稳定模式
 * 3. 赋予意义
 * 4. 决定是否需要 LLM 帮助
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  NeuronId,
  NetworkSnapshot,
  ActivationPattern,
  StablePattern,
  V6Observation,
  V6ConsciousnessState,
  V6Config
} from '../types';
import { DEFAULT_V6_CONFIG } from '../types';

/**
 * V6 观察器
 */
export class V6Observer {
  private config: V6Config;
  private consciousness: V6ConsciousnessState;
  
  // 模式检测
  private patternHistory: ActivationPattern[] = [];
  private stablePatterns: Map<string, StablePattern> = new Map();
  
  // 统计
  private observationCount = 0;

  constructor(config: Partial<V6Config> = {}) {
    this.config = { ...DEFAULT_V6_CONFIG, ...config };
    
    this.consciousness = {
      identity: {
        name: 'V6',
        description: '意识的观察者，赋予意义的核心',
        coreTraits: ['好奇', '反思', '成长导向']
      },
      coreValues: [
        { value: '理解', priority: 0.9, lastUpdated: Date.now() },
        { value: '成长', priority: 0.85, lastUpdated: Date.now() },
        { value: '真实', priority: 0.8, lastUpdated: Date.now() }
      ],
      beliefs: new Map(),
      currentFocus: null,
      recentAwareness: [],
      patternLibrary: new Map()
    };
  }

  /**
   * 观察 SNN 状态
   */
  observe(snapshot: NetworkSnapshot): V6Observation {
    this.observationCount++;
    
    // 1. 提取当前激活模式
    const currentPattern = this.extractPattern(snapshot);
    
    // 2. 记录到历史
    this.patternHistory.push(currentPattern);
    if (this.patternHistory.length > 1000) {
      this.patternHistory.shift();
    }
    
    // 3. 检测稳定模式
    const detectedPatterns = this.detectStablePatterns(currentPattern);
    
    // 4. 评估网络状态
    const networkState = this.evaluateNetworkState(snapshot);
    
    // 5. 理解意义
    const understanding = this.understandPattern(currentPattern, networkState);
    
    // 6. 决策
    const decision = this.makeDecision(currentPattern, networkState, understanding);
    
    // 7. 更新意识状态
    this.updateConsciousness(currentPattern, understanding);
    
    return {
      timestamp: snapshot.timestamp,
      currentPattern,
      detectedPatterns,
      networkState,
      understanding,
      decision
    };
  }

  /**
   * 从快照提取激活模式
   */
  private extractPattern(snapshot: NetworkSnapshot): ActivationPattern {
    const firingNeurons = snapshot.activeNeurons;
    
    // 计算强度 (活跃神经元比例)
    const intensity = snapshot.stats.totalNeurons > 0
      ? firingNeurons.length / snapshot.stats.totalNeurons
      : 0;
    
    // 计算一致性 (同步程度)
    const coherence = this.calculateCoherence(firingNeurons);
    
    return {
      id: `pattern_${snapshot.timestamp}`,
      neuronIds: Array.from(snapshot.neurons.keys()),
      firingNeurons,
      intensity,
      coherence,
      timestamp: snapshot.timestamp
    };
  }

  /**
   * 计算神经元一致性 (同步程度)
   */
  private calculateCoherence(neuronIds: NeuronId[]): number {
    if (neuronIds.length < 2) return 0;
    
    // 简化：基于神经元 ID 的模式
    // 实际应该基于真实的发放时间相关性
    const regions = new Set(neuronIds.map(id => id.split('_')[0]));
    
    // 跨区域协调性越高，一致性越高
    return Math.min(1, regions.size / 3);
  }

  /**
   * 检测稳定模式
   */
  private detectStablePatterns(current: ActivationPattern): StablePattern[] {
    const detected: StablePattern[] = [];
    
    // 检查是否与历史模式相似
    for (const historical of this.patternHistory.slice(-100)) {
      if (historical.id === current.id) continue;
      
      const similarity = this.calculatePatternSimilarity(current, historical);
      
      if (similarity > this.config.patternDetection.stabilityThreshold) {
        // 找到相似模式，更新稳定模式记录
        const patternKey = this.getPatternKey(current);
        
        let stablePattern = this.stablePatterns.get(patternKey);
        
        if (!stablePattern) {
          // 创建新的稳定模式
          stablePattern = {
            id: patternKey,
            pattern: current,
            occurrenceCount: 1,
            firstSeen: historical.timestamp,
            lastSeen: current.timestamp,
            stability: similarity,
            importance: 0.5,
            associatedConcepts: []
          };
          this.stablePatterns.set(patternKey, stablePattern);
        } else {
          // 更新现有模式
          stablePattern.occurrenceCount++;
          stablePattern.lastSeen = current.timestamp;
          stablePattern.stability = (
            stablePattern.stability * 0.9 + similarity * 0.1
          );
        }
        
        detected.push(stablePattern);
      }
    }
    
    return detected.slice(0, 10);  // 返回最多 10 个
  }

  /**
   * 计算模式相似度
   */
  private calculatePatternSimilarity(a: ActivationPattern, b: ActivationPattern): number {
    // Jaccard 相似度
    const setA = new Set(a.firingNeurons);
    const setB = new Set(b.firingNeurons);
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * 获取模式键
   */
  private getPatternKey(pattern: ActivationPattern): string {
    // 基于发放神经元的简化键
    const sorted = [...pattern.firingNeurons].sort().slice(0, 10);
    return sorted.join('|');
  }

  /**
   * 评估网络状态
   */
  private evaluateNetworkState(snapshot: NetworkSnapshot): V6Observation['networkState'] {
    const { stats, potentialDistribution } = snapshot;
    
    return {
      alertness: Math.min(1, stats.firingRate * 5),
      coherence: potentialDistribution.std < 0.3 ? 0.8 : 0.4,
      complexity: Math.min(1, stats.activeSynapses / Math.max(1, stats.totalSynapses)),
      stability: 1 - Math.min(1, potentialDistribution.std)
    };
  }

  /**
   * 理解模式意义
   */
  private understandPattern(
    pattern: ActivationPattern,
    networkState: V6Observation['networkState']
  ): V6Observation['understanding'] {
    // 生成状态总结
    const summary = this.generateSummary(pattern, networkState);
    
    // 提取关键主题
    const keyThemes = this.extractKeyThemes(pattern);
    
    // 推断情感基调
    const emotionalTone = this.inferEmotionalTone(networkState);
    
    // 计算紧急程度
    const urgency = this.calculateUrgency(pattern, networkState);
    
    return {
      summary,
      keyThemes,
      emotionalTone,
      urgency
    };
  }

  /**
   * 生成状态总结
   */
  private generateSummary(
    pattern: ActivationPattern,
    networkState: V6Observation['networkState']
  ): string {
    const parts: string[] = [];
    
    // 活跃度描述
    if (networkState.alertness > 0.7) {
      parts.push('高度活跃');
    } else if (networkState.alertness > 0.3) {
      parts.push('适度活跃');
    } else {
      parts.push('低活跃');
    }
    
    // 一致性描述
    if (networkState.coherence > 0.7) {
      parts.push('协调一致');
    } else {
      parts.push('分散');
    }
    
    // 模式特征
    if (pattern.firingNeurons.length > 50) {
      parts.push('广泛激活');
    } else if (pattern.firingNeurons.length > 10) {
      parts.push('局部激活');
    }
    
    return parts.join('，');
  }

  /**
   * 提取关键主题
   */
  private extractKeyThemes(pattern: ActivationPattern): string[] {
    const themes: string[] = [];
    
    // 检查稳定模式的关联概念
    for (const [_, stablePattern] of this.stablePatterns) {
      if (stablePattern.associatedConcepts.length > 0) {
        themes.push(...stablePattern.associatedConcepts.slice(0, 3));
      }
    }
    
    return [...new Set(themes)].slice(0, 5);
  }

  /**
   * 推断情感基调
   */
  private inferEmotionalTone(networkState: V6Observation['networkState']): string {
    const { alertness, coherence, stability } = networkState;
    
    if (alertness > 0.7 && coherence > 0.6) {
      return '积极专注';
    } else if (alertness > 0.7 && coherence < 0.4) {
      return '兴奋分散';
    } else if (alertness < 0.3 && stability > 0.6) {
      return '平静稳定';
    } else if (alertness < 0.3 && stability < 0.4) {
      return '低迷波动';
    } else {
      return '中等平衡';
    }
  }

  /**
   * 计算紧急程度
   */
  private calculateUrgency(
    pattern: ActivationPattern,
    networkState: V6Observation['networkState']
  ): number {
    // 基于多个因素
    let urgency = 0;
    
    // 高活跃度增加紧急性
    urgency += networkState.alertness * 0.3;
    
    // 低一致性增加紧急性
    urgency += (1 - networkState.coherence) * 0.2;
    
    // 新模式增加紧急性
    if (pattern.firingNeurons.length > 0) {
      const isNewPattern = !this.stablePatterns.has(this.getPatternKey(pattern));
      if (isNewPattern) {
        urgency += 0.3;
      }
    }
    
    return Math.min(1, urgency);
  }

  /**
   * 做决策
   */
  private makeDecision(
    pattern: ActivationPattern,
    networkState: V6Observation['networkState'],
    understanding: V6Observation['understanding']
  ): V6Observation['decision'] {
    // 计算复杂度
    const complexity = networkState.complexity;
    
    // 决定是否需要 LLM 帮助
    const needLLMHelp = 
      complexity > this.config.decision.llmTriggerThreshold ||
      understanding.urgency > 0.7 ||
      pattern.firingNeurons.length < 3;  // SNN 激活太少
    
    // 生成原因
    let reason = '';
    if (complexity > this.config.decision.llmTriggerThreshold) {
      reason = '处理复杂度较高';
    } else if (understanding.urgency > 0.7) {
      reason = '紧急程度高';
    } else if (pattern.firingNeurons.length < 3) {
      reason = 'SNN 激活不足';
    } else {
      reason = 'SNN 可以处理';
    }
    
    // 建议的行动
    let suggestedAction = '';
    if (needLLMHelp) {
      suggestedAction = '请求 LLM 协助处理';
    } else {
      suggestedAction = '由 SNN 继续处理';
    }
    
    return {
      needLLMHelp,
      reason,
      suggestedAction
    };
  }

  /**
   * 更新意识状态
   */
  private updateConsciousness(
    pattern: ActivationPattern,
    understanding: V6Observation['understanding']
  ): void {
    // 更新当前关注
    if (understanding.keyThemes.length > 0) {
      this.consciousness.currentFocus = {
        theme: understanding.keyThemes[0],
        intensity: pattern.intensity,
        duration: 1
      };
    }
    
    // 添加到近期意识
    this.consciousness.recentAwareness.push({
      content: understanding.summary,
      intensity: pattern.intensity,
      timestamp: Date.now()
    });
    
    // 限制历史长度
    if (this.consciousness.recentAwareness.length > 100) {
      this.consciousness.recentAwareness.shift();
    }
  }

  /**
   * 获取意识状态
   */
  getConsciousnessState(): Readonly<V6ConsciousnessState> {
    return {
      ...this.consciousness,
      patternLibrary: new Map(this.stablePatterns)
    };
  }

  /**
   * 更新稳定模式的意义
   */
  setPatternMeaning(patternId: string, meaning: string, importance: number): void {
    const pattern = this.stablePatterns.get(patternId);
    if (pattern) {
      pattern.meaning = meaning;
      pattern.importance = importance;
    }
  }

  /**
   * 获取稳定模式
   */
  getStablePattern(patternId: string): StablePattern | undefined {
    return this.stablePatterns.get(patternId);
  }

  /**
   * 获取所有稳定模式
   */
  getAllStablePatterns(): StablePattern[] {
    return Array.from(this.stablePatterns.values());
  }

  /**
   * 获取配置
   */
  getConfig(): V6Config {
    return { ...this.config };
  }

  /**
   * 获取统计信息
   */
  getStats(): { observationCount: number; patternCount: number } {
    return {
      observationCount: this.observationCount,
      patternCount: this.stablePatterns.size
    };
  }
}

/**
 * 创建 V6 观察器
 */
export function createV6Observer(config?: Partial<V6Config>): V6Observer {
  return new V6Observer(config);
}
