/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元生成器 - Neuron Generator
 * 
 * 核心功能：
 * 1. 基于惊讶度自动生成专门化神经元
 * 2. 基于覆盖盲区生成新神经元
 * 3. 神经元修剪（移除无效神经元）
 * 4. 神经元合并（合并相似神经元）
 * 
 * 这是系统"成长"的核心机制
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PredictiveNeuron,
  createPredictiveNeuron,
  NeuronRole,
  ConnectionInfo,
} from './predictive-neuron';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 生成触发类型
 */
export type GenerationTriggerType =
  | 'high_surprise'      // 高惊讶度触发
  | 'low_coverage'       // 低覆盖触发
  | 'new_domain'         // 新领域发现
  | 'connection_bottleneck' // 连接瓶颈
  | 'user_interest'      // 用户兴趣
  | 'emergence'          // 涌现事件
  | 'manual';            // 手动创建

/**
 * 生成触发器
 */
export interface GenerationTrigger {
  /** 触发类型 */
  type: GenerationTriggerType;
  
  /** 触发来源 */
  source: string;
  
  /** 触发原因描述 */
  reason: string;
  
  /** 相关的输入向量 */
  inputVector?: number[];
  
  /** 相关的父神经元ID */
  parentNeuronId?: string;
  
  /** 建议的角色 */
  suggestedRole?: NeuronRole;
  
  /** 建议的标签 */
  suggestedLabel?: string;
  
  /** 优先级 [0, 1] */
  priority: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 生成结果
 */
export interface GenerationResult {
  /** 新创建的神经元 */
  created: PredictiveNeuron[];
  
  /** 修剪的神经元ID */
  pruned: string[];
  
  /** 合并的神经元组 */
  merged: Array<{
    mergedInto: string;
    mergedFrom: string[];
  }>;
  
  /** 生成摘要 */
  summary: string;
}

/**
 * 盲区检测结果
 */
export interface BlindSpot {
  /** 盲区向量 */
  vector: number[];
  
  /** 检测原因 */
  reason: 'no_activation' | 'low_coverage' | 'new_pattern';
  
  /** 严重程度 [0, 1] */
  severity: number;
  
  /** 相关的输入样本 */
  samples: string[];
}

/**
 * 神经元相似性分析结果
 */
export interface SimilarityAnalysis {
  /** 相似的神经元组 */
  groups: Array<{
    neuronIds: string[];
    averageSimilarity: number;
    suggestedLabel?: string;
  }>;
  
  /** 可合并的建议 */
  mergeSuggestions: Array<{
    primaryId: string;
    secondaryIds: string[];
    reason: string;
  }>;
}

/**
 * 生成器配置
 */
export interface NeuronGeneratorConfig {
  /** 目标神经元数量 */
  targetCount: number;
  
  /** 最大神经元数量 */
  maxCount: number;
  
  /** 生成阈值：惊讶度 */
  surpriseThreshold: number;
  
  /** 生成阈值：覆盖度 */
  coverageThreshold: number;
  
  /** 修剪阈值：效用 */
  usefulnessThreshold: number;
  
  /** 修剪阈值：激活 */
  activationThreshold: number;
  
  /** 合并阈值：相似度 */
  mergeSimilarityThreshold: number;
  
  /** 最小神经元年龄（毫秒），低于此不修剪 */
  minAgeForPruning: number;
  
  /** 每次生成最大数量 */
  maxGenerationsPerCycle: number;
}

const DEFAULT_CONFIG: NeuronGeneratorConfig = {
  targetCount: 100,
  maxCount: 500,
  surpriseThreshold: 2.5,
  coverageThreshold: 0.3,
  usefulnessThreshold: 0.15,
  activationThreshold: 0.1,
  mergeSimilarityThreshold: 0.85,
  minAgeForPruning: 7 * 24 * 60 * 60 * 1000, // 1周
  maxGenerationsPerCycle: 5,
};

// ─────────────────────────────────────────────────────────────────────
// 神经元生成器
// ─────────────────────────────────────────────────────────────────────

export class NeuronGenerator {
  private config: NeuronGeneratorConfig;
  private userId: string;
  
  /** 生成历史 */
  private generationHistory: Array<{
    trigger: GenerationTrigger;
    result: GenerationResult;
    timestamp: number;
  }>;
  
  /** 统计信息 */
  private stats = {
    totalGenerated: 0,
    totalPruned: 0,
    totalMerged: 0,
    generationsByType: new Map<GenerationTriggerType, number>(),
  };

  constructor(userId: string, config: Partial<NeuronGeneratorConfig> = {}) {
    this.userId = userId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.generationHistory = [];
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心生成方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 分析并生成神经元
   * 
   * 主要入口方法，分析当前网络状态，决定是否需要生成/修剪/合并
   */
  async analyzeAndGenerate(
    neurons: Map<string, PredictiveNeuron>,
    recentInputs: Array<{ vector: number[]; content: string }>
  ): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: [],
      pruned: [],
      merged: [],
      summary: '',
    };
    
    // 1. 检测生成触发器
    const triggers = await this.detectTriggers(neurons, recentInputs);
    
    // 2. 根据触发器生成新神经元
    for (const trigger of triggers.slice(0, this.config.maxGenerationsPerCycle)) {
      const newNeuron = await this.generateNeuron(trigger, neurons);
      if (newNeuron) {
        result.created.push(newNeuron);
        this.stats.totalGenerated++;
        this.stats.generationsByType.set(
          trigger.type,
          (this.stats.generationsByType.get(trigger.type) || 0) + 1
        );
      }
    }
    
    // 3. 修剪无效神经元
    const pruned = this.pruneNeurons(neurons);
    result.pruned = pruned;
    this.stats.totalPruned += pruned.length;
    
    // 4. 合并相似神经元
    const merged = this.mergeSimilarNeurons(neurons);
    result.merged = merged;
    this.stats.totalMerged += merged.length;
    
    // 5. 生成摘要
    result.summary = this.generateSummary(result);
    
    // 记录历史
    this.generationHistory.push({
      trigger: { type: 'high_surprise', source: 'analysis', reason: 'auto', priority: 0.5, timestamp: Date.now() },
      result,
      timestamp: Date.now(),
    });
    
    return result;
  }

  /**
   * 检测生成触发器
   */
  private async detectTriggers(
    neurons: Map<string, PredictiveNeuron>,
    recentInputs: Array<{ vector: number[]; content: string }>
  ): Promise<GenerationTrigger[]> {
    const triggers: GenerationTrigger[] = [];
    
    // 触发器1：高惊讶度神经元
    const highSurpriseTriggers = this.detectHighSurpriseTriggers(neurons);
    triggers.push(...highSurpriseTriggers);
    
    // 触发器2：覆盖盲区
    const blindSpotTriggers = this.detectBlindSpotTriggers(neurons, recentInputs);
    triggers.push(...blindSpotTriggers);
    
    // 触发器3：新领域发现
    const domainTriggers = this.detectNewDomainTriggers(neurons, recentInputs);
    triggers.push(...domainTriggers);
    
    // 触发器4：连接瓶颈
    const bottleneckTriggers = this.detectBottleneckTriggers(neurons);
    triggers.push(...bottleneckTriggers);
    
    // 按优先级排序
    triggers.sort((a, b) => b.priority - a.priority);
    
    return triggers;
  }

  /**
   * 检测高惊讶度触发器
   */
  private detectHighSurpriseTriggers(
    neurons: Map<string, PredictiveNeuron>
  ): GenerationTrigger[] {
    const triggers: GenerationTrigger[] = [];
    
    for (const [id, neuron] of neurons) {
      if (neuron.learning.accumulatedSurprise >= this.config.surpriseThreshold) {
        triggers.push({
          type: 'high_surprise',
          source: id,
          reason: `神经元 ${neuron.label} 累积惊讶度 ${neuron.learning.accumulatedSurprise.toFixed(2)}`,
          parentNeuronId: id,
          suggestedRole: neuron.role,
          suggestedLabel: `${neuron.label}_specialized`,
          priority: Math.min(1, neuron.learning.accumulatedSurprise / 5),
          timestamp: Date.now(),
        });
      }
    }
    
    return triggers;
  }

  /**
   * 检测覆盖盲区触发器
   */
  private detectBlindSpotTriggers(
    neurons: Map<string, PredictiveNeuron>,
    recentInputs: Array<{ vector: number[]; content: string }>
  ): GenerationTrigger[] {
    const triggers: GenerationTrigger[] = [];
    const blindSpots = this.detectBlindSpots(neurons, recentInputs);
    
    for (const spot of blindSpots) {
      if (spot.severity > 0.5) {
        triggers.push({
          type: 'low_coverage',
          source: 'coverage_analysis',
          reason: `检测到覆盖盲区：${spot.reason}`,
          inputVector: spot.vector,
          suggestedRole: 'semantic',
          suggestedLabel: `盲区神经元_${uuidv4().slice(0, 8)}`,
          priority: spot.severity,
          timestamp: Date.now(),
        });
      }
    }
    
    return triggers;
  }

  /**
   * 检测新领域触发器
   */
  private detectNewDomainTriggers(
    neurons: Map<string, PredictiveNeuron>,
    recentInputs: Array<{ vector: number[]; content: string }>
  ): GenerationTrigger[] {
    const triggers: GenerationTrigger[] = [];
    
    // 统计现有领域
    const existingDomains = new Set<string>();
    for (const neuron of neurons.values()) {
      // 从receptiveField中提取领域
      const field = neuron.receptiveField;
      if (field) {
        existingDomains.add(field.split(':')[0]);
      }
    }
    
    // 简化实现：检测输入中是否有新主题
    // 实际应该使用更复杂的领域检测
    
    return triggers;
  }

  /**
   * 检测连接瓶颈触发器
   */
  private detectBottleneckTriggers(
    neurons: Map<string, PredictiveNeuron>
  ): GenerationTrigger[] {
    const triggers: GenerationTrigger[] = [];
    
    // 检测连接密度过高的神经元（可能是瓶颈）
    for (const [id, neuron] of neurons) {
      const outgoingCount = neuron.outgoingConnections.length;
      const incomingCount = neuron.incomingConnections.length;
      
      // 如果一个神经元的连接过多，可能需要中间神经元
      if (outgoingCount > 20 || incomingCount > 20) {
        triggers.push({
          type: 'connection_bottleneck',
          source: id,
          reason: `神经元 ${neuron.label} 连接过密（出${outgoingCount}/入${incomingCount}）`,
          parentNeuronId: id,
          suggestedRole: 'abstract',
          suggestedLabel: `${neuron.label}_hub`,
          priority: 0.4,
          timestamp: Date.now(),
        });
      }
    }
    
    return triggers;
  }

  /**
   * 生成新神经元
   */
  async generateNeuron(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): Promise<PredictiveNeuron | null> {
    // 检查数量限制
    if (neurons.size >= this.config.maxCount) {
      return null;
    }
    
    let sensitivityVector: number[];
    let role: NeuronRole;
    let label: string;
    let receptiveField: string;
    let level = 0;
    
    // 根据触发类型生成
    switch (trigger.type) {
      case 'high_surprise':
        return this.generateFromHighSurprise(trigger, neurons);
        
      case 'low_coverage':
        return this.generateFromBlindSpot(trigger, neurons);
        
      case 'new_domain':
        return this.generateFromNewDomain(trigger, neurons);
        
      case 'connection_bottleneck':
        return this.generateFromBottleneck(trigger, neurons);
        
      case 'user_interest':
        return this.generateFromUserInterest(trigger, neurons);
        
      case 'emergence':
        return this.generateFromEmergence(trigger, neurons);
        
      default:
        return null;
    }
  }

  /**
   * 从高惊讶度生成
   */
  private generateFromHighSurprise(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    const parent = neurons.get(trigger.parentNeuronId!);
    if (!parent) return null;
    
    // 创建专门化神经元
    // 敏感度 = 父神经元 + 输入方向的混合
    const parentVector = parent.sensitivityVector;
    const inputVector = trigger.inputVector || parentVector;
    
    const newSensitivity = parentVector.map((s, i) => {
      return 0.6 * s + 0.4 * (inputVector[i] || 0);
    });
    
    // 归一化
    const norm = Math.sqrt(newSensitivity.reduce((sum, x) => sum + x * x, 0));
    const normalized = newSensitivity.map(x => x / (norm || 1));
    
    const newNeuron = createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || `${parent.label}_specialized`,
      role: trigger.suggestedRole || parent.role,
      sensitivityVector: normalized,
      receptiveField: `专门化：${parent.receptiveField}`,
      creationReason: trigger.reason,
      level: parent.meta.level,
    });
    
    // 建立与父神经元的连接
    newNeuron.incomingConnections.push({
      targetId: parent.id,
      type: 'excitatory',
      strength: 0.5,
      efficiency: 1.0,
      delay: 0,
      hebbianRate: 0.1,
    });
    
    // 父神经元也建立到新神经元的连接
    parent.outgoingConnections.push({
      targetId: newNeuron.id,
      type: 'excitatory',
      strength: 0.3,
      efficiency: 1.0,
      delay: 0,
      hebbianRate: 0.1,
    });
    
    return newNeuron;
  }

  /**
   * 从盲区生成
   */
  private generateFromBlindSpot(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    if (!trigger.inputVector) return null;
    
    // 归一化输入向量
    const norm = Math.sqrt(trigger.inputVector.reduce((sum, x) => sum + x * x, 0));
    const normalized = trigger.inputVector.map(x => x / (norm || 1));
    
    const newNeuron = createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || `盲区神经元_${Date.now()}`,
      role: trigger.suggestedRole || 'semantic',
      sensitivityVector: normalized,
      receptiveField: `覆盖盲区`,
      creationReason: trigger.reason,
      level: 0,
    });
    
    // 寻找最近的神经元建立连接
    const nearestNeuron = this.findNearestNeuron(normalized, neurons);
    if (nearestNeuron) {
      newNeuron.incomingConnections.push({
        targetId: nearestNeuron.id,
        type: 'excitatory',
        strength: 0.3,
        efficiency: 1.0,
        delay: 0,
        hebbianRate: 0.1,
      });
    }
    
    return newNeuron;
  }

  /**
   * 从新领域生成
   */
  private generateFromNewDomain(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    if (!trigger.inputVector) return null;
    
    const norm = Math.sqrt(trigger.inputVector.reduce((sum, x) => sum + x * x, 0));
    const normalized = trigger.inputVector.map(x => x / (norm || 1));
    
    return createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || '新领域神经元',
      role: trigger.suggestedRole || 'abstract',
      sensitivityVector: normalized,
      receptiveField: `新领域`,
      creationReason: trigger.reason,
      level: 1,
    });
  }

  /**
   * 从瓶颈生成
   */
  private generateFromBottleneck(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    const parent = neurons.get(trigger.parentNeuronId!);
    if (!parent) return null;
    
    // 创建一个中间神经元
    const newNeuron = createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || `${parent.label}_hub`,
      role: 'abstract',
      sensitivityVector: parent.sensitivityVector,
      receptiveField: `中间层：${parent.receptiveField}`,
      creationReason: trigger.reason,
      level: parent.meta.level + 1,
    });
    
    return newNeuron;
  }

  /**
   * 从用户兴趣生成
   */
  private generateFromUserInterest(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    if (!trigger.inputVector) return null;
    
    const norm = Math.sqrt(trigger.inputVector.reduce((sum, x) => sum + x * x, 0));
    const normalized = trigger.inputVector.map(x => x / (norm || 1));
    
    return createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || '用户兴趣神经元',
      role: 'semantic',
      sensitivityVector: normalized,
      receptiveField: `用户兴趣`,
      creationReason: trigger.reason,
      level: 1,
    });
  }

  /**
   * 从涌现事件生成
   */
  private generateFromEmergence(
    trigger: GenerationTrigger,
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    // 涌现神经元代表多个神经元的共激活模式
    // 这里简化处理，实际应该分析共激活模式
    
    return createPredictiveNeuron(this.userId, {
      label: trigger.suggestedLabel || '涌现神经元',
      role: 'abstract',
      sensitivityVector: trigger.inputVector || new Array(100).fill(0).map(() => Math.random() * 2 - 1),
      receptiveField: `涌现概念`,
      creationReason: trigger.reason,
      level: 2,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 神经元修剪
  // ══════════════════════════════════════════════════════════════════

  /**
   * 修剪无效神经元
   */
  pruneNeurons(neurons: Map<string, PredictiveNeuron>): string[] {
    const pruned: string[] = [];
    const now = Date.now();
    
    for (const [id, neuron] of neurons) {
      const shouldPrune = this.shouldPruneNeuron(neuron, now);
      
      if (shouldPrune) {
        neurons.delete(id);
        pruned.push(id);
      }
    }
    
    return pruned;
  }

  /**
   * 判断是否应该修剪神经元
   */
  private shouldPruneNeuron(neuron: PredictiveNeuron, now: number): boolean {
    // 年龄检查
    const age = now - neuron.meta.createdAt;
    if (age < this.config.minAgeForPruning) return false;
    
    // 条件1：长期低效用 + 低激活
    const lowUsefulness = neuron.meta.usefulness < this.config.usefulnessThreshold;
    const lowActivation = neuron.actual.activation < this.config.activationThreshold;
    const lowUsage = neuron.meta.totalActivations < 5;
    
    if (lowUsefulness && lowActivation && lowUsage) return true;
    
    // 条件2：持续高误差
    const recentErrors = neuron.learning.errorHistory.slice(-20);
    const highError = recentErrors.length >= 20 &&
      recentErrors.every(e => Math.abs(e) > 0.4);
    
    if (highError) return true;
    
    // 条件3：无连接
    const noConnections = neuron.incomingConnections.length === 0 &&
      neuron.outgoingConnections.length === 0;
    
    if (noConnections && age > this.config.minAgeForPruning * 2) return true;
    
    return false;
  }

  // ══════════════════════════════════════════════════════════════════
  // 神经元合并
  // ══════════════════════════════════════════════════════════════════

  /**
   * 合并相似神经元
   */
  mergeSimilarNeurons(
    neurons: Map<string, PredictiveNeuron>
  ): Array<{ mergedInto: string; mergedFrom: string[] }> {
    const merged: Array<{ mergedInto: string; mergedFrom: string[] }> = [];
    
    // 分析相似性
    const analysis = this.analyzeSimilarity(neurons);
    
    for (const suggestion of analysis.mergeSuggestions) {
      const primary = neurons.get(suggestion.primaryId);
      if (!primary) continue;
      
      const mergedIds: string[] = [];
      
      for (const secondaryId of suggestion.secondaryIds) {
        const secondary = neurons.get(secondaryId);
        if (!secondary) continue;
        
        // 合并连接
        for (const conn of secondary.outgoingConnections) {
          if (!primary.outgoingConnections.find(c => c.targetId === conn.targetId)) {
            primary.outgoingConnections.push(conn);
          }
        }
        for (const conn of secondary.incomingConnections) {
          if (!primary.incomingConnections.find(c => c.targetId === conn.targetId)) {
            primary.incomingConnections.push(conn);
          }
        }
        
        // 更新主神经元的统计信息
        primary.meta.totalActivations += secondary.meta.totalActivations;
        primary.meta.usefulness = Math.max(primary.meta.usefulness, secondary.meta.usefulness);
        
        // 删除次要神经元
        neurons.delete(secondaryId);
        mergedIds.push(secondaryId);
      }
      
      if (mergedIds.length > 0) {
        merged.push({
          mergedInto: suggestion.primaryId,
          mergedFrom: mergedIds,
        });
      }
    }
    
    return merged;
  }

  /**
   * 分析神经元相似性
   */
  analyzeSimilarity(neurons: Map<string, PredictiveNeuron>): SimilarityAnalysis {
    const groups: SimilarityAnalysis['groups'] = [];
    const mergeSuggestions: SimilarityAnalysis['mergeSuggestions'] = [];
    
    const neuronList = Array.from(neurons.values());
    
    // 计算两两相似度
    const similarityMatrix: number[][] = [];
    for (let i = 0; i < neuronList.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < neuronList.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1;
        } else if (i > j) {
          similarityMatrix[i][j] = similarityMatrix[j][i];
        } else {
          similarityMatrix[i][j] = this.computeSimilarity(
            neuronList[i].sensitivityVector,
            neuronList[j].sensitivityVector
          );
        }
      }
    }
    
    // 找出相似的神经元组
    const visited = new Set<string>();
    
    for (let i = 0; i < neuronList.length; i++) {
      if (visited.has(neuronList[i].id)) continue;
      
      const group: string[] = [neuronList[i].id];
      let totalSimilarity = 0;
      
      for (let j = i + 1; j < neuronList.length; j++) {
        if (visited.has(neuronList[j].id)) continue;
        
        if (similarityMatrix[i][j] >= this.config.mergeSimilarityThreshold) {
          group.push(neuronList[j].id);
          totalSimilarity += similarityMatrix[i][j];
        }
      }
      
      if (group.length > 1) {
        const avgSimilarity = totalSimilarity / (group.length - 1);
        groups.push({
          neuronIds: group,
          averageSimilarity: avgSimilarity,
        });
        
        // 标记为已访问
        group.forEach(id => visited.add(id));
        
        // 生成合并建议
        if (group.length >= 2) {
          // 选择效用最高的作为主神经元
          const sorted = group.map(id => neurons.get(id)!).sort(
            (a, b) => b.meta.usefulness - a.meta.usefulness
          );
          
          mergeSuggestions.push({
            primaryId: sorted[0].id,
            secondaryIds: sorted.slice(1).map(n => n.id),
            reason: `相似度 ${avgSimilarity.toFixed(2)}，合并为 ${sorted[0].label}`,
          });
        }
      }
    }
    
    return { groups, mergeSuggestions };
  }

  // ══════════════════════════════════════════════════════════════════
  // 盲区检测
  // ══════════════════════════════════════════════════════════════════

  /**
   * 检测覆盖盲区
   */
  detectBlindSpots(
    neurons: Map<string, PredictiveNeuron>,
    recentInputs: Array<{ vector: number[]; content: string }>
  ): BlindSpot[] {
    const blindSpots: BlindSpot[] = [];
    
    for (const input of recentInputs) {
      const coverage = this.computeCoverage(input.vector, neurons);
      
      if (coverage.maxActivation < this.config.coverageThreshold) {
        blindSpots.push({
          vector: input.vector,
          reason: coverage.maxActivation === 0 ? 'no_activation' : 'low_coverage',
          severity: 1 - coverage.maxActivation,
          samples: [input.content],
        });
      }
    }
    
    return blindSpots;
  }

  /**
   * 计算输入的覆盖度
   */
  private computeCoverage(
    inputVector: number[],
    neurons: Map<string, PredictiveNeuron>
  ): { maxActivation: number; avgActivation: number; coveredBy: string[] } {
    let maxActivation = 0;
    let totalActivation = 0;
    const coveredBy: string[] = [];
    
    for (const [id, neuron] of neurons) {
      const similarity = this.computeSimilarity(inputVector, neuron.sensitivityVector);
      const activation = Math.max(0, similarity);
      
      if (activation > 0.3) {
        coveredBy.push(id);
      }
      
      maxActivation = Math.max(maxActivation, activation);
      totalActivation += activation;
    }
    
    return {
      maxActivation,
      avgActivation: neurons.size > 0 ? totalActivation / neurons.size : 0,
      coveredBy,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算向量相似度
   */
  private computeSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const norm = Math.sqrt(normA) * Math.sqrt(normB);
    return norm > 0 ? dotProduct / norm : 0;
  }

  /**
   * 找到最近的神经元
   */
  private findNearestNeuron(
    vector: number[],
    neurons: Map<string, PredictiveNeuron>
  ): PredictiveNeuron | null {
    let maxSimilarity = -1;
    let nearest: PredictiveNeuron | null = null;
    
    for (const neuron of neurons.values()) {
      const similarity = this.computeSimilarity(vector, neuron.sensitivityVector);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        nearest = neuron;
      }
    }
    
    return nearest;
  }

  /**
   * 生成摘要
   */
  private generateSummary(result: GenerationResult): string {
    const parts: string[] = [];
    
    if (result.created.length > 0) {
      parts.push(`创建 ${result.created.length} 个新神经元`);
    }
    if (result.pruned.length > 0) {
      parts.push(`修剪 ${result.pruned.length} 个无效神经元`);
    }
    if (result.merged.length > 0) {
      const totalMerged = result.merged.reduce((sum, m) => sum + m.mergedFrom.length, 0);
      parts.push(`合并 ${totalMerged} 个神经元`);
    }
    
    return parts.length > 0 ? parts.join('，') : '网络稳定，无需调整';
  }

  // ══════════════════════════════════════════════════════════════════
  // 手动操作
  // ══════════════════════════════════════════════════════════════════

  /**
   * 手动创建神经元
   */
  async createNeuronManually(
    neurons: Map<string, PredictiveNeuron>,
    options: {
      label: string;
      role: NeuronRole;
      sensitivityVector: number[];
      receptiveField: string;
    }
  ): Promise<PredictiveNeuron> {
    const trigger: GenerationTrigger = {
      type: 'manual',
      source: 'user',
      reason: '手动创建',
      inputVector: options.sensitivityVector,
      suggestedRole: options.role,
      suggestedLabel: options.label,
      priority: 1,
      timestamp: Date.now(),
    };
    
    const neuron = await this.generateNeuron(trigger, neurons);
    if (!neuron) {
      // 直接创建
      return createPredictiveNeuron(this.userId, {
        ...options,
        creationReason: '手动创建',
      });
    }
    
    return neuron;
  }

  // ══════════════════════════════════════════════════════════════════
  // 状态访问
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      historyLength: this.generationHistory.length,
      generationsByType: Object.fromEntries(this.stats.generationsByType),
    };
  }

  /**
   * 获取配置
   */
  getConfig(): NeuronGeneratorConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<NeuronGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

const neuronGenerators = new Map<string, NeuronGenerator>();

export function getNeuronGenerator(userId: string, config?: Partial<NeuronGeneratorConfig>): NeuronGenerator {
  if (!neuronGenerators.has(userId)) {
    neuronGenerators.set(userId, new NeuronGenerator(userId, config));
  }
  return neuronGenerators.get(userId)!;
}

export function resetNeuronGenerator(): void {
  neuronGenerators.clear();
}
