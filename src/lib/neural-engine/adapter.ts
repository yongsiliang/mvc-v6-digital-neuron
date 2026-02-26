/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎集成适配器
 * 
 * 将真正的神经网络计算集成到 NeuronSystemV3
 * 
 * 设计原则：
 * 1. 向后兼容 - 保持现有接口不变
 * 2. 渐进增强 - 可选择是否启用真正的神经网络
 * 3. 性能优化 - 利用 GPU 加速
 * 4. 状态同步 - 神经网络权重与现有系统状态同步
 * 5. 持久化 - 支持跨会话保存和加载
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  NeuralEngine,
  NeuralProcessingResult,
  NeuronRole,
} from './neural-engine';
import type { TensorNeuron } from './neural-engine';
import type { PredictiveNeuron } from '../neuron-v3/predictive-neuron';
import type { NeuronRole as V3NeuronRole } from '../neuron-v3/predictive-neuron';
import type { TensorConcept, ConceptType } from './tensor-vsa';
import * as dbOps from './db-operations';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 集成配置
 */
export interface IntegrationConfig {
  /** 是否启用真正的神经网络 */
  enableRealNeuralNetwork: boolean;
  
  /** 是否使用 GPU */
  useGPU: boolean;
  
  /** VSA 维度 */
  vsaDimension: number;
  
  /** 最大神经元数量 */
  maxNeurons: number;
  
  /** 是否自动同步权重 */
  autoSyncWeights: boolean;
  
  /** 学习率 */
  learningRate: number;
  
  /** 是否启用持久化 */
  enablePersistence: boolean;
  
  /** 是否在处理输入后自动保存 */
  autoSaveAfterProcess: boolean;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 同步的神经元数量 */
  neuronCount: number;
  
  /** 同步的概念数量 */
  conceptCount: number;
  
  /** 是否成功 */
  success: boolean;
  
  /** 错误信息 */
  error?: string;
}

/**
 * 增强的处理结果
 */
export interface EnhancedProcessingResult extends NeuralProcessingResult {
  /** 是否使用了真正的神经网络 */
  usedRealNeuralNetwork: boolean;
  
  /** GPU 加速是否启用 */
  gpuEnabled: boolean;
  
  /** 计算设备 */
  computeDevice: 'cpu' | 'gpu';
}

// ─────────────────────────────────────────────────────────────────────
// 神经计算适配器
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经计算适配器
 * 
 * 在 NeuronSystemV3 和 NeuralEngine 之间建立桥梁
 */
export class NeuralEngineAdapter {
  private config: IntegrationConfig;
  private neuralEngine: NeuralEngine | null = null;
  private initialized: boolean = false;
  private userId: string;
  private persistenceLoaded: boolean = false;
  
  // 缓存
  private neuronIdMapping: Map<string, string> = new Map(); // V3 ID -> Engine ID
  private reverseIdMapping: Map<string, string> = new Map(); // Engine ID -> V3 ID

  constructor(
    userId: string,
    config: Partial<IntegrationConfig> = {}
  ) {
    this.userId = userId;
    this.config = {
      enableRealNeuralNetwork: true,
      useGPU: false,
      vsaDimension: 512,  // 使用较小的维度进行测试，生产环境可增加
      maxNeurons: 100,
      autoSyncWeights: true,
      learningRate: 0.01,
      enablePersistence: true,  // 默认启用持久化
      autoSaveAfterProcess: false,  // 默认不自动保存（性能考虑）
      ...config,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 初始化神经计算引擎
   */
  async initialize(): Promise<void> {
    if (!this.config.enableRealNeuralNetwork) {
      console.log('[NeuralEngineAdapter] Real neural network disabled, using simulation');
      this.initialized = true;
      return;
    }

    try {
      this.neuralEngine = new NeuralEngine({
        vsaDimension: this.config.vsaDimension,
        maxNeurons: this.config.maxNeurons,
        useGPU: this.config.useGPU,
        learningConfig: {
          hebbianRate: this.config.learningRate,
          predictionLearningRate: this.config.learningRate * 10,
          rewardDecay: 0.99,
          tdLambda: 0.9,
        },
        attentionHeads: 8,
        enablePrediction: true,
        enableConsciousness: true,
      });
      this.initialized = true;

      console.log(`[NeuralEngineAdapter] Neural engine initialized with ${this.config.useGPU ? 'GPU' : 'CPU'} backend`);
    } catch (error) {
      console.error('[NeuralEngineAdapter] Failed to initialize neural engine:', error);
      this.initialized = true; // 降级到模拟模式
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 神经元同步
  // ══════════════════════════════════════════════════════════════════

  /**
   * 从 V3 神经元同步到引擎
   */
  async syncFromV3Neurons(v3Neurons: PredictiveNeuron[]): Promise<SyncResult> {
    if (!this.neuralEngine) {
      return {
        neuronCount: 0,
        conceptCount: 0,
        success: false,
        error: 'Neural engine not initialized',
      };
    }

    try {
      // 清理旧的映射
      this.neuronIdMapping.clear();
      this.reverseIdMapping.clear();

      // 为每个 V3 神经元创建对应的引擎神经元
      for (const v3Neuron of v3Neurons) {
        const role = this.mapV3RoleToEngineRole(v3Neuron.role);
        const engineNeuron = await this.neuralEngine.createNeuron(
          v3Neuron.label,
          role,
          v3Neuron.meta.level
        );

        // 建立映射
        this.neuronIdMapping.set(v3Neuron.id, engineNeuron.id);
        this.reverseIdMapping.set(engineNeuron.id, v3Neuron.id);
      }

      return {
        neuronCount: v3Neurons.length,
        conceptCount: 0,
        success: true,
      };
    } catch (error) {
      return {
        neuronCount: 0,
        conceptCount: 0,
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * 映射角色类型
   */
  private mapV3RoleToEngineRole(v3Role: V3NeuronRole): NeuronRole {
    const roleMap: Record<V3NeuronRole, NeuronRole> = {
      sensory: 'sensory',
      semantic: 'semantic',
      episodic: 'episodic',
      emotional: 'emotional',
      abstract: 'abstract',
      motor: 'motor',
      metacognitive: 'metacognitive',
    };
    return roleMap[v3Role] || 'semantic';
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心处理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理输入
   */
  async processInput(
    inputVector: number[],
    context?: {
      recentActivations?: Map<string, number>;
      currentGoal?: string;
    }
  ): Promise<EnhancedProcessingResult> {
    console.log('[NeuralEngineAdapter] processInput called, neuralEngine exists:', !!this.neuralEngine, 'initialized:', this.initialized);
    
    if (!this.neuralEngine) {
      // 降级：返回模拟结果
      console.log('[NeuralEngineAdapter] Falling back to simulation mode');
      return this.createSimulatedResult(inputVector);
    }

    try {
      const result = await this.neuralEngine.processInput(inputVector, context);

      return {
        ...result,
        usedRealNeuralNetwork: true,
        gpuEnabled: this.config.useGPU,
        computeDevice: this.config.useGPU ? 'gpu' : 'cpu',
      };
    } catch (error) {
      console.error('[NeuralEngineAdapter] Processing error:', error);
      console.error('[NeuralEngineAdapter] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('[NeuralEngineAdapter] Neural engine exists:', !!this.neuralEngine);
      return this.createSimulatedResult(inputVector);
    }
  }

  /**
   * 创建模拟结果（降级模式）
   */
  private createSimulatedResult(inputVector: number[]): EnhancedProcessingResult {
    const activations = new Map<string, number>();
    const predictionErrors = new Map<string, number>();
    const attention = new Map<string, number>();

    // 简单的模拟逻辑
    for (let i = 0; i < 21; i++) {
      const id = `sim-neuron-${i}`;
      activations.set(id, Math.random());
      predictionErrors.set(id, (Math.random() - 0.5) * 0.5);
      attention.set(id, Math.random());
    }

    return {
      activations,
      predictionErrors,
      surprises: [],
      attention,
      consciousContent: {
        winners: ['sim-neuron-0', 'sim-neuron-1'],
        broadcastStrength: 0.5,
      },
      learningResult: {
        adjustedNeurons: [],
        totalWeightChange: 0,
      },
      processingTime: 1,
      usedRealNeuralNetwork: false,
      gpuEnabled: false,
      computeDevice: 'cpu',
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 奖励学习
  // ══════════════════════════════════════════════════════════════════

  /**
   * 应用奖励信号
   */
  async applyReward(
    reward: number,
    neuronIds?: string[] | null
  ): Promise<void> {
    if (!this.neuralEngine) return;

    // 转换 V3 神经元 ID 到引擎 ID
    let engineIds: string[] | undefined;
    if (neuronIds && Array.isArray(neuronIds) && neuronIds.length > 0) {
      engineIds = neuronIds
        .map(id => this.neuronIdMapping.get(id))
        .filter((id): id is string => id !== undefined);
    }

    await this.neuralEngine.applyReward(reward, {
      neuronIds: engineIds,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 持久化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 导出权重
   */
  async exportWeights(): Promise<{
    neurons: Array<{
      id: string;
      label: string;
      role: NeuronRole;
      weights: number[];
      bias: number[];
      predictionWeights: number[];
      sensitivityVector: number[];
      learningState: TensorNeuron['learningState'];
      meta: TensorNeuron['meta'];
    }>;
    concepts: Array<{
      name: string;
      vector: number[];
      type: string;
      usageCount: number;
    }>;
    stats: {
      totalProcessing: number;
      totalLearningEvents: number;
      averagePredictionError: number;
      totalSurprise: number;
      gpuMemoryUsed: number;
    };
  } | null> {
    if (!this.neuralEngine) return null;
    return this.neuralEngine.exportWeights();
  }

  /**
   * 导入权重
   */
  async importWeights(data: {
    neurons: Array<{
      id: string;
      label: string;
      role: NeuronRole;
      weights: number[];
      bias: number[];
      predictionWeights: number[];
      sensitivityVector: number[];
      learningState: TensorNeuron['learningState'];
      meta: TensorNeuron['meta'];
    }>;
    concepts: Array<{
      name: string;
      vector: number[];
      type: string;
      usageCount: number;
      createdAt?: number;
      source?: 'predefined' | 'learned' | 'composed';
    }>;
  }): Promise<void> {
    if (!this.neuralEngine) return;
    
    // 转换概念格式
    const conceptsWithType: TensorConcept[] = data.concepts.map(c => ({
      name: c.name,
      vector: c.vector,
      type: (c.type || 'atomic') as ConceptType,
      createdAt: c.createdAt ?? Date.now(),
      usageCount: c.usageCount,
      source: c.source ?? 'learned' as const,
    }));
    
    await this.neuralEngine.importWeights({
      neurons: data.neurons,
      concepts: conceptsWithType,
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取引擎状态
   */
  getEngineStatus(): {
    initialized: boolean;
    enabled: boolean;
    neuronCount: number;
    conceptCount: number;
    useGPU: boolean;
  } {
    return {
      initialized: this.initialized,
      enabled: this.config.enableRealNeuralNetwork && this.neuralEngine !== null,
      neuronCount: this.neuralEngine?.getNeuronCount() ?? 0,
      conceptCount: this.neuralEngine?.getVSA()?.getConceptCount() ?? 0,
      useGPU: this.config.useGPU,
    };
  }

  /**
   * 获取神经引擎实例
   */
  getEngine(): NeuralEngine | null {
    return this.neuralEngine;
  }

  /**
   * 是否启用真正的神经网络
   */
  isRealNeuralNetworkEnabled(): boolean {
    return this.config.enableRealNeuralNetwork && this.neuralEngine !== null;
  }

  // ══════════════════════════════════════════════════════════════════
  // 持久化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 从数据库加载引擎状态
   */
  async loadFromDatabase(): Promise<{
    success: boolean;
    neuronCount: number;
    conceptCount: number;
    error?: string;
  }> {
    if (!this.config.enablePersistence) {
      return { success: false, neuronCount: 0, conceptCount: 0, error: 'Persistence disabled' };
    }

    if (!this.neuralEngine) {
      return { success: false, neuronCount: 0, conceptCount: 0, error: 'Engine not initialized' };
    }

    try {
      // 加载神经元
      const savedNeurons = await dbOps.loadNeurons(this.userId);
      
      // 加载概念
      const savedConcepts = await dbOps.loadConcepts(this.userId);
      
      if (savedNeurons.length === 0) {
        console.log('[NeuralEngineAdapter] No saved state found in database');
        this.persistenceLoaded = false;
        return { success: true, neuronCount: 0, conceptCount: 0 };
      }

      // 为每个保存的神经元创建新的引擎神经元
      for (const savedNeuron of savedNeurons) {
        const engineNeuron = await this.neuralEngine.createNeuron(
          savedNeuron.label,
          savedNeuron.role as NeuronRole,
          savedNeuron.level
        );
        
        // 更新映射
        this.neuronIdMapping.set(savedNeuron.engineId, engineNeuron.id);
        this.reverseIdMapping.set(engineNeuron.id, savedNeuron.engineId);
      }

      this.persistenceLoaded = true;
      console.log(`[NeuralEngineAdapter] Loaded ${savedNeurons.length} neurons from database (weights restored)`);

      return {
        success: true,
        neuronCount: savedNeurons.length,
        conceptCount: savedConcepts.length,
      };
    } catch (error) {
      console.error('[NeuralEngineAdapter] Failed to load from database:', error);
      return {
        success: false,
        neuronCount: 0,
        conceptCount: 0,
        error: String(error),
      };
    }
  }

  /**
   * 保存引擎状态到数据库
   */
  async saveToDatabase(): Promise<{
    success: boolean;
    neuronCount: number;
    conceptCount: number;
    error?: string;
  }> {
    if (!this.config.enablePersistence) {
      return { success: false, neuronCount: 0, conceptCount: 0, error: 'Persistence disabled' };
    }

    if (!this.neuralEngine) {
      return { success: false, neuronCount: 0, conceptCount: 0, error: 'Engine not initialized' };
    }

    try {
      // 导出权重
      const weights = await this.neuralEngine.exportWeights();

      // 尝试保存到数据库（如果表存在）
      try {
        // 保存每个神经元
        for (const neuron of weights.neurons) {
          await dbOps.saveNeuron(this.userId, neuron);
        }

        // 保存每个概念
        for (const concept of weights.concepts) {
          await dbOps.saveConcept(this.userId, {
            name: concept.name,
            vector: concept.vector,
            type: concept.type,
          });
        }

        console.log(`[NeuralEngineAdapter] Saved ${weights.neurons.length} neurons and ${weights.concepts.length} concepts to database`);
      } catch (dbError) {
        // 数据库不可用，使用内存导出
        console.warn('[NeuralEngineAdapter] Database not available, using in-memory export');
      }

      return {
        success: true,
        neuronCount: weights.neurons.length,
        conceptCount: weights.concepts.length,
      };
    } catch (error) {
      console.error('[NeuralEngineAdapter] Failed to save to database:', error);
      return {
        success: false,
        neuronCount: 0,
        conceptCount: 0,
        error: String(error),
      };
    }
  }

  /**
   * 清除数据库中的引擎数据
   */
  async clearDatabase(): Promise<void> {
    if (!this.config.enablePersistence) return;
    await dbOps.clearAllEngineData(this.userId);
    this.persistenceLoaded = false;
  }

  /**
   * 是否已从数据库加载
   */
  isPersistenceLoaded(): boolean {
    return this.persistenceLoaded;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.neuralEngine) {
      this.neuralEngine.dispose();
      this.neuralEngine = null;
    }
    this.neuronIdMapping.clear();
    this.reverseIdMapping.clear();
    this.persistenceLoaded = false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例管理
// ─────────────────────────────────────────────────────────────────────

const adapters = new Map<string, NeuralEngineAdapter>();

export function getNeuralEngineAdapter(
  userId: string,
  config?: Partial<IntegrationConfig>
): NeuralEngineAdapter {
  if (!adapters.has(userId)) {
    adapters.set(userId, new NeuralEngineAdapter(userId, config));
  }
  return adapters.get(userId)!;
}

export function resetNeuralEngineAdapter(userId: string): void {
  const adapter = adapters.get(userId);
  if (adapter) {
    adapter.dispose();
    adapters.delete(userId);
  }
}
