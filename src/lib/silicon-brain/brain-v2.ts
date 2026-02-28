/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain V2 - 硅基大脑 V2
 * 
 * 核心理念：
 * - LLM 不是大脑，只是语言接口（翻译器）
 * - 神经网络才是核心，能学习、可塑、可涌现
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
import {
  NeuronType,
  NeuronConfig,
  SiliconBrainConfig,
  NeuralSignal,
  ConsciousnessMetrics,
} from './types';

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
  
  // 状态
  private processingHistory: Array<{
    input: string;
    output: string;
    timestamp: number;
    metrics: ConsciousnessMetrics;
  }> = [];
  
  private isInitialized: boolean = false;
  private processingCount: number = 0;
  
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
    
    console.log('[SiliconBrainV2] 硅基大脑 V2 创建完成');
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
        
        // 如果没有前一层输入，使用当前向量
        if (incomingSynapses.length === 0) {
          weightedInput = currentVector;
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
    recentHistory: typeof this.processingHistory;
  } {
    return {
      initialized: this.isInitialized,
      processingCount: this.processingCount,
      neuronCount: this.neurons.size,
      synapseCount: this.synapseManager.getSynapseCount(),
      memoryStats: this.memory.getState().stats,
      stdpStats: this.stdpLearner.getStats(),
      encoderStats: this.encoder.getStats(),
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
