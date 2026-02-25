/**
 * ═══════════════════════════════════════════════════════════════════════
 * 后台处理模块 - 真正的"潜意识"机制
 * 
 * 认知科学基础：
 * 
 * 1. 双系统理论（Kahneman）：
 *    - 系统1：快速、自动、无意识、并行
 *    - 系统2：缓慢、费力、有意识、串行
 *    本模块实现系统1
 * 
 * 2. 隐式学习（Implicit Learning）：
 *    - 在没有意识参与的情况下学习模式
 *    - 例如：人可以无意识地学会语言规律
 * 
 * 3. 准备电位（Readiness Potential）：
 *    - 大脑在意识决定之前就已经开始准备行动
 *    - 潜意识比意识更快
 * 
 * 4. 启发式决策（Heuristics）：
 *    - 基于经验的快速判断
 *    - 不需要详细推理
 * 
 * 核心原则：
 * - 永远不进入意识（不参与全局工作空间竞争）
 * - 并行处理多个输入模式
 * - 只输出"信号"，不给解释
 * - 比意识处理更快
 * ═══════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════════

/**
 * 直觉信号 - 系统1的输出
 * 
 * 注意：这是"信号"而非"解释"
 * 就像你有"不好的预感"，但说不出为什么
 */
export interface IntuitionSignal {
  /** 信号类型 */
  type: 'familiar' | 'novel' | 'coherent' | 'conflict' | 'opportunity' | 'risk';
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 置信度 [0, 1] - 基于匹配模式数量 */
  confidence: number;
  
  /** 相关的概念（但不解释关系） */
  relatedConcepts: string[];
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 模式匹配结果
 */
export interface PatternMatch {
  /** 匹配的模式ID */
  patternId: string;
  
  /** 相似度 [0, 1] */
  similarity: number;
  
  /** 该模式的历史频率 */
  frequency: number;
  
  /** 该模式的平均结果（正向/负向） */
  averageOutcome: number;
}

/**
 * 隐式学习的模式
 */
export interface ImplicitPattern {
  /** 模式ID */
  id: string;
  
  /** 模式的向量表示 */
  vector: number[];
  
  /** 遇到次数 */
  encounterCount: number;
  
  /** 累计结果（正=好，负=坏） */
  cumulativeOutcome: number;
  
  /** 最后遇到时间 */
  lastEncountered: number;
  
  /** 相关输入样本（只保留摘要） */
  sampleSummary: string;
}

/**
 * 准备状态 - 为意识层预热
 */
export interface ReadinessState {
  /** 预热的神经元ID */
  primedNeurons: Map<string, number>;
  
  /** 预期的下一步 */
  predictedNext: string[];
  
  /** 准备强度 */
  readinessLevel: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 后台处理结果
 */
export interface BackgroundResult {
  /** 直觉信号 */
  intuition: IntuitionSignal | null;
  
  /** 准备状态 */
  readiness: ReadinessState;
  
  /** 模式匹配结果 */
  patternMatches: PatternMatch[];
  
  /** 处理时间（应该很快） */
  processingTime: number;
}

/**
 * 后台处理配置
 */
export interface BackgroundProcessingConfig {
  /** 模式匹配阈值 */
  patternThreshold: number;
  
  /** 最大存储模式数 */
  maxPatterns: number;
  
  /** 隐式学习率 */
  implicitLearningRate: number;
  
  /** 准备状态的衰减率 */
  readinessDecay: number;
}

// ══════════════════════════════════════════════════════════════════
// 后台处理核心类
// ══════════════════════════════════════════════════════════════════

/**
 * 后台处理器 - 系统1的实现
 * 
 * 这个模块模拟人类认知中的"系统1"：
 * - 快速、自动、无意识
 * - 基于模式匹配而非详细推理
 * - 输出"直觉"而非"解释"
 */
export class BackgroundProcessor {
  private config: Required<BackgroundProcessingConfig>;
  
  /** 隐式学习的模式库 */
  private patterns: Map<string, ImplicitPattern> = new Map();
  
  /** 当前准备状态 */
  private currentReadiness: ReadinessState;
  
  /** 历史直觉信号 */
  private intuitionHistory: IntuitionSignal[] = [];
  
  /** 处理计数 */
  private processCount = 0;
  
  /** 创建时间 */
  private createdAt: number;
  
  constructor(config: Partial<BackgroundProcessingConfig> = {}) {
    this.config = {
      patternThreshold: config.patternThreshold ?? 0.6,
      maxPatterns: config.maxPatterns ?? 1000,
      implicitLearningRate: config.implicitLearningRate ?? 0.1,
      readinessDecay: config.readinessDecay ?? 0.9,
    };
    
    this.currentReadiness = {
      primedNeurons: new Map(),
      predictedNext: [],
      readinessLevel: 0,
      timestamp: Date.now(),
    };
    
    this.createdAt = Date.now();
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 核心处理流程
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * 处理输入 - 快速模式匹配
   * 
   * 这是系统1的核心：
   * 1. 快速匹配已知模式
   * 2. 生成直觉信号
   * 3. 更新准备状态
   * 4. 隐式学习
   */
  process(
    inputVector: number[],
    currentActivations: Map<string, number>,
    outcome?: number
  ): BackgroundResult {
    const startTime = performance.now();
    this.processCount++;
    
    // 1. 快速模式匹配
    const matches = this.matchPatterns(inputVector);
    
    // 2. 生成直觉信号
    const intuition = this.generateIntuition(matches);
    
    // 3. 更新准备状态
    this.updateReadiness(currentActivations, matches);
    
    // 4. 隐式学习
    if (outcome !== undefined) {
      this.learnFromOutcome(inputVector, outcome);
    } else {
      this.encounterPattern(inputVector);
    }
    
    const processingTime = performance.now() - startTime;
    
    return {
      intuition,
      readiness: { ...this.currentReadiness },
      patternMatches: matches,
      processingTime,
    };
  }
  
  /**
   * 快速模式匹配
   * 
   * 原理：使用向量相似度快速匹配已知模式
   * 这是O(n)的线性扫描，但非常快速
   */
  private matchPatterns(inputVector: number[]): PatternMatch[] {
    const matches: PatternMatch[] = [];
    
    for (const [id, pattern] of this.patterns) {
      const similarity = this.cosineSimilarity(inputVector, pattern.vector);
      
      if (similarity >= this.config.patternThreshold) {
        matches.push({
          patternId: id,
          similarity,
          frequency: pattern.encounterCount,
          averageOutcome: pattern.cumulativeOutcome / Math.max(1, pattern.encounterCount),
        });
      }
    }
    
    // 按相似度排序，返回最匹配的
    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }
  
  /**
   * 生成直觉信号
   * 
   * 原理：基于模式匹配结果生成"感觉"
   * 
   * 直觉类型：
   * - familiar: 遇到熟悉的模式，感觉"我知道这个"
   * - novel: 遇到新模式，感觉"这很新鲜"
   * - coherent: 模式一致，感觉"这说得通"
   * - conflict: 模式冲突，感觉"有点不对"
   * - opportunity: 历史结果正向，感觉"这是个机会"
   * - risk: 历史结果负向，感觉"要小心"
   */
  private generateIntuition(matches: PatternMatch[]): IntuitionSignal | null {
    if (matches.length === 0) {
      // 没有匹配 = 新模式
      return {
        type: 'novel',
        strength: 0.5,
        confidence: 0.3, // 低置信度因为是新模式
        relatedConcepts: [],
        timestamp: Date.now(),
      };
    }
    
    // 找到最佳匹配
    const bestMatch = matches[0];
    
    // 基于模式特征判断直觉类型
    let type: IntuitionSignal['type'];
    
    if (bestMatch.frequency >= 10 && bestMatch.similarity >= 0.8) {
      // 高频高相似 = 熟悉
      type = 'familiar';
    } else if (matches.length >= 3 && matches.every(m => m.averageOutcome > 0)) {
      // 多个正向匹配 = 机会
      type = 'opportunity';
    } else if (matches.some(m => m.averageOutcome < -0.3)) {
      // 有负向匹配 = 风险
      type = 'risk';
    } else if (matches.length >= 2) {
      // 多个匹配 = 一致
      type = 'coherent';
    } else {
      // 默认 = 熟悉
      type = 'familiar';
    }
    
    const strength = bestMatch.similarity;
    const confidence = Math.min(1, matches.reduce((sum, m) => sum + m.frequency, 0) / 50);
    
    // 记录直觉历史
    const signal: IntuitionSignal = {
      type,
      strength,
      confidence,
      relatedConcepts: matches.slice(0, 3).map(m => m.patternId),
      timestamp: Date.now(),
    };
    
    this.intuitionHistory.push(signal);
    if (this.intuitionHistory.length > 100) {
      this.intuitionHistory.shift();
    }
    
    return signal;
  }
  
  /**
   * 更新准备状态
   * 
   * 原理：准备电位（Readiness Potential）
   * 大脑在意识决定前已经开始准备
   * 
   * 这里我们预热可能用到的神经元
   */
  private updateReadiness(
    currentActivations: Map<string, number>,
    matches: PatternMatch[]
  ): void {
    // 衰减旧的准备状态
    const newPrimed = new Map<string, number>();
    for (const [id, level] of this.currentReadiness.primedNeurons) {
      const decayed = level * this.config.readinessDecay;
      if (decayed > 0.1) {
        newPrimed.set(id, decayed);
      }
    }
    
    // 加入当前激活
    for (const [id, activation] of currentActivations) {
      const existing = newPrimed.get(id) || 0;
      newPrimed.set(id, Math.min(1, existing + activation * 0.3));
    }
    
    // 基于模式匹配预热相关神经元
    for (const match of matches) {
      const pattern = this.patterns.get(match.patternId);
      if (pattern) {
        // 这是一个简化：实际上应该预热与模式相关的神经元
        // 这里用模式的向量来表示"相关"
        newPrimed.set(match.patternId, match.similarity * 0.5);
      }
    }
    
    // 计算整体准备水平
    const readinessLevel = Math.min(1, newPrimed.size / 20);
    
    // 预测下一步（基于历史模式）
    const predictedNext = this.predictNext(matches);
    
    this.currentReadiness = {
      primedNeurons: newPrimed,
      predictedNext,
      readinessLevel,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 预测下一步
   * 
   * 基于模式序列预测接下来可能发生什么
   */
  private predictNext(matches: PatternMatch[]): string[] {
    // 简化实现：返回高频率的模式作为预测
    const predictions: string[] = [];
    
    for (const match of matches) {
      if (match.frequency >= 3 && match.averageOutcome > 0) {
        predictions.push(match.patternId);
      }
    }
    
    return predictions.slice(0, 3);
  }
  
  /**
   * 隐式学习 - 遇到新模式
   */
  private encounterPattern(inputVector: number[]): void {
    // 检查是否已经存在相似模式
    for (const [id, pattern] of this.patterns) {
      const similarity = this.cosineSimilarity(inputVector, pattern.vector);
      if (similarity >= 0.95) {
        // 已经存在，增加计数
        pattern.encounterCount++;
        pattern.lastEncountered = Date.now();
        return;
      }
    }
    
    // 新模式，创建存储
    if (this.patterns.size < this.config.maxPatterns) {
      const id = `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      // 降采样向量以节省空间
      const downsampled = this.downsampleVector(inputVector, 100);
      
      this.patterns.set(id, {
        id,
        vector: downsampled,
        encounterCount: 1,
        cumulativeOutcome: 0,
        lastEncountered: Date.now(),
        sampleSummary: `模式-${this.patterns.size + 1}`,
      });
    }
  }
  
  /**
   * 隐式学习 - 从结果学习
   * 
   * 原理：隐式学习不需要意识参与
   * 系统自动调整模式的价值评估
   */
  private learnFromOutcome(inputVector: number[], outcome: number): void {
    // 找到最相似的模式并更新其结果
    let bestMatch: { id: string; similarity: number } | null = null;
    
    for (const [id, pattern] of this.patterns) {
      const similarity = this.cosineSimilarity(inputVector, pattern.vector);
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { id, similarity };
      }
    }
    
    if (bestMatch && bestMatch.similarity >= this.config.patternThreshold) {
      const pattern = this.patterns.get(bestMatch.id)!;
      pattern.cumulativeOutcome += outcome;
      pattern.encounterCount++;
      pattern.lastEncountered = Date.now();
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      // 如果长度不同，用较短的长度
      const minLen = Math.min(a.length, b.length);
      a = a.slice(0, minLen);
      b = b.slice(0, minLen);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
  
  /**
   * 降采样向量
   */
  private downsampleVector(vector: number[], targetSize: number): number[] {
    if (vector.length <= targetSize) {
      return vector;
    }
    
    const step = vector.length / targetSize;
    const result: number[] = [];
    
    for (let i = 0; i < targetSize; i++) {
      const index = Math.floor(i * step);
      result.push(vector[index]);
    }
    
    return result;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 状态查询
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * 获取当前准备状态
   */
  getReadiness(): ReadinessState {
    return { ...this.currentReadiness };
  }
  
  /**
   * 获取最近的直觉信号
   */
  getRecentIntuitions(count: number = 5): IntuitionSignal[] {
    return this.intuitionHistory.slice(-count);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    patternCount: number;
    processCount: number;
    age: number;
    readinessLevel: number;
  } {
    return {
      patternCount: this.patterns.size,
      processCount: this.processCount,
      age: Date.now() - this.createdAt,
      readinessLevel: this.currentReadiness.readinessLevel,
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// 单例管理
// ══════════════════════════════════════════════════════════════════

let backgroundProcessorInstance: BackgroundProcessor | null = null;

export function getBackgroundProcessor(
  config?: Partial<BackgroundProcessingConfig>
): BackgroundProcessor {
  if (!backgroundProcessorInstance) {
    backgroundProcessorInstance = new BackgroundProcessor(config);
  }
  return backgroundProcessorInstance;
}

export function resetBackgroundProcessor(): void {
  backgroundProcessorInstance = null;
}
