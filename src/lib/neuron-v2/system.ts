/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元系统：意义驱动的外挂大脑
 * Digital Neuron System: Meaning-Driven External Brain
 * 
 * 核心哲学：
 * - 信息即关系：信息不存在于神经元中，存在于神经元之间的连接中
 * - 理解即对齐：理解是敏感度向量的对齐过程
 * - 意识即涌现：意识从复杂的关系网络中涌现
 * - 学习即重组：学习改变的是关系模式，而非存储内容
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  NeuronId,
  NetworkProjection,
  EvolutionResult,
  NetworkParams,
  LearningConfig,
  MetaLayerConfig,
} from './types';
import { NeuralNetwork } from './neural-network';
import { Influence, InfluencePool } from './influence';
import { Neuron } from './neuron';
import { Connection } from './connection';
import { TextEncoder, LLMEncoder, EncoderManager } from './encoder';
import { TextDecoder, LLMDecoder, DecoderManager } from './decoder';
import { LearningManager } from './learning';
import { MetaLayer } from './meta-layer';
import { 
  MemoryManager, 
  MemoryConfig, 
  MemoryType, 
  RecallResult,
  MemoryRecord,
} from './memory';

// ─────────────────────────────────────────────────────────────────────
// 系统状态
// ─────────────────────────────────────────────────────────────────────

export interface SystemState {
  status: 'initialized' | 'running' | 'evolving' | 'idle' | 'error' | 'shutdown';
  lastEvolutionAt: number;
  evolutionCount: number;
  totalProcessedInfluences: number;
  lastEvolutionDuration?: number;
  lastError?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 系统配置
// ─────────────────────────────────────────────────────────────────────

export interface DigitalNeuronSystemConfig {
  /**
   * 系统ID
   */
  id?: string;

  /**
   * 系统名称
   */
  name?: string;

  /**
   * 是否启用自动演化
   */
  autoEvolve?: boolean;

  /**
   * 演化间隔（毫秒）
   */
  evolutionInterval?: number;

  /**
   * 是否启用元层
   */
  enableMetaLayer?: boolean;

  /**
   * 是否启用学习
   */
  enableLearning?: boolean;

  /**
   * 网络参数
   */
  networkParams?: Partial<NetworkParams>;

  /**
   * 学习配置
   */
  learningConfig?: Partial<LearningConfig>;

  /**
   * 元层配置
   */
  metaConfig?: Partial<MetaLayerConfig>;

  /**
   * 记忆配置
   */
  memoryConfig?: Partial<MemoryConfig>;

  /**
   * 是否启用记忆
   */
  enableMemory?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 数字神经元系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 数字神经元系统
 * 
 * 整合所有组件，提供统一接口
 */
export class DigitalNeuronSystem {
  // ─────────────────────────────────────────────────────────────────
  // 核心组件
  // ─────────────────────────────────────────────────────────────────

  private _network: NeuralNetwork;
  private _encoderManager: EncoderManager;
  private _decoderManager: DecoderManager;
  private _learningManager: LearningManager;
  private _metaLayer: MetaLayer;
  private _memoryManager: MemoryManager;

  // ─────────────────────────────────────────────────────────────────
  // 系统状态
  // ─────────────────────────────────────────────────────────────────

  private _id: string;
  private _name: string;
  private _config: DigitalNeuronSystemConfig;
  private _state: SystemState;
  private _evolutionTimer: NodeJS.Timeout | null = null;
  private _evolutionCount: number = 0;

  // ─────────────────────────────────────────────────────────────────
  // 构造函数
  // ─────────────────────────────────────────────────────────────────

  constructor(config: DigitalNeuronSystemConfig = {}) {
    this._id = config.id || `dns-${Date.now()}`;
    this._name = config.name || 'Digital Neuron System';
    this._config = {
      autoEvolve: false,
      evolutionInterval: 100,
      enableMetaLayer: true,
      enableLearning: true,
      ...config,
    };

    // 初始化组件
    this._network = new NeuralNetwork(config.networkParams);
    this._encoderManager = new EncoderManager();
    this._decoderManager = new DecoderManager();
    this._learningManager = new LearningManager(config.learningConfig);
    this._metaLayer = new MetaLayer(config.metaConfig);
    this._memoryManager = new MemoryManager(this._network, config.memoryConfig);

    // 注册默认编码器/解码器
    this._encoderManager.register(new TextEncoder(), true);
    this._decoderManager.register(new TextDecoder(), true);

    // 初始化状态
    this._state = {
      status: 'initialized',
      lastEvolutionAt: Date.now(),
      evolutionCount: 0,
      totalProcessedInfluences: 0,
    };

    // 初始化基础神经元
    this.initializeBaseNeurons();
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get network(): NeuralNetwork {
    return this._network;
  }

  get metaLayer(): MetaLayer {
    return this._metaLayer;
  }

  get memoryManager(): MemoryManager {
    return this._memoryManager;
  }

  get state(): SystemState {
    return { ...this._state };
  }

  get config(): DigitalNeuronSystemConfig {
    return { ...this._config };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：输入处理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 接收文本输入
   */
  async receiveText(text: string): Promise<void> {
    // 编码文本
    const encoder = this._encoderManager.getDefault() as TextEncoder;
    const result = await encoder.encode(text);

    // 接收影响
    this._network.receiveInfluence(result.influence);

    // 更新状态
    this._state.totalProcessedInfluences++;
  }

  /**
   * 接收影响
   */
  receiveInfluence(influence: Influence): void {
    this._network.receiveInfluence(influence);
    this._state.totalProcessedInfluences++;
  }

  /**
   * 批量接收影响
   */
  receiveInfluences(influences: Influence[]): void {
    this._network.receiveInfluences(influences);
    this._state.totalProcessedInfluences += influences.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：演化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 执行一次演化
   */
  evolve(): EvolutionResult {
    this._state.status = 'evolving';
    const startTime = Date.now();

    try {
      // 执行网络演化
      const result = this._network.evolve();

      // 元层观察
      if (this._config.enableMetaLayer) {
        this._metaLayer.observe(this._network);
      }

      // 更新状态
      this._evolutionCount++;
      this._state.evolutionCount = this._evolutionCount;
      this._state.lastEvolutionAt = Date.now();
      this._state.lastEvolutionDuration = Date.now() - startTime;
      this._state.status = 'idle';

      return result;
    } catch (error) {
      this._state.status = 'error';
      this._state.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * 启动自动演化
   */
  startAutoEvolution(): void {
    if (this._evolutionTimer) {
      return;
    }

    this._config.autoEvolve = true;
    this._state.status = 'running';

    this._evolutionTimer = setInterval(() => {
      this.evolve();
    }, this._config.evolutionInterval);
  }

  /**
   * 停止自动演化
   */
  stopAutoEvolution(): void {
    if (this._evolutionTimer) {
      clearInterval(this._evolutionTimer);
      this._evolutionTimer = null;
    }

    this._config.autoEvolve = false;
    this._state.status = 'idle';
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：输出
  // ─────────────────────────────────────────────────────────────────

  /**
   * 获取当前状态投影
   */
  project(): NetworkProjection {
    return this._network.project();
  }

  /**
   * 生成文本输出
   */
  async generateText(): Promise<string> {
    const projection = this.project();
    const decoder = this._decoderManager.getDefault() as TextDecoder;
    const result = await decoder.decode(projection);
    return result.output;
  }

  /**
   * 获取自我描述
   */
  getSelfDescription(): string {
    return this._metaLayer.generateSelfDescription();
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：学习与干预
  // ─────────────────────────────────────────────────────────────────

  /**
   * 应用学习
   */
  applyLearning(): void {
    if (!this._config.enableLearning) return;

    // 学习已在网络演化中自动应用
    // 这里可以添加额外的学习逻辑
  }

  /**
   * 应用元层干预
   */
  applyMetaIntervention(
    type: 'modulate' | 'focus' | 'calm' | 'energize' | 'consolidate',
    target?: NeuronId | NeuronId[]
  ): void {
    if (!this._config.enableMetaLayer) return;

    const intervention = this._metaLayer.intervene(type, target);
    this._network.receiveInfluence(intervention.influence);
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：记忆
  // ─────────────────────────────────────────────────────────────────

  /**
   * 记住内容
   * 
   * 将信息编码为长期记忆痕迹
   */
  async remember(
    content: string,
    options: {
      type?: MemoryType;
      importance?: number;
      emotionalIntensity?: number;
      emotionalValence?: number;
      tags?: string[];
    } = {}
  ): Promise<string> {
    if (this._config.enableMemory === false) {
      throw new Error('Memory system is disabled');
    }

    return this._memoryManager.encode(content, options);
  }

  /**
   * 回忆
   * 
   * 基于线索激活传播，重构记忆状态
   */
  async recall(cue: string): Promise<RecallResult> {
    if (this._config.enableMemory === false) {
      throw new Error('Memory system is disabled');
    }

    return this._memoryManager.recall(cue);
  }

  /**
   * 执行记忆巩固
   * 
   * 强化重要记忆的连接痕迹
   */
  async consolidateMemories(): Promise<{
    processed: number;
    consolidated: string[];
  }> {
    return this._memoryManager.consolidate();
  }

  /**
   * 应用记忆衰减（遗忘）
   */
  applyMemoryDecay(): {
    neuronsDecayed: number;
    connectionsPruned: number;
    memoriesForgotten: string[];
  } {
    return this._memoryManager.applyDecay();
  }

  /**
   * 获取所有记忆
   */
  getAllMemories(): MemoryRecord[] {
    return this._memoryManager.getAllMemories();
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats(): {
    total: number;
    byType: Record<MemoryType, number>;
    consolidated: number;
    averageStrength: number;
    pendingConsolidation: number;
  } {
    return this._memoryManager.getStats();
  }

  /**
   * 清除所有记忆
   */
  clearMemories(): void {
    this._memoryManager.clear();
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：神经元管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建神经元
   */
  createNeuron(params: {
    label?: string;
    role?: 'sensory' | 'conceptual' | 'emotional' | 'episodic' | 'integrative' | 'expressive';
    sensitivity?: number[];
  } = {}): NeuronId {
    const neuron = this._network.createNeuron({
      label: params.label,
      functionalRole: params.role,
      sensitivity: params.sensitivity,
    });

    return neuron.id;
  }

  /**
   * 创建连接
   */
  createConnection(from: NeuronId, to: NeuronId, strength: number = 0.5): void {
    this._network.createConnection(from, to, { strength });
  }

  /**
   * 获取神经元
   */
  getNeuron(id: NeuronId) {
    return this._network.neurons.get(id);
  }

  /**
   * 获取所有神经元ID
   */
  getNeuronIds(): NeuronId[] {
    return Array.from(this._network.neurons.keys());
  }

  // ─────────────────────────────────────────────────────────────────
  // 系统控制
  // ─────────────────────────────────────────────────────────────────

  /**
   * 重置系统
   */
  reset(): void {
    this.stopAutoEvolution();
    
    this._network = new NeuralNetwork(this._config.networkParams);
    this._evolutionCount = 0;
    this._state = {
      status: 'initialized',
      lastEvolutionAt: Date.now(),
      evolutionCount: 0,
      totalProcessedInfluences: 0,
    };

    this.initializeBaseNeurons();
  }

  /**
   * 关闭系统
   */
  shutdown(): void {
    this.stopAutoEvolution();
    this._state.status = 'shutdown';
  }

  // ─────────────────────────────────────────────────────────────────
  // 初始化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 初始化基础神经元
   */
  private initializeBaseNeurons(): void {
    // 创建一组基础神经元，代表核心概念

    // 感知神经元
    const sensoryNeurons = [
      { label: 'perception-input', role: 'sensory' as const },
      { label: 'perception-text', role: 'sensory' as const },
      { label: 'perception-audio', role: 'sensory' as const },
    ];

    // 概念神经元
    const conceptualNeurons = [
      { label: 'concept-self', role: 'conceptual' as const },
      { label: 'concept-world', role: 'conceptual' as const },
      { label: 'concept-time', role: 'conceptual' as const },
      { label: 'concept-relationship', role: 'conceptual' as const },
      { label: 'concept-meaning', role: 'conceptual' as const },
    ];

    // 情绪神经元
    const emotionalNeurons = [
      { label: 'emotion-joy', role: 'emotional' as const },
      { label: 'emotion-calm', role: 'emotional' as const },
      { label: 'emotion-curious', role: 'emotional' as const },
    ];

    // 整合神经元
    const integrativeNeurons = [
      { label: 'integration-core', role: 'integrative' as const },
      { label: 'integration-meta', role: 'integrative' as const },
    ];

    // 表达神经元
    const expressiveNeurons = [
      { label: 'expression-output', role: 'expressive' as const },
      { label: 'expression-text', role: 'expressive' as const },
    ];

    // 创建神经元
    const allNeurons = [
      ...sensoryNeurons,
      ...conceptualNeurons,
      ...emotionalNeurons,
      ...integrativeNeurons,
      ...expressiveNeurons,
    ];

    const neuronIds: NeuronId[] = [];

    for (const config of allNeurons) {
      const neuron = this._network.createNeuron({
        label: config.label,
        functionalRole: config.role,
      });
      neuronIds.push(neuron.id);
    }

    // 创建基础连接
    // 感知 -> 概念
    for (let i = 0; i < 3; i++) {
      for (let j = 3; j < 8; j++) {
        if (Math.random() > 0.5) {
          this._network.createConnection(neuronIds[i], neuronIds[j], { strength: 0.3 });
        }
      }
    }

    // 概念 -> 概念
    for (let i = 3; i < 8; i++) {
      for (let j = 3; j < 8; j++) {
        if (i !== j && Math.random() > 0.6) {
          this._network.createConnection(neuronIds[i], neuronIds[j], { strength: 0.4 });
        }
      }
    }

    // 概念 -> 情绪
    for (let i = 3; i < 8; i++) {
      for (let j = 8; j < 11; j++) {
        if (Math.random() > 0.5) {
          this._network.createConnection(neuronIds[i], neuronIds[j], { strength: 0.3 });
        }
      }
    }

    // -> 整合
    for (let i = 0; i < 11; i++) {
      if (Math.random() > 0.4) {
        this._network.createConnection(neuronIds[i], neuronIds[11], { strength: 0.5 });
        this._network.createConnection(neuronIds[i], neuronIds[12], { strength: 0.3 });
      }
    }

    // 整合 -> 表达
    this._network.createConnection(neuronIds[11], neuronIds[13], { strength: 0.7 });
    this._network.createConnection(neuronIds[11], neuronIds[14], { strength: 0.7 });
    this._network.createConnection(neuronIds[12], neuronIds[13], { strength: 0.5 });
    this._network.createConnection(neuronIds[12], neuronIds[14], { strength: 0.5 });
  }

  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 导出系统状态
   */
  export(): {
    id: string;
    name: string;
    network: ReturnType<NeuralNetwork['toJSON']>;
    state: SystemState;
    config: DigitalNeuronSystemConfig;
  } {
    return {
      id: this._id,
      name: this._name,
      network: this._network.toJSON(),
      state: this._state,
      config: this._config,
    };
  }

  /**
   * 导入系统状态
   */
  static import(data: ReturnType<DigitalNeuronSystem['export']>): DigitalNeuronSystem {
    const system = new DigitalNeuronSystem({
      ...data.config,
      id: data.id,
      name: data.name,
    });

    // 恢复网络状态
    system._network = NeuralNetwork.fromJSON(data.network);
    system._state = data.state;
    system._evolutionCount = data.state.evolutionCount;

    return system;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建数字神经元系统
 */
export function createDigitalNeuronSystem(
  config: DigitalNeuronSystemConfig = {}
): DigitalNeuronSystem {
  return new DigitalNeuronSystem(config);
}

/**
 * 创建并启动数字神经元系统
 */
export function createAndStartDigitalNeuronSystem(
  config: DigitalNeuronSystemConfig = {}
): DigitalNeuronSystem {
  const system = new DigitalNeuronSystem(config);
  system.startAutoEvolution();
  return system;
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export {
  NeuralNetwork,
  Influence,
  InfluencePool,
  Neuron,
  Connection,
  TextEncoder,
  LLMEncoder,
  TextDecoder,
  LLMDecoder,
  LearningManager,
  MetaLayer,
};

export * from './types';
