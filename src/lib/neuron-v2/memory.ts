/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆管理器：记忆的编码、巩固、回忆与遗忘
 * Memory Manager: Encoding, Consolidation, Recall, and Forgetting
 * 
 * 核心理念：
 * - 记忆不是存储，是连接模式的痕迹
 * - 回忆不是检索，是激活传播的状态重构
 * - 遗忘不是删除，是连接强度的衰减
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  NeuronId,
  ConnectionId,
  NetworkProjection,
} from './types';
import { NeuralNetwork } from './neural-network';
import { Influence } from './influence';
import { Neuron } from './neuron';
import { Connection } from './connection';

// ─────────────────────────────────────────────────────────────────────
// 记忆类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆类型
 */
export type MemoryType = 
  | 'episodic'    // 情节记忆：具体事件
  | 'semantic'    // 语义记忆：概念知识
  | 'procedural'  // 程序记忆：技能
  | 'emotional';  // 情绪记忆：情感体验

/**
 * 记忆记录（用于追踪记忆状态）
 */
export interface MemoryRecord {
  /**
   * 记忆ID
   */
  id: string;

  /**
   * 原始输入内容
   */
  content: string;

  /**
   * 记忆类型
   */
  type: MemoryType;

  /**
   * 创建时间
   */
  createdAt: number;

  /**
   * 最后回忆时间
   */
  lastRecalledAt?: number;

  /**
   * 回忆次数
   */
  recallCount: number;

  /**
   * 重要性 [0, 1]
   */
  importance: number;

  /**
   * 情绪强度 [0, 1]
   */
  emotionalIntensity: number;

  /**
   * 情绪效价 [-1, 1]，负=负面，正=正面
   */
  emotionalValence: number;

  /**
   * 当前记忆强度 [0, 1]
   */
  strength: number;

  /**
   * 是否已巩固
   */
  consolidated: boolean;

  /**
   * 相关神经元ID列表
   */
  relatedNeurons: NeuronId[];

  /**
   * 相关连接ID列表
   */
  relatedConnections: ConnectionId[];

  /**
   * 标签
   */
  tags: string[];
}

/**
 * 回忆结果
 */
export interface RecallResult {
  /**
   * 回忆是否成功
   */
  success: boolean;

  /**
   * 重构的记忆内容
   */
  content: string;

  /**
   * 置信度 [0, 1]
   */
  confidence: number;

  /**
   * 激活的关键神经元
   */
  activatedNeurons: Array<{
    id: NeuronId;
    label?: string;
    activation: number;
  }>;

  /**
   * 激活的关键连接
   */
  activatedConnections: Array<{
    from: NeuronId;
    to: NeuronId;
    strength: number;
  }>;

  /**
   * 相关的记忆记录
   */
  relatedMemories: MemoryRecord[];

  /**
   * 回忆时间戳
   */
  timestamp: number;
}

/**
 * 巩固任务
 */
export interface ConsolidationTask {
  /**
   * 任务ID
   */
  id: string;

  /**
   * 记忆记录ID
   */
  memoryId: string;

  /**
   * 原始影响模式
   */
  pattern: number[];

  /**
   * 计划巩固时间
   */
  scheduledAt: number;

  /**
   * 巩固次数
   */
  consolidationCount: number;

  /**
   * 最大巩固次数
   */
  maxConsolidations: number;
}

// ─────────────────────────────────────────────────────────────────────
// 记忆配置
// ─────────────────────────────────────────────────────────────────────

export interface MemoryConfig {
  /**
   * 是否启用记忆功能
   */
  enabled: boolean;

  /**
   * 短时记忆容量（最大激活神经元数）
   */
  shortTermCapacity: number;

  /**
   * 短时记忆衰减率
   */
  shortTermDecayRate: number;

  /**
   * 长时记忆衰减率
   */
  longTermDecayRate: number;

  /**
   * 巩固阈值（重要性超过此值触发巩固）
   */
  consolidationThreshold: number;

  /**
   * 巩固间隔（毫秒）
   */
  consolidationInterval: number;

  /**
   * 最大巩固次数
   */
  maxConsolidations: number;

  /**
   * 回忆激活阈值
   */
  recallActivationThreshold: number;

  /**
   * 回忆传播跳数
   */
  recallMaxHops: number;

  /**
   * 遗忘阈值（强度低于此值的连接将被删除）
   */
  forgetThreshold: number;
}

const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  enabled: true,
  shortTermCapacity: 7,
  shortTermDecayRate: 0.1,
  longTermDecayRate: 0.001,
  consolidationThreshold: 0.6,
  consolidationInterval: 60000, // 1分钟
  maxConsolidations: 5,
  recallActivationThreshold: 0.3,
  recallMaxHops: 5,
  forgetThreshold: 0.05,
};

// ─────────────────────────────────────────────────────────────────────
// 记忆管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆管理器
 * 
 * 管理记忆的编码、巩固、回忆与遗忘
 */
export class MemoryManager {
  private _network: NeuralNetwork;
  private _config: MemoryConfig;

  // 记忆记录存储
  private _memories: Map<string, MemoryRecord> = new Map();

  // 巩固队列
  private _consolidationQueue: ConsolidationTask[] = [];

  // 激活历史（用于巩固）
  private _activationHistory: Map<NeuronId, number[]> = new Map();

  // 构造函数
  constructor(network: NeuralNetwork, config: Partial<MemoryConfig> = {}) {
    this._network = network;
    this._config = { ...DEFAULT_MEMORY_CONFIG, ...config };
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get memories(): Map<string, MemoryRecord> {
    return this._memories;
  }

  get config(): MemoryConfig {
    return { ...this._config };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：编码（记忆）
  // ─────────────────────────────────────────────────────────────────

  /**
   * 编码新记忆
   * 
   * @param content 记忆内容
   * @param options 记忆选项
   * @returns 记录ID
   */
  async encode(
    content: string,
    options: {
      type?: MemoryType;
      importance?: number;
      emotionalIntensity?: number;
      emotionalValence?: number;
      tags?: string[];
    } = {}
  ): Promise<string> {
    if (!this._config.enabled) {
      throw new Error('Memory system is disabled');
    }

    const {
      type = 'episodic',
      importance = 0.5,
      emotionalIntensity = 0,
      emotionalValence = 0,
      tags = [],
    } = options;

    // 1. 创建记忆记录
    const record: MemoryRecord = {
      id: uuidv4(),
      content,
      type,
      createdAt: Date.now(),
      recallCount: 0,
      importance,
      emotionalIntensity,
      emotionalValence,
      strength: 1.0,
      consolidated: false,
      relatedNeurons: [],
      relatedConnections: [],
      tags,
    };

    // 2. 通过网络演化创建连接痕迹
    // 这里假设网络已经有编码器将content转换为影响
    const result = await this._encodeContent(content, importance, emotionalIntensity);

    record.relatedNeurons = result.neurons;
    record.relatedConnections = result.connections;

    // 3. 存储记录
    this._memories.set(record.id, record);

    // 4. 如果重要性高，加入巩固队列
    if (importance >= this._config.consolidationThreshold) {
      this._scheduleConsolidation(record, result.pattern);
    }

    return record.id;
  }

  /**
   * 编码内容到网络
   */
  private async _encodeContent(
    content: string,
    importance: number,
    emotionalIntensity: number
  ): Promise<{
    neurons: NeuronId[];
    connections: ConnectionId[];
    pattern: number[];
  }> {
    const neurons: NeuronId[] = [];
    const connections: ConnectionId[] = [];

    // 创建或激活相关神经元
    // 简化实现：将内容分词，每个词对应一个神经元
    const words = this._tokenize(content);
    const pattern: number[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // 创建或获取神经元
      let neuron = this._findNeuronByLabel(word);
      if (!neuron) {
        neuron = this._network.createNeuron({
          label: word,
          functionalRole: 'conceptual',
        });
      }

      neurons.push(neuron.id);

      // 记录激活模式
      pattern.push(0.5 + importance * 0.5);

      // 与前一个词建立连接
      if (i > 0) {
        const prevNeuronId = neurons[i - 1];
        const conn = this._network.createConnection(prevNeuronId, neuron.id, {
          strength: 0.3 + importance * 0.3 + emotionalIntensity * 0.2,
        });
        connections.push(conn.id);
      }
    }

    return { neurons, connections, pattern };
  }

  /**
   * 简单分词
   */
  private _tokenize(text: string): string[] {
    // 简化实现：按空格和标点分词
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * 根据标签查找神经元
   */
  private _findNeuronByLabel(label: string): Neuron | null {
    for (const neuron of this._network.neurons.values()) {
      if (neuron.label === label) {
        return neuron;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：回忆
  // ─────────────────────────────────────────────────────────────────

  /**
   * 回忆
   * 
   * 基于线索激活传播，重构记忆状态
   * 
   * @param cue 回忆线索
   * @returns 回忆结果
   */
  async recall(cue: string): Promise<RecallResult> {
    if (!this._config.enabled) {
      throw new Error('Memory system is disabled');
    }

    const timestamp = Date.now();

    // 1. 编码线索
    const cueWords = this._tokenize(cue);
    const activatedNeurons: RecallResult['activatedNeurons'] = [];
    const activatedConnections: RecallResult['activatedConnections'] = [];

    // 2. 激活线索对应的神经元
    for (const word of cueWords) {
      const neuron = this._findNeuronByLabel(word);
      if (neuron) {
        neuron.activate(0.8);
        activatedNeurons.push({
          id: neuron.id,
          label: neuron.label,
          activation: neuron.activation,
        });
      }
    }

    // 3. 执行多步演化，让激活传播
    for (let hop = 0; hop < this._config.recallMaxHops; hop++) {
      await this._network.evolve();

      // 收集激活的神经元和连接
      for (const neuron of this._network.neurons.values()) {
        if (neuron.activation > this._config.recallActivationThreshold) {
          if (!activatedNeurons.find(n => n.id === neuron.id)) {
            activatedNeurons.push({
              id: neuron.id,
              label: neuron.label,
              activation: neuron.activation,
            });
          }
        }
      }
    }

    // 4. 收集激活的连接
    for (const conn of this._network.connections.values()) {
      const fromNeuron = this._network.neurons.get(conn.from);
      const toNeuron = this._network.neurons.get(conn.to);

      if (fromNeuron && toNeuron) {
        if (fromNeuron.activation > this._config.recallActivationThreshold ||
            toNeuron.activation > this._config.recallActivationThreshold) {
          activatedConnections.push({
            from: conn.from,
            to: conn.to,
            strength: conn.strength,
          });
        }
      }
    }

    // 5. 生成回忆内容
    const content = this._generateRecallContent(activatedNeurons);

    // 6. 计算置信度
    const confidence = this._calculateRecallConfidence(activatedNeurons, activatedConnections);

    // 7. 查找相关记忆记录
    const relatedMemories = this._findRelatedMemories(activatedNeurons);

    // 8. 更新相关记忆记录
    for (const memory of relatedMemories) {
      memory.lastRecalledAt = timestamp;
      memory.recallCount++;
      // 回忆会加强记忆
      memory.strength = Math.min(1, memory.strength + 0.1);
    }

    return {
      success: activatedNeurons.length > 0,
      content,
      confidence,
      activatedNeurons,
      activatedConnections,
      relatedMemories,
      timestamp,
    };
  }

  /**
   * 生成回忆内容
   */
  private _generateRecallContent(
    neurons: RecallResult['activatedNeurons']
  ): string {
    // 按激活度排序
    const sorted = [...neurons].sort((a, b) => b.activation - a.activation);

    // 取前几个激活度最高的神经元
    const top = sorted.slice(0, 5);

    // 组合成回忆描述
    if (top.length === 0) {
      return '我什么也想不起来...';
    }

    const labels = top
      .filter(n => n.label)
      .map(n => n.label!)
      .join(' → ');

    return `我记得... ${labels}`;
  }

  /**
   * 计算回忆置信度
   */
  private _calculateRecallConfidence(
    neurons: RecallResult['activatedNeurons'],
    connections: RecallResult['activatedConnections']
  ): number {
    if (neurons.length === 0) return 0;

    // 基于激活神经元的数量和平均激活度
    const avgActivation = neurons.reduce((sum, n) => sum + n.activation, 0) / neurons.length;
    const connectionStrength = connections.length > 0
      ? connections.reduce((sum, c) => sum + c.strength, 0) / connections.length
      : 0;

    return (avgActivation + connectionStrength) / 2;
  }

  /**
   * 查找相关记忆记录
   */
  private _findRelatedMemories(
    neurons: RecallResult['activatedNeurons']
  ): MemoryRecord[] {
    const related: MemoryRecord[] = [];
    const neuronIds = new Set(neurons.map(n => n.id));

    for (const memory of this._memories.values()) {
      // 检查是否有重叠的神经元
      const overlap = memory.relatedNeurons.some(id => neuronIds.has(id));
      if (overlap) {
        related.push(memory);
      }
    }

    return related;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：巩固
  // ─────────────────────────────────────────────────────────────────

  /**
   * 计划巩固
   */
  private _scheduleConsolidation(
    record: MemoryRecord,
    pattern: number[]
  ): void {
    const task: ConsolidationTask = {
      id: uuidv4(),
      memoryId: record.id,
      pattern,
      scheduledAt: Date.now() + this._config.consolidationInterval,
      consolidationCount: 0,
      maxConsolidations: this._config.maxConsolidations,
    };

    this._consolidationQueue.push(task);
  }

  /**
   * 执行巩固
   * 
   * 重复激活以加强连接痕迹
   */
  async consolidate(): Promise<{
    processed: number;
    consolidated: string[];
  }> {
    const now = Date.now();
    const toProcess = this._consolidationQueue.filter(
      task => task.scheduledAt <= now
    );

    const consolidated: string[] = [];

    for (const task of toProcess) {
      const record = this._memories.get(task.memoryId);
      if (!record) continue;

      // 重新激活相关神经元
      for (const neuronId of record.relatedNeurons) {
        const neuron = this._network.neurons.get(neuronId);
        if (neuron) {
          neuron.activate(0.6);
        }
      }

      // 执行网络演化（应用Hebbian学习）
      await this._network.evolve();

      // 加强相关连接
      for (const connId of record.relatedConnections) {
        const conn = this._network.connections.get(connId);
        if (conn) {
          // 巩固增强：强度提升，衰减降低
          conn.modifyStrength(0.1 * record.importance, 'consolidation');
        }
      }

      // 更新任务状态
      task.consolidationCount++;

      if (task.consolidationCount >= task.maxConsolidations) {
        // 完成巩固
        record.consolidated = true;
        consolidated.push(record.id);

        // 从队列移除
        const index = this._consolidationQueue.indexOf(task);
        if (index > -1) {
          this._consolidationQueue.splice(index, 1);
        }
      } else {
        // 重新计划下一次巩固
        task.scheduledAt = now + this._config.consolidationInterval;
      }
    }

    return {
      processed: toProcess.length,
      consolidated,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：遗忘
  // ─────────────────────────────────────────────────────────────────

  /**
   * 应用衰减（遗忘）
   */
  applyDecay(): {
    neuronsDecayed: number;
    connectionsPruned: number;
    memoriesForgotten: string[];
  } {
    const result = {
      neuronsDecayed: 0,
      connectionsPruned: 0,
      memoriesForgotten: [] as string[],
    };

    // 1. 连接衰减
    for (const conn of this._network.connections.values()) {
      // 获取相关记忆
      const relatedMemory = this._findMemoryByConnection(conn.id);

      // 计算衰减率
      let decayRate = this._config.longTermDecayRate;

      if (relatedMemory) {
        // 巩固的记忆衰减更慢
        if (relatedMemory.consolidated) {
          decayRate *= 0.3;
        }
        // 重要的记忆衰减更慢
        decayRate *= (1 - relatedMemory.importance * 0.5);
        // 情绪强烈的记忆衰减更慢
        decayRate *= (1 - relatedMemory.emotionalIntensity * 0.3);
      }

      // 应用衰减（使用modifyStrength方法）
      conn.modifyStrength(-decayRate * conn.strength, 'memory_decay');

      // 低于阈值则删除
      if (conn.strength < this._config.forgetThreshold) {
        this._network.removeConnection(conn.id);
        result.connectionsPruned++;
      }
    }

    // 2. 记忆记录衰减
    for (const [id, memory] of this._memories) {
      // 记忆强度衰减
      const timeSinceLastRecall = memory.lastRecalledAt
        ? Date.now() - memory.lastRecalledAt
        : Date.now() - memory.createdAt;

      // 艾宾浩斯遗忘曲线的简化版本
      const daysSinceRecall = timeSinceLastRecall / (1000 * 60 * 60 * 24);
      const retention = Math.exp(-daysSinceRecall / 7); // 7天半衰期

      memory.strength *= (0.9 + 0.1 * retention);

      // 强度过低则遗忘
      if (memory.strength < 0.1) {
        this._memories.delete(id);
        result.memoriesForgotten.push(id);
      }
    }

    return result;
  }

  /**
   * 根据连接ID查找记忆
   */
  private _findMemoryByConnection(connId: ConnectionId): MemoryRecord | null {
    for (const memory of this._memories.values()) {
      if (memory.relatedConnections.includes(connId)) {
        return memory;
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 获取所有记忆
   */
  getAllMemories(): MemoryRecord[] {
    return Array.from(this._memories.values());
  }

  /**
   * 获取指定记忆
   */
  getMemory(id: string): MemoryRecord | undefined {
    return this._memories.get(id);
  }

  /**
   * 按类型获取记忆
   */
  getMemoriesByType(type: MemoryType): MemoryRecord[] {
    return this.getAllMemories().filter(m => m.type === type);
  }

  /**
   * 按标签获取记忆
   */
  getMemoriesByTag(tag: string): MemoryRecord[] {
    return this.getAllMemories().filter(m => m.tags.includes(tag));
  }

  /**
   * 获取记忆统计
   */
  getStats(): {
    total: number;
    byType: Record<MemoryType, number>;
    consolidated: number;
    averageStrength: number;
    pendingConsolidation: number;
  } {
    const all = this.getAllMemories();
    const byType: Record<MemoryType, number> = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
      emotional: 0,
    };

    let consolidated = 0;
    let totalStrength = 0;

    for (const memory of all) {
      byType[memory.type]++;
      if (memory.consolidated) consolidated++;
      totalStrength += memory.strength;
    }

    return {
      total: all.length,
      byType,
      consolidated,
      averageStrength: all.length > 0 ? totalStrength / all.length : 0,
      pendingConsolidation: this._consolidationQueue.length,
    };
  }

  /**
   * 清除所有记忆
   */
  clear(): void {
    this._memories.clear();
    this._consolidationQueue = [];
    this._activationHistory.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建记忆管理器
 */
export function createMemoryManager(
  network: NeuralNetwork,
  config: Partial<MemoryConfig> = {}
): MemoryManager {
  return new MemoryManager(network, config);
}
