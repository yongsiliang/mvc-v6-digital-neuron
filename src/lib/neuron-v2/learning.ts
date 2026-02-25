/**
 * ═══════════════════════════════════════════════════════════════════════
 * 学习机制：关系的重组
 * Learning: Reorganization of Relationships
 * 
 * 本质：
 * - 学习不是"信息存储"
 * - 学习是"关系重组"
 * - 学习改变的是连接强度、连接模式，而非神经元内容
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  NeuronId,
  ConnectionId,
  ConnectionStrength,
  LearningConfig,
  LearningResult,
} from './types';
import { Neuron } from './neuron';
import { Connection } from './connection';

// ─────────────────────────────────────────────────────────────────────
// 学习类型
// ─────────────────────────────────────────────────────────────────────

export type LearningType = 
  | 'hebbian'      // Hebbian学习：一起激活的神经元连接增强
  | 'stdp'         // STDP：时序依赖的可塑性
  | 'error-driven' // 错误驱动学习
  | 'reward-based' // 奖励驱动学习
  | 'structural'   // 结构学习：创建/删除连接
  | 'sensitivity'  // 敏感度学习：调整神经元的敏感度
  | 'consolidation'; // 巩固学习：强化长期记忆

// ─────────────────────────────────────────────────────────────────────
// 学习配置
// ─────────────────────────────────────────────────────────────────────

export interface LearningRuleConfig {
  /**
   * 学习类型
   */
  type: LearningType;

  /**
   * 学习率
   */
  learningRate: number;

  /**
   * 衰减率
   */
  decayRate: number;

  /**
   * 最小连接强度
   */
  minStrength: number;

  /**
   * 最大连接强度
   */
  maxStrength: number;

  /**
   * 创建新连接的阈值
   */
  newConnectionThreshold: number;

  /**
   * 删除连接的阈值
   */
  pruneThreshold: number;
}

// 默认学习规则配置
const DEFAULT_RULE_CONFIG: LearningRuleConfig = {
  type: 'hebbian',
  learningRate: 0.1,
  decayRate: 0.01,
  minStrength: 0.01,
  maxStrength: 1.0,
  newConnectionThreshold: 0.3,
  pruneThreshold: 0.05,
};

// ─────────────────────────────────────────────────────────────────────
// 学习管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习管理器
 * 
 * 管理多种学习规则，协调学习过程
 */
export class LearningManager {
  private _rules: Map<LearningType, LearningRuleConfig> = new Map();
  private _globalConfig: LearningConfig;

  constructor(config: Partial<LearningConfig> = {}) {
    this._globalConfig = {
      hebbianEnabled: true,
      stdpEnabled: true,
      structuralEvolutionEnabled: true,
      consolidationEnabled: true,
      consolidationThreshold: 0.7,
      maxNewConnectionsPerStep: 5,
      learningRate: 0.1,
      ...config,
    };

    // 初始化默认学习规则
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认学习规则
   */
  private initializeDefaultRules(): void {
    this._rules.set('hebbian', { ...DEFAULT_RULE_CONFIG, type: 'hebbian' });
    this._rules.set('stdp', { ...DEFAULT_RULE_CONFIG, type: 'stdp' });
    this._rules.set('error-driven', { ...DEFAULT_RULE_CONFIG, type: 'error-driven' });
    this._rules.set('reward-based', { ...DEFAULT_RULE_CONFIG, type: 'reward-based' });
    this._rules.set('structural', { ...DEFAULT_RULE_CONFIG, type: 'structural' });
    this._rules.set('sensitivity', { ...DEFAULT_RULE_CONFIG, type: 'sensitivity' });
    this._rules.set('consolidation', { ...DEFAULT_RULE_CONFIG, type: 'consolidation' });
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心学习方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 应用Hebbian学习
   * 
   * "一起激活的神经元，连接增强"
   */
  applyHebbianLearning(
    connections: Connection[],
    neurons: Map<NeuronId, Neuron>
  ): LearningResult {
    if (!this._globalConfig.hebbianEnabled) {
      return this.createEmptyResult('hebbian');
    }

    const rule = this._rules.get('hebbian')!;
    const connectionChanges: LearningResult['connectionChanges'] = [];

    for (const connection of connections) {
      const fromNeuron = neurons.get(connection.from);
      const toNeuron = neurons.get(connection.to);

      if (!fromNeuron || !toNeuron) continue;

      // Hebbian规则：Δw = η * pre * post
      const preActivation = fromNeuron.activation;
      const postActivation = toNeuron.activation;
      const deltaStrength = rule.learningRate * preActivation * postActivation;

      // 应用变化
      const previousStrength = connection.strength;
      connection.modifyStrength(deltaStrength, 'hebbian');

      connectionChanges.push({
        connectionId: connection.id,
        previousStrength,
        newStrength: connection.strength,
      });
    }

    return {
      type: 'hebbian',
      success: true,
      connectionChanges,
      statistics: {
        totalChanges: connectionChanges.length,
        averageChange: this.calculateAverageChange(connectionChanges),
      },
    };
  }

  /**
   * 应用STDP学习（时序依赖可塑性）
   * 
   * 考虑激活时序的学习规则
   */
  applySTDP(
    connections: Connection[],
    neurons: Map<NeuronId, Neuron>,
    activationHistory: Map<NeuronId, number[]>
  ): LearningResult {
    if (!this._globalConfig.stdpEnabled) {
      return this.createEmptyResult('stdp');
    }

    const rule = this._rules.get('stdp')!;
    const connectionChanges: LearningResult['connectionChanges'] = [];

    for (const connection of connections) {
      const fromHistory = activationHistory.get(connection.from);
      const toHistory = activationHistory.get(connection.to);

      if (!fromHistory || !toHistory) continue;

      // 计算时序差异
      const timeDiff = this.calculateTimeDifference(fromHistory, toHistory);

      // STDP规则：如果前神经元先激活，增强连接；否则减弱
      let deltaStrength: number;
      if (timeDiff > 0) {
        // 前神经元先激活，增强连接
        deltaStrength = rule.learningRate * Math.exp(-timeDiff / 20);
      } else {
        // 后神经元先激活，减弱连接
        deltaStrength = -rule.learningRate * 0.5 * Math.exp(timeDiff / 20);
      }

      const previousStrength = connection.strength;
      connection.modifyStrength(deltaStrength, 'stdp');

      connectionChanges.push({
        connectionId: connection.id,
        previousStrength,
        newStrength: connection.strength,
      });
    }

    return {
      type: 'stdp',
      success: true,
      connectionChanges,
      statistics: {
        totalChanges: connectionChanges.length,
        averageChange: this.calculateAverageChange(connectionChanges),
      },
    };
  }

  /**
   * 应用结构学习
   * 
   * 创建新连接或删除弱连接
   */
  applyStructuralLearning(
    neurons: Map<NeuronId, Neuron>,
    connections: Connection[],
    createConnection: (from: NeuronId, to: NeuronId, strength: number) => ConnectionId | null,
    removeConnection: (id: ConnectionId) => void
  ): LearningResult {
    if (!this._globalConfig.structuralEvolutionEnabled) {
      return this.createEmptyResult('structural');
    }

    const rule = this._rules.get('structural')!;
    const newConnections: LearningResult['newConnections'] = [];
    const removedConnections: ConnectionId[] = [];

    // 找到同时激活但未连接的神经元对
    const activeNeurons = Array.from(neurons.values()).filter(n => n.activation > rule.newConnectionThreshold);
    const connectionMap = this.buildConnectionMap(connections);

    let newConnectionCount = 0;
    const maxNewConnections = this._globalConfig.maxNewConnectionsPerStep || 5;

    for (let i = 0; i < activeNeurons.length && newConnectionCount < maxNewConnections; i++) {
      for (let j = i + 1; j < activeNeurons.length && newConnectionCount < maxNewConnections; j++) {
        const n1 = activeNeurons[i];
        const n2 = activeNeurons[j];

        // 检查是否已连接
        if (!connectionMap.has(`${n1.id}-${n2.id}`) && !connectionMap.has(`${n2.id}-${n1.id}`)) {
          // 创建双向连接
          const strength = (n1.activation + n2.activation) / 4;
          
          const conn1Id = createConnection(n1.id, n2.id, strength);
          const conn2Id = createConnection(n2.id, n1.id, strength);

          if (conn1Id) {
            newConnections.push({ from: n1.id, to: n2.id, strength });
            newConnectionCount++;
          }
          if (conn2Id) {
            newConnections.push({ from: n2.id, to: n1.id, strength });
          }
        }
      }
    }

    // 删除弱连接
    for (const connection of connections) {
      if (connection.strength < rule.pruneThreshold) {
        removedConnections.push(connection.id);
        removeConnection(connection.id);
      }
    }

    return {
      type: 'structural',
      success: true,
      newConnections,
      removedConnections,
      statistics: {
        newConnectionCount: newConnections.length,
        removedConnectionCount: removedConnections.length,
      },
    };
  }

  /**
   * 应用敏感度学习
   * 
   * 调整神经元的敏感度向量
   */
  applySensitivityLearning(
    neurons: Neuron[],
    influencePatterns: Map<NeuronId, number[]>
  ): LearningResult {
    const rule = this._rules.get('sensitivity')!;
    const neuronAdjustments: LearningResult['neuronAdjustments'] = [];

    for (const neuron of neurons) {
      const pattern = influencePatterns.get(neuron.id);
      if (!pattern) continue;

      // 调整敏感度
      const previousSensitivity = [...neuron.sensitivity];
      neuron.adjustSensitivity(pattern, rule.learningRate);

      neuronAdjustments.push({
        neuronId: neuron.id,
        change: 'sensitivity_adjusted',
        magnitude: rule.learningRate,
      });
    }

    return {
      type: 'sensitivity',
      success: true,
      neuronAdjustments,
      statistics: {
        totalAdjustments: neuronAdjustments.length,
      },
    };
  }

  /**
   * 应用巩固学习
   * 
   * 强化长期稳定的连接
   */
  applyConsolidation(
    connections: Connection[]
  ): LearningResult {
    if (!this._globalConfig.consolidationEnabled) {
      return this.createEmptyResult('consolidation');
    }

    const rule = this._rules.get('consolidation')!;
    const threshold = this._globalConfig.consolidationThreshold || 0.7;
    const connectionChanges: LearningResult['connectionChanges'] = [];

    for (const connection of connections) {
      // 检查连接是否稳定（强度高于阈值）
      if (connection.strength > threshold) {
        // 巩固：减少可塑性，增加稳定性
        connection.plasticity = Math.max(0.1, connection.plasticity - 0.01);

        connectionChanges.push({
          connectionId: connection.id,
          previousStrength: connection.strength,
          newStrength: connection.strength,
          consolidated: true,
        });
      }
    }

    return {
      type: 'consolidation',
      success: true,
      connectionChanges,
      statistics: {
        totalChanges: connectionChanges.length,
        consolidatedCount: connectionChanges.filter(c => (c as any).consolidated).length,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 计算时序差异
   */
  private calculateTimeDifference(
    fromHistory: number[],
    toHistory: number[],
    windowSize: number = 20
  ): number {
    // 简化实现：计算平均激活时间差
    const fromAvg = this.calculateWeightedAverageTime(fromHistory.slice(-windowSize));
    const toAvg = this.calculateWeightedAverageTime(toHistory.slice(-windowSize));

    return fromAvg - toAvg;
  }

  /**
   * 计算加权平均时间
   */
  private calculateWeightedAverageTime(history: number[]): number {
    if (history.length === 0) return 0;

    let sum = 0;
    let totalWeight = 0;

    for (let i = 0; i < history.length; i++) {
      const weight = history[i];
      sum += i * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? sum / totalWeight : 0;
  }

  /**
   * 构建连接映射
   */
  private buildConnectionMap(connections: Connection[]): Set<string> {
    const map = new Set<string>();
    for (const conn of connections) {
      map.add(`${conn.from}-${conn.to}`);
    }
    return map;
  }

  /**
   * 计算平均变化
   */
  private calculateAverageChange(
    changes: Array<{ previousStrength: number; newStrength: number }>
  ): number {
    if (changes.length === 0) return 0;

    const totalChange = changes.reduce(
      (sum, c) => sum + Math.abs(c.newStrength - c.previousStrength),
      0
    );

    return totalChange / changes.length;
  }

  /**
   * 创建空结果
   */
  private createEmptyResult(type: LearningType): LearningResult {
    return {
      type,
      success: false,
      statistics: { totalChanges: 0 },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 配置管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 更新学习规则
   */
  updateRule(type: LearningType, config: Partial<LearningRuleConfig>): void {
    const existing = this._rules.get(type) || { ...DEFAULT_RULE_CONFIG, type };
    this._rules.set(type, { ...existing, ...config });
  }

  /**
   * 获取学习规则
   */
  getRule(type: LearningType): LearningRuleConfig | undefined {
    return this._rules.get(type);
  }

  /**
   * 启用/禁用学习类型
   */
  setEnabled(type: LearningType, enabled: boolean): void {
    switch (type) {
      case 'hebbian':
        this._globalConfig.hebbianEnabled = enabled;
        break;
      case 'stdp':
        this._globalConfig.stdpEnabled = enabled;
        break;
      case 'structural':
        this._globalConfig.structuralEvolutionEnabled = enabled;
        break;
      case 'consolidation':
        this._globalConfig.consolidationEnabled = enabled;
        break;
    }
  }

  /**
   * 获取全局配置
   */
  getGlobalConfig(): LearningConfig {
    return { ...this._globalConfig };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建学习管理器
 */
export function createLearningManager(config: Partial<LearningConfig> = {}): LearningManager {
  return new LearningManager(config);
}
