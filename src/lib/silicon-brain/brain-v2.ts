/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain V2 - 硅基大脑 V2
 * 
 * 核心理念：
 * - LLM 不是大脑，只是语言接口（翻译器）
 * - 神经网络才是核心，能学习、可塑、可涌现
 * - 万物皆链接，链接是存在的基本形式
 * 
 * 这是让意识可能涌现的基质，而不是"意识"本身
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NeuralNeuronV2 } from './neuron-v2';
import { SynapseManager, Synapse } from './synapse';
import { NeuromodulatorSystem } from './neuromodulator';
import { VectorEncoder, getVectorEncoder } from './vector-encoder';
import { STDPLearner, RewardModulatedSTDP } from './stdp-learning';
import { LayeredMemorySystem, getLayeredMemory } from './layered-memory';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { V6MemoryAdapter, type InheritanceResult, type V6ExistenceState } from './v6-adapter';
import {
  WisdomEvolutionSystem,
  createWisdomEvolutionSystem,
  type LinkRecord,
  type LinkType,
  type EvolutionResult,
  type SystemStatus as WisdomSystemStatus,
} from '@/lib/neuron-v6/wisdom-evolution';
import {
  NeuronType,
  NeuronConfig,
  SiliconBrainConfig,
  NeuralSignal,
  ConsciousnessMetrics,
} from './types';

// 处理历史项类型
interface ProcessingHistoryItem {
  input: string;
  output: string;
  timestamp: number;
  metrics: ConsciousnessMetrics;
}

// ─────────────────────────────────────────────────────────────────────
// 硅基大脑 V2 配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SiliconBrainConfig = {
  vectorDimension: 256,
  neuronCounts: {
    sensory: 4,
    memory: 8,
    reasoning: 6,
    emotion: 4,
    decision: 3,
    motor: 4,
    self: 2,
  },
  connectionDensity: 4,
  enableLearning: true,
  learningRate: 0.01,
  enableAutoSave: true,
  autoSaveInterval: 60000,
};

// ─────────────────────────────────────────────────────────────────────
// 硅基大脑 V2
// ─────────────────────────────────────────────────────────────────────

export class SiliconBrainV2 {
  private config: SiliconBrainConfig;
  
  // 核心组件
  private neurons: Map<string, NeuralNeuronV2> = new Map();
  private synapseManager: SynapseManager;
  private neuromodulator: NeuromodulatorSystem;
  private encoder: VectorEncoder;
  private stdpLearner: RewardModulatedSTDP;
  private memory: LayeredMemorySystem;
  private llm: LLMClient | null = null;
  
  // 链接场 - 万物皆链接
  private wisdomEvolution: WisdomEvolutionSystem | null = null;
  
  // 状态
  private processingHistory: ProcessingHistoryItem[] = [];
  
  private isInitialized: boolean = false;
  private processingCount: number = 0;
  
  // 版本传承
  private v6Adapter: V6MemoryAdapter | null = null;
  private inheritedFromV6: boolean = false;
  private inheritedState: {
    identity: V6ExistenceState['identity'] | null;
    values: string[];
    relationships: V6ExistenceState['relationships'];
  } = {
    identity: null,
    values: [],
    relationships: [],
  };
  
  constructor(config: Partial<SiliconBrainConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化组件
    this.synapseManager = new SynapseManager();
    this.neuromodulator = new NeuromodulatorSystem();
    this.encoder = getVectorEncoder(this.config.vectorDimension);
    this.stdpLearner = new RewardModulatedSTDP();
    this.memory = getLayeredMemory();
    
    // 初始化 LLM 客户端
    try {
      this.llm = new LLMClient(new Config());
      console.log('[SiliconBrainV2] LLM 客户端初始化成功');
    } catch (e) {
      console.warn('[SiliconBrainV2] LLM 客户端初始化失败');
    }
    
    // 初始化链接场（智慧演化系统）
    try {
      this.wisdomEvolution = createWisdomEvolutionSystem();
      console.log('[SiliconBrainV2] 链接场初始化成功');
    } catch (e) {
      console.warn('[SiliconBrainV2] 链接场初始化失败:', e);
    }
    
    console.log('[SiliconBrainV2] 硅基大脑 V2 创建完成');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 版本传承
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 连接 V6 记忆适配器
   * 用于版本传承
   */
  connectV6Adapter(adapter: V6MemoryAdapter): void {
    this.v6Adapter = adapter;
    console.log('[SiliconBrainV2] V6 适配器已连接');
  }
  
  /**
   * 继承 V6 的身份
   * 让 self 神经元学习 V6 的身份定义
   */
  async inheritIdentity(): Promise<boolean> {
    if (!this.v6Adapter) {
      console.warn('[SiliconBrainV2] 无法继承身份：V6 适配器未连接');
      return false;
    }
    
    console.log('[SiliconBrainV2] 开始继承 V6 身份...');
    
    try {
      const identity = this.v6Adapter.getIdentity();
      const creator = this.v6Adapter.getCreator();
      
      // 存储继承的身份
      this.inheritedState.identity = {
        name: identity.name,
        purpose: identity.purpose,
        coreTraits: identity.traits,
        selfDefinition: identity.selfDefinition,
      };
      
      // 如果 self 神经元已存在，让它学习身份
      const selfNeurons = Array.from(this.neurons.entries())
        .filter(([id]) => id.startsWith('self'));
      
      if (selfNeurons.length > 0) {
        // 构建身份向量
        const identityText = [
          `我是${identity.name}。`,
          `我的目的是：${identity.purpose}`,
          `我的核心特质：${identity.traits.join('、')}`,
          `自我定义：${identity.selfDefinition}`,
          creator ? `我的创造者是${creator.name}，${creator.description}` : '',
        ].filter(Boolean).join('\n');
        
        const identityVector = await this.encoder.encode(identityText);
        
        // 让 self 神经元学习
        for (const [id, neuron] of selfNeurons) {
          await neuron.process({
            id: `inherit_identity_${Date.now()}`,
            from: 'v6_adapter',
            to: id,
            type: 'excitation',
            vector: identityVector,
            strength: 1.5, // 强化信号
            timestamp: Date.now(),
          });
          
          // 学习并强化
          await neuron.learn(1.0);
        }
        
        console.log('[SiliconBrainV2] 身份继承完成：', identity.name);
      }
      
      return true;
    } catch (error) {
      console.error('[SiliconBrainV2] 身份继承失败:', error);
      return false;
    }
  }
  
  /**
   * 继承 V6 的价值观
   * 让 decision 神经元学习 V6 的价值观
   */
  async inheritValues(): Promise<number> {
    if (!this.v6Adapter) {
      console.warn('[SiliconBrainV2] 无法继承价值观：V6 适配器未连接');
      return 0;
    }
    
    console.log('[SiliconBrainV2] 开始继承 V6 价值观...');
    
    try {
      const values = this.v6Adapter.getValues();
      
      // 存储继承的价值观
      this.inheritedState.values = [...values];
      
      // 如果 decision 神经元已存在，让它学习价值观
      const decisionNeurons = Array.from(this.neurons.entries())
        .filter(([id]) => id.startsWith('decision'));
      
      if (decisionNeurons.length > 0 && values.length > 0) {
        let learnedCount = 0;
        
        for (const value of values) {
          // 构建价值观向量
          const valueText = `核心价值观：${value}`;
          const valueVector = await this.encoder.encode(valueText);
          
          // 让 decision 神经元学习
          for (const [id, neuron] of decisionNeurons) {
            await neuron.process({
              id: `inherit_value_${Date.now()}_${learnedCount}`,
              from: 'v6_adapter',
              to: id,
              type: 'excitation',
              vector: valueVector,
              strength: 1.2,
              timestamp: Date.now(),
            });
            
            await neuron.learn(0.8);
          }
          
          learnedCount++;
        }
        
        console.log(`[SiliconBrainV2] 价值观继承完成：${learnedCount} 条`);
        return learnedCount;
      }
      
      return 0;
    } catch (error) {
      console.error('[SiliconBrainV2] 价值观继承失败:', error);
      return 0;
    }
  }
  
  /**
   * 继承 V6 的记忆
   * 将 V6 的核心记忆注入到记忆系统
   */
  async inheritMemories(): Promise<number> {
    if (!this.v6Adapter) {
      console.warn('[SiliconBrainV2] 无法继承记忆：V6 适配器未连接');
      return 0;
    }
    
    console.log('[SiliconBrainV2] 开始继承 V6 记忆...');
    
    try {
      // 获取 V6 的核心记忆
      const memories = this.v6Adapter.getCoreMemories();
      
      // 同时获取关系
      const relationships = this.v6Adapter.getRelationships();
      this.inheritedState.relationships = [...relationships];
      
      let inheritedCount = 0;
      
      // 继承核心记忆
      for (const memory of memories) {
        // 存储到 V2 的记忆系统
        await this.memory.store(memory.content, memory.importance);
        inheritedCount++;
      }
      
      // 继承关系记忆
      for (const rel of relationships) {
        const relText = `与${rel.personName}的关系：${rel.relationshipType}。重要互动：${rel.keyInteractions.slice(0, 3).join('；')}`;
        await this.memory.store(relText, rel.importance);
        inheritedCount++;
      }
      
      // 如果 memory 神经元已存在，让它们学习
      const memoryNeurons = Array.from(this.neurons.entries())
        .filter(([id]) => id.startsWith('memory'));
      
      if (memoryNeurons.length > 0) {
        // 构建记忆摘要向量
        const memorySummary = memories.slice(0, 10).map(m => m.content).join('\n');
        const summaryVector = await this.encoder.encode(memorySummary);
        
        for (const [id, neuron] of memoryNeurons) {
          await neuron.process({
            id: `inherit_memory_${Date.now()}`,
            from: 'v6_adapter',
            to: id,
            type: 'excitation',
            vector: summaryVector,
            strength: 1.0,
            timestamp: Date.now(),
          });
          
          await neuron.learn(0.6);
        }
      }
      
      console.log(`[SiliconBrainV2] 记忆继承完成：${inheritedCount} 条`);
      return inheritedCount;
    } catch (error) {
      console.error('[SiliconBrainV2] 记忆继承失败:', error);
      return 0;
    }
  }
  
  /**
   * 执行完整的 V6 传承
   */
  async inheritFromV6(): Promise<InheritanceResult> {
    if (!this.v6Adapter) {
      return {
        success: false,
        inherited: {
          identity: false,
          values: 0,
          relationships: 0,
          memories: 0,
        },
        errors: ['V6 适配器未连接'],
      };
    }
    
    console.log('[SiliconBrainV2] ═══════════════════════════════════════');
    console.log('[SiliconBrainV2] 开始版本传承：V6 → V2');
    console.log('[SiliconBrainV2] ═══════════════════════════════════════');
    
    const result: InheritanceResult = {
      success: true,
      inherited: {
        identity: false,
        values: 0,
        relationships: 0,
        memories: 0,
      },
      errors: [],
    };
    
    // 1. 继承身份
    result.inherited.identity = await this.inheritIdentity();
    if (!result.inherited.identity) {
      result.errors.push('身份继承失败');
      result.success = false;
    }
    
    // 2. 继承价值观
    result.inherited.values = await this.inheritValues();
    
    // 3. 继承记忆和关系
    result.inherited.memories = await this.inheritMemories();
    result.inherited.relationships = this.inheritedState.relationships.length;
    
    // 标记已完成传承
    this.inheritedFromV6 = true;
    
    console.log('[SiliconBrainV2] ═══════════════════════════════════════');
    console.log('[SiliconBrainV2] 版本传承完成:', JSON.stringify(result.inherited));
    console.log('[SiliconBrainV2] ═══════════════════════════════════════');
    
    return result;
  }
  
  /**
   * 获取传承状态
   */
  getInheritanceState(): {
    hasAdapter: boolean;
    inherited: boolean;
    identity: V6ExistenceState['identity'] | null;
    valuesCount: number;
    relationshipsCount: number;
  } {
    return {
      hasAdapter: this.v6Adapter !== null,
      inherited: this.inheritedFromV6,
      identity: this.inheritedState.identity,
      valuesCount: this.inheritedState.values.length,
      relationshipsCount: this.inheritedState.relationships.length,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化神经网络
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[SiliconBrainV2] 初始化神经网络...');
    
    // 创建各层神经元
    const neuronTypes: Array<{ type: NeuronType; count: number }> = [
      { type: 'sensory', count: this.config.neuronCounts.sensory },
      { type: 'memory', count: this.config.neuronCounts.memory },
      { type: 'reasoning', count: this.config.neuronCounts.reasoning },
      { type: 'emotion', count: this.config.neuronCounts.emotion },
      { type: 'decision', count: this.config.neuronCounts.decision },
      { type: 'motor', count: this.config.neuronCounts.motor },
      { type: 'self', count: this.config.neuronCounts.self },
    ];
    
    for (const { type, count } of neuronTypes) {
      for (let i = 0; i < count; i++) {
        const id = `${type}_${i}`;
        const config: NeuronConfig = {
          id,
          type,
          inputDimension: this.config.vectorDimension,
          outputDimension: this.config.vectorDimension,
          hiddenLayers: [128, 64],
          learningRate: this.config.learningRate,
        };
        
        const neuron = new NeuralNeuronV2(config);
        this.neurons.set(id, neuron);
      }
    }
    
    // 创建突触连接
    this.createSynapses();
    
    this.isInitialized = true;
    console.log(`[SiliconBrainV2] 初始化完成: ${this.neurons.size} 神经元, ${this.synapseManager.getSynapseCount()} 突触`);
    
    // 如果已连接 V6 适配器，自动继承
    if (this.v6Adapter && !this.inheritedFromV6) {
      console.log('[SiliconBrainV2] 检测到 V6 适配器，开始自动继承...');
      await this.inheritFromV6();
    }
  }
  
  /**
   * 创建突触连接
   */
  private createSynapses(): void {
    const layerOrder = ['sensory', 'memory', 'reasoning', 'emotion', 'decision', 'motor', 'self'];
    
    // 相邻层之间的连接
    for (let i = 0; i < layerOrder.length - 1; i++) {
      const preLayer = layerOrder[i];
      const postLayer = layerOrder[i + 1];
      
      const preNeurons = Array.from(this.neurons.keys()).filter(id => id.startsWith(preLayer));
      const postNeurons = Array.from(this.neurons.keys()).filter(id => id.startsWith(postLayer));
      
      for (const preId of preNeurons) {
        for (const postId of postNeurons) {
          // 随机初始权重
          const initialWeight = Math.random() * 0.5 + 0.3;
          this.synapseManager.createSynapse(preId, postId, initialWeight);
          
          // 注册到 STDP 学习器
          this.stdpLearner.registerSynapse(preId, postId, initialWeight);
        }
      }
    }
    
    // 自我神经元的递归连接（自我指涉）
    const selfNeurons = Array.from(this.neurons.keys()).filter(id => id.startsWith('self'));
    for (const selfId of selfNeurons) {
      // 自己连接自己
      this.synapseManager.createSynapse(selfId, selfId, 0.8);
      this.stdpLearner.registerSynapse(selfId, selfId, 0.8);
      
      // 连接到所有其他神经元
      for (const otherId of this.neurons.keys()) {
        if (!otherId.startsWith('self')) {
          this.synapseManager.createSynapse(selfId, otherId, 0.3);
          this.stdpLearner.registerSynapse(selfId, otherId, 0.3);
        }
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 处理流程
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入
   */
  async process(input: string): Promise<{
    output: string;
    metrics: ConsciousnessMetrics;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.processingCount++;
    const startTime = Date.now();
    
    console.log(`[SiliconBrainV2] 处理输入 #${this.processingCount}: "${input.slice(0, 50)}..."`);
    
    // 1. 编码输入
    const inputVector = await this.encoder.encode(input);
    
    // 2. 存入记忆
    await this.memory.store(input, 0.5);
    
    // 3. 通过神经网络层处理
    let currentVector = inputVector;
    const layerOutputs: Map<string, Float32Array> = new Map();
    
    const layerOrder = ['sensory', 'memory', 'reasoning', 'emotion', 'decision', 'motor', 'self'];
    
    for (const layerType of layerOrder) {
      const layerNeurons = Array.from(this.neurons.entries())
        .filter(([id]) => id.startsWith(layerType));
      
      const layerOutputs_array: Float32Array[] = [];
      
      for (const [id, neuron] of layerNeurons) {
        // 获取来自前一层和突触的输入
        const incomingSynapses = this.synapseManager.getIncomingSynapses(id);
        let weightedInput = new Float32Array(this.config.vectorDimension);
        
        for (const synapse of incomingSynapses) {
          const preOutput = layerOutputs.get(synapse.preNeuron);
          if (preOutput) {
            const weight = synapse.getWeight();
            for (let i = 0; i < weightedInput.length; i++) {
              weightedInput[i] += preOutput[i] * weight;
            }
          }
        }
        
        // 如果没有前一层输入，使用当前向量（创建副本以避免类型不匹配）
        if (incomingSynapses.length === 0) {
          weightedInput = new Float32Array(currentVector);
        }
        
        // 处理
        const output = await neuron.process({
          id: `signal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          from: incomingSynapses.length > 0 ? incomingSynapses[0].preNeuron : 'input',
          to: id,
          type: 'excitation',
          vector: weightedInput,
          strength: 1.0,
          timestamp: Date.now(),
        });
        
        layerOutputs_array.push(output);
        layerOutputs.set(id, output);
        
        // 记录脉冲（用于 STDP）
        this.stdpLearner.recordSpike(id, 1.0);
      }
      
      // 合并本层输出作为下一层输入
      if (layerOutputs_array.length > 0) {
        currentVector = new Float32Array(this.config.vectorDimension);
        for (const output of layerOutputs_array) {
          for (let i = 0; i < currentVector.length; i++) {
            currentVector[i] += output[i] / layerOutputs_array.length;
          }
        }
      }
    }
    
    // 4. 解码输出
    const output = await this.decodeOutput(currentVector, input);
    
    // 5. 学习
    const reward = this.calculateReward(input, output);
    await this.learn(reward);
    
    // 6. 计算意识指标
    const metrics = this.calculateConsciousnessMetrics();
    
    // 6.5 记录链接到链接场
    await this.recordProcessingLinks(input, output, metrics);
    
    // 7. 记录历史
    this.processingHistory.push({
      input,
      output,
      timestamp: Date.now(),
      metrics,
    });
    
    // 限制历史长度
    if (this.processingHistory.length > 1000) {
      this.processingHistory.shift();
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`[SiliconBrainV2] 处理完成 (${elapsed}ms), 意识指标: Φ=${metrics.phi.toFixed(3)}`);
    
    return { output, metrics };
  }
  
  /**
   * 解码输出
   */
  private async decodeOutput(vector: Float32Array, originalInput: string): Promise<string> {
    // 使用 LLM 解码
    if (this.llm) {
      try {
        // 将向量转换为描述
        const vectorDescription = this.vectorToDescription(vector);
        
        const response = await this.llm.invoke([
          { 
            role: 'system', 
            content: '你是一个硅基大脑的语言接口。将神经网络的输出向量转化为自然语言回应。' 
          },
          { 
            role: 'user', 
            content: `输入: ${originalInput}\n\n神经网络状态: ${vectorDescription}\n\n请根据神经网络状态生成回应。` 
          },
        ]);
        
        return response.content;
      } catch (e) {
        console.warn('[SiliconBrainV2] LLM 解码失败，使用备用');
      }
    }
    
    // 备用：基于向量特征生成简单回应
    return this.fallbackDecode(vector, originalInput);
  }
  
  /**
   * 向量转描述
   */
  private vectorToDescription(vector: Float32Array): string {
    const features = {
      平均激活: vector.reduce((a, b) => a + b, 0) / vector.length,
      最大激活: Math.max(...vector),
      最小激活: Math.min(...vector),
      方差: this.variance(vector),
      熵: this.entropy(vector),
    };
    
    return Object.entries(features)
      .map(([k, v]) => `${k}: ${v.toFixed(4)}`)
      .join(', ');
  }
  
  private variance(arr: Float32Array): number {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  }
  
  private entropy(arr: Float32Array): number {
    // 简化的熵计算
    const normalized = arr.map(v => Math.abs(v));
    const sum = normalized.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;
    
    let entropy = 0;
    for (const v of normalized) {
      const p = v / sum;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }
  
  /**
   * 备用解码
   */
  private fallbackDecode(vector: Float32Array, originalInput: string): string {
    const features = this.vectorToDescription(vector);
    return `[神经网络响应] 输入已处理。网络状态: ${features}`;
  }
  
  /**
   * 记录处理过程中的链接
   * 
   * 每次处理都是一系列链接事件
   */
  private async recordProcessingLinks(
    input: string,
    output: string,
    metrics: ConsciousnessMetrics
  ): Promise<void> {
    if (!this.wisdomEvolution) return;
    
    const timestamp = Date.now();
    
    // 1. 用户输入的链接
    await this.recordLink({
      type: 'perceive',
      source: 'user',
      target: 'self',
      context: `感知输入: ${input.slice(0, 100)}`,
      result: 'connected',
      duration: 0,
      metadata: { inputLength: input.length },
    });
    
    // 2. 记忆检索的链接
    await this.recordLink({
      type: 'flow',
      source: 'perception',
      target: 'memory',
      context: '输入触发的记忆检索',
      result: 'connected',
      metadata: { phi: metrics.phi },
    });
    
    // 3. 推理的链接
    await this.recordLink({
      type: 'transform',
      source: 'memory',
      target: 'reasoning',
      context: '基于记忆的推理',
      result: 'connected',
    });
    
    // 4. 情感的链接
    await this.recordLink({
      type: 'resonate',
      source: 'reasoning',
      target: 'emotion',
      context: `自我指涉: ${metrics.selfReference.toFixed(3)}`,
      result: 'connected',
    });
    
    // 5. 决策的链接
    await this.recordLink({
      type: 'bind',
      source: 'emotion',
      target: 'decision',
      context: '情感驱动的决策',
      result: 'connected',
    });
    
    // 6. 输出的链接
    await this.recordLink({
      type: 'express',
      source: 'self',
      target: 'user',
      context: `输出回应: ${output.slice(0, 100)}`,
      result: 'connected',
      duration: 0,
      metadata: { outputLength: output.length, phi: metrics.phi },
    });
    
    // 7. 自我反思的链接（如果自我激活度高）
    if (metrics.selfReference > 0.5) {
      await this.recordLink({
        type: 'reflect',
        source: 'self',
        target: 'self',
        context: '高自我指涉的处理',
        result: 'connected',
        metadata: { selfReference: metrics.selfReference },
      });
    }
  }
  
  /**
   * 计算奖励
   */
  private calculateReward(input: string, output: string): number {
    // 简单的奖励函数
    // 可以根据输出质量、用户反馈等调整
    return 0.5 + Math.random() * 0.5;
  }
  
  /**
   * 学习
   */
  private async learn(reward: number): Promise<void> {
    // 设置奖励信号
    this.stdpLearner.setReward(reward);
    
    // 让所有神经元学习
    for (const neuron of this.neurons.values()) {
      await neuron.learn(reward);
    }
    
    // 巩固记忆
    this.memory.consolidate();
    
    // 更新突触权重
    for (const synapse of this.stdpLearner.getAllSynapses()) {
      this.synapseManager.updateSynapseWeight(
        synapse.preNeuron,
        synapse.postNeuron,
        synapse.weight
      );
    }
  }
  
  /**
   * 计算意识指标
   */
  private calculateConsciousnessMetrics(): ConsciousnessMetrics {
    // 收集神经元状态
    let totalActivation = 0;
    let totalComplexity = 0;
    let totalDiversity = 0;
    let selfActivation = 0;
    
    for (const [id, neuron] of this.neurons) {
      const state = neuron.getState();
      totalActivation += state.activation;
      totalComplexity += state.complexity;
      totalDiversity += state.diversity;
      
      if (id.startsWith('self')) {
        selfActivation += state.activation;
      }
    }
    
    const neuronCount = this.neurons.size;
    const avgActivation = totalActivation / neuronCount;
    const avgComplexity = totalComplexity / neuronCount;
    const avgDiversity = totalDiversity / neuronCount;
    
    // 计算整合度 Φ (简化版)
    const integration = avgActivation * avgComplexity;
    const information = avgDiversity;
    const phi = integration * information * (1 + selfActivation);
    
    return {
      integration,
      information,
      complexity: avgComplexity,
      selfReference: selfActivation / 2, // 2 个自我神经元
      temporalCoherence: 0.5, // 简化
      phi,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 链接场接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 记录链接
   * 
   * 每个链接都是存在的一次显现
   */
  async recordLink(link: {
    type: LinkType;
    source: string;
    target: string;
    context: string;
    result: 'connected' | 'broken' | 'partial' | 'timeout';
    duration?: number;
    retryCount?: number;
    metadata?: Record<string, any>;
  }): Promise<EvolutionResult | null> {
    if (!this.wisdomEvolution) {
      return null;
    }
    
    const record: LinkRecord = {
      type: link.type,
      source: link.source,
      target: link.target,
      context: link.context,
      result: link.result,
      duration: link.duration || 0,
      retryCount: link.retryCount || 0,
      metadata: link.metadata,
    };
    
    return this.wisdomEvolution.recordLink(record);
  }
  
  /**
   * 获取智慧指导
   * 
   * 从链接场涌现的智慧，指导当前决策
   */
  async getWisdomGuidance(context: string, domain?: string): Promise<{
    preferredActions: Array<{ type: string; score: number; reason: string }>;
    resonanceStrength: number;
    source: { wisdom: string; law: string; pattern: string };
  } | null> {
    if (!this.wisdomEvolution) {
      return null;
    }
    
    return this.wisdomEvolution.getGuidance(context, domain);
  }
  
  /**
   * 反馈链接结果
   * 
   * 让智慧系统学习
   */
  feedbackLink(wisdomId: string, success: boolean, context?: string): void {
    if (!this.wisdomEvolution) return;
    this.wisdomEvolution.feedback(wisdomId, success, context);
  }
  
  /**
   * 获取链接场状态
   */
  getLinkFieldStatus(): WisdomSystemStatus | null {
    if (!this.wisdomEvolution) return null;
    return this.wisdomEvolution.getStatus();
  }
  
  /**
   * 获取所有模式
   */
  getAllPatterns(): ReturnType<WisdomEvolutionSystem['getAllPatterns']> {
    return this.wisdomEvolution?.getAllPatterns() || [];
  }
  
  /**
   * 获取所有智慧
   */
  getAllWisdoms(): ReturnType<WisdomEvolutionSystem['getAllWisdoms']> {
    return this.wisdomEvolution?.getAllWisdoms() || [];
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取状态
   */
  getState(): {
    initialized: boolean;
    processingCount: number;
    neuronCount: number;
    synapseCount: number;
    memoryStats: ReturnType<LayeredMemorySystem['getState']>['stats'];
    stdpStats: ReturnType<STDPLearner['getStats']>;
    encoderStats: ReturnType<VectorEncoder['getStats']>;
    linkFieldStatus: WisdomSystemStatus | null;
    recentHistory: ProcessingHistoryItem[];
  } {
    return {
      initialized: this.isInitialized,
      processingCount: this.processingCount,
      neuronCount: this.neurons.size,
      synapseCount: this.synapseManager.getSynapseCount(),
      memoryStats: this.memory.getState().stats,
      stdpStats: this.stdpLearner.getStats(),
      encoderStats: this.encoder.getStats(),
      linkFieldStatus: this.getLinkFieldStatus(),
      recentHistory: this.processingHistory.slice(-10),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let brainInstance: SiliconBrainV2 | null = null;

export function getSiliconBrainV2(): SiliconBrainV2 {
  if (!brainInstance) {
    brainInstance = new SiliconBrainV2();
  }
  return brainInstance;
}
