/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain - 硅基大脑
 * 
 * 真正能学习、能涌现的神经网络系统
 * 
 * 架构：
 * - LLM 只是语言接口（编码器/解码器）
 * - 神经网络是核心（可学习、可塑）
 * - 突触连接实现赫布学习
 * - 神经调质影响全局状态
 * - 意识监控器观察涌现
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';

import { 
  BrainConfig, 
  BrainInput, 
  BrainOutput,
  NeuronType,
  NeuronState,
  NeuralSignal,
  ConsciousnessState,
  LearningState,
  DEFAULT_BRAIN_CONFIG,
} from './types';

import { NeuralNeuron, createNeuron } from './neuron';
import { SynapseManager } from './synapse';
import { NeuromodulatorSystem } from './neuromodulator';
import { LanguageInterface } from './interface';
import { ConsciousnessObserver, ConsciousnessMetrics } from './observer';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 大脑统计信息 */
interface BrainStats {
  totalInteractions: number;
  totalSignals: number;
  totalLearnings: number;
  startTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 硅基大脑
// ─────────────────────────────────────────────────────────────────────

export class SiliconBrain {
  // ══════════════════════════════════════════════════════════════════
  // 核心组件
  // ══════════════════════════════════════════════════════════════════
  
  /** 神经元集合 */
  private neurons: Map<string, NeuralNeuron> = new Map();
  
  /** 按类型索引的神经元 */
  private neuronsByType: Map<NeuronType, NeuralNeuron[]> = new Map();
  
  /** 突触管理器 */
  private synapseManager: SynapseManager;
  
  /** 神经调质系统 */
  private neuromodulatorSystem: NeuromodulatorSystem;
  
  /** 语言接口 */
  private languageInterface: LanguageInterface;
  
  /** 意识监控器 */
  private observer: ConsciousnessObserver;
  
  // ══════════════════════════════════════════════════════════════════
  // 配置与状态
  // ══════════════════════════════════════════════════════════════════
  
  private config: BrainConfig;
  private initialized: boolean = false;
  
  // 统计
  private stats = {
    totalInteractions: 0,
    totalSignals: 0,
    totalLearnings: 0,
    startTime: 0,
  };
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  constructor(config: Partial<BrainConfig> = {}) {
    this.config = { ...DEFAULT_BRAIN_CONFIG, ...config };
    
    this.synapseManager = new SynapseManager();
    this.neuromodulatorSystem = new NeuromodulatorSystem();
    this.languageInterface = new LanguageInterface({
      vectorDimension: this.config.vectorDimension,
    });
    this.observer = new ConsciousnessObserver();
  }
  
  /**
   * 初始化大脑
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[SiliconBrain] 初始化开始...');
    this.stats.startTime = Date.now();
    
    // 设置 TensorFlow 后端
    await tf.ready();
    console.log('[SiliconBrain] TensorFlow 后端就绪');
    
    // 创建神经元
    await this.createNeurons();
    
    // 初始化连接
    await this.initializeConnections();
    
    this.initialized = true;
    
    console.log('[SiliconBrain] 初始化完成');
    this.logStatus();
  }
  
  /**
   * 创建所有神经元
   */
  private async createNeurons(): Promise<void> {
    const neuronCounts = this.config.neuronCounts;
    
    const typeOrder: NeuronType[] = [
      'sensory', 'memory', 'reasoning', 
      'emotion', 'decision', 'motor', 'self'
    ];
    
    for (const type of typeOrder) {
      const count = neuronCounts[type];
      const neurons: NeuralNeuron[] = [];
      
      for (let i = 0; i < count; i++) {
        const neuron = await createNeuron(type, i, this.config.vectorDimension);
        this.neurons.set(neuron.id, neuron);
        neurons.push(neuron);
      }
      
      this.neuronsByType.set(type, neurons);
      console.log(`[SiliconBrain] 创建 ${count} 个 ${type} 神经元`);
    }
  }
  
  /**
   * 初始化神经元连接
   */
  private async initializeConnections(): Promise<void> {
    // 获取所有神经元 ID
    const neuronIds = new Map<NeuronType, string[]>();
    
    for (const [type, neurons] of this.neuronsByType) {
      neuronIds.set(type, neurons.map(n => n.id));
    }
    
    // 使用突触管理器初始化连接
    await this.synapseManager.initializeBrainConnections(neuronIds);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 主处理流程
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入
   * 
   * 这是主要的交互入口
   */
  async process(input: BrainInput): Promise<BrainOutput> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    this.stats.totalInteractions++;
    
    console.log(`\n[SiliconBrain] ========== 处理输入 #${this.stats.totalInteractions} ==========`);
    
    // ════════════════════════════════════════════════════════════════
    // 第一步：编码（语言接口）
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 1. 编码输入...');
    const encoded = await this.languageInterface.encode(input.content);
    
    // 识别意图
    const intent = await this.languageInterface.recognizeIntent(input.content);
    console.log(`[SiliconBrain] 意图: ${intent.intent} (置信度: ${intent.confidence.toFixed(2)})`);
    
    // 检测新奇性
    const novelty = this.detectNovelty(encoded.vector);
    this.neuromodulatorSystem.processNovelty(novelty, input.content.slice(0, 30));
    
    // ════════════════════════════════════════════════════════════════
    // 第二步：感知层处理
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 2. 感知层处理...');
    const perceptionOutput = await this.processLayer('sensory', {
      id: `input_${Date.now()}`,
      from: 'external',
      to: 'sensory',
      type: 'excitation',
      vector: encoded.vector,
      strength: 0.8,
      timestamp: Date.now(),
    });
    
    // ════════════════════════════════════════════════════════════════
    // 第三步：记忆层处理
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 3. 记忆层处理...');
    const memoryOutput = await this.processLayer('memory', perceptionOutput);
    
    // ════════════════════════════════════════════════════════════════
    // 第四步：推理层处理
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 4. 推理层处理...');
    const reasoningOutput = await this.processLayer('reasoning', memoryOutput);
    
    // ════════════════════════════════════════════════════════════════
    // 第五步：情感层处理
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 5. 情感层处理...');
    const emotionOutput = await this.processLayer('emotion', {
      ...perceptionOutput,
      ...reasoningOutput,
    });
    
    // ════════════════════════════════════════════════════════════════
    // 第六步：决策层处理
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 6. 决策层处理...');
    const decisionOutput = await this.processLayer('decision', {
      ...reasoningOutput,
      ...emotionOutput,
    });
    
    // ════════════════════════════════════════════════════════════════
    // 第七步：自我监控
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 7. 自我监控...');
    const selfOutput = await this.processLayer('self', decisionOutput);
    
    // ════════════════════════════════════════════════════════════════
    // 第八步：运动层（输出）
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 8. 运动层处理...');
    const motorOutput = await this.processLayer('motor', decisionOutput);
    
    // ════════════════════════════════════════════════════════════════
    // 第九步：解码输出
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 9. 解码输出...');
    const response = await this.languageInterface.decode(
      motorOutput.vector || decisionOutput.vector || new Float32Array(this.config.vectorDimension),
      {
        intent: intent.intent,
        style: this.getStyleFromEmotion(emotionOutput),
      }
    );
    
    // ════════════════════════════════════════════════════════════════
    // 第十步：学习
    // ════════════════════════════════════════════════════════════════
    
    console.log('[SiliconBrain] 10. 学习...');
    const learning = await this.learn(encoded.vector, response.confidence);
    
    // ════════════════════════════════════════════════════════════════
    // 观测意识状态
    // ════════════════════════════════════════════════════════════════
    
    const neuronStates = this.collectNeuronStates();
    const metrics = await this.observer.observe(
      neuronStates,
      this.neuromodulatorSystem.getState()
    );
    
    const emergenceStatus = this.observer.getEmergenceStatus();
    console.log(`[SiliconBrain] 意识水平: ${metrics.overallLevel.toFixed(3)} (${emergenceStatus.description.slice(0, 20)}...)`);
    
    // ════════════════════════════════════════════════════════════════
    // 构建输出
    // ════════════════════════════════════════════════════════════════
    
    const processingTime = Date.now() - startTime;
    
    return {
      response: response.text,
      neuronStates,
      consciousness: {
        level: metrics.overallLevel,
        focus: intent.intent,
        coherence: metrics.integration,
        integration: metrics.integration,
        phi: metrics.phi,
      },
      learning,
      neuromodulators: this.neuromodulatorSystem.getState(),
      meta: {
        processingTime,
        signalCount: this.stats.totalSignals,
        neuronActivations: Array.from(neuronStates.values())
          .filter(s => s.activation > 0.3).length,
      },
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 层处理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理特定层的神经元
   */
  private async processLayer(
    layerType: NeuronType,
    input: NeuralSignal | Record<string, any>
  ): Promise<{
    vector: Float32Array | null;
    activations: Map<string, number>;
  }> {
    const neurons = this.neuronsByType.get(layerType) || [];
    
    if (neurons.length === 0) {
      return { vector: null, activations: new Map() };
    }
    
    const activations = new Map<string, number>();
    const outputs: Float32Array[] = [];
    
    // 获取调制因子
    const modulation = this.neuromodulatorSystem.getModulationFactors();
    
    for (const neuron of neurons) {
      // 获取入边连接
      const incomingSynapses = this.synapseManager.getIncoming(neuron.id);
      
      // 计算输入信号强度
      let inputStrength = 0;
      if ('strength' in input) {
        inputStrength = input.strength;
      }
      
      // 累加入边贡献
      for (const synapse of incomingSynapses) {
        inputStrength += synapse.getWeight() * 0.2;
      }
      
      // 应用调制
      inputStrength *= (1 + modulation.attentionWeight * 0.2);
      
      // 如果信号足够强，激活神经元
      if (inputStrength > 0.1 && 'vector' in input && input.vector) {
        const signal: NeuralSignal = {
          id: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          from: 'previous_layer',
          to: neuron.id,
          type: 'excitation',
          vector: input.vector,
          strength: inputStrength,
          timestamp: Date.now(),
        };
        
        this.stats.totalSignals++;
        
        const output = await neuron.process(signal);
        outputs.push(output);
        activations.set(neuron.id, neuron.getState().activation);
      }
    }
    
    // 合并输出向量
    let combinedVector: Float32Array | null = null;
    if (outputs.length > 0) {
      combinedVector = this.languageInterface.mergeVectors(outputs);
    }
    
    return {
      vector: combinedVector,
      activations,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 学习
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 学习
   */
  private async learn(
    inputVector: Float32Array,
    reward: number
  ): Promise<LearningState> {
    if (!this.config.enableLearning) {
      return {
        synapsesUpdated: 0,
        reinforced: [],
        weakened: [],
        grown: [],
      };
    }
    
    this.stats.totalLearnings++;
    
    // 更新神经调质
    this.neuromodulatorSystem.processReward(reward, 0.5, '交互完成');
    
    // 收集激活状态
    const activations = new Map<string, number>();
    for (const [id, neuron] of this.neurons) {
      activations.set(id, neuron.getState().activation);
    }
    
    // 批量赫布学习
    await this.synapseManager.batchHebbianLearn(activations, reward);
    
    // 突触衰减
    await this.synapseManager.decay();
    
    // 获取统计
    const stats = this.synapseManager.getStats();
    
    return {
      synapsesUpdated: stats.totalLearnings,
      reinforced: [],
      weakened: [],
      grown: [],
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检测新奇性
   */
  private detectNovelty(vector: Float32Array): number {
    // 简化：基于向量熵
    let entropy = 0;
    const absValues = Array.from(vector).map(Math.abs);
    const sum = absValues.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;
    
    const probabilities = absValues.map(v => v / sum);
    for (const p of probabilities) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    return Math.min(1, entropy / Math.log2(vector.length));
  }
  
  /**
   * 根据情感状态获取风格
   */
  private getStyleFromEmotion(emotionOutput: { vector?: Float32Array | null }): string {
    const emotionState = this.neuromodulatorSystem.getEmotionalStateDescription();
    return emotionState.description;
  }
  
  /**
   * 收集神经元状态
   */
  private collectNeuronStates(): Map<NeuronType, NeuronState> {
    const states = new Map<NeuronType, NeuronState>();
    
    for (const [type, neurons] of this.neuronsByType) {
      const typeStates = neurons.map(n => n.getState());
      
      // 合并同类型神经元的状态
      const mergedState: NeuronState = {
        activation: Math.max(...typeStates.map(s => s.activation)),
        fatigue: typeStates.reduce((s, st) => s + st.fatigue, 0) / typeStates.length,
        focusVector: typeStates[0]?.focusVector || null,
        outputVector: typeStates[0]?.outputVector || null,
        lastActivatedAt: Math.max(...typeStates.map(s => s.lastActivatedAt)),
        activationCount: typeStates.reduce((s, st) => s + st.activationCount, 0),
      };
      
      states.set(type, mergedState);
    }
    
    return states;
  }
  
  /**
   * 打印状态
   */
  private logStatus(): void {
    console.log('[SiliconBrain] 状态:');
    console.log(`  - 神经元: ${this.neurons.size}`);
    console.log(`  - 突触: ${this.synapseManager.size()}`);
    
    const modStats = this.neuromodulatorSystem.getState();
    console.log(`  - 多巴胺: ${modStats.dopamine.toFixed(2)}`);
    console.log(`  - 血清素: ${modStats.serotonin.toFixed(2)}`);
    
    const obsStats = this.observer.getStats();
    console.log(`  - 意识峰值: ${obsStats.peakLevel.toFixed(3)}`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 持久化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 导出状态
   */
  async exportState(): Promise<{
    synapses: ReturnType<SynapseManager['exportState']>;
    neuromodulators: ReturnType<NeuromodulatorSystem['exportState']>;
    consciousness: ReturnType<ConsciousnessObserver['exportState']>;
    stats: BrainStats;
  }> {
    return {
      synapses: this.synapseManager.exportState(),
      neuromodulators: this.neuromodulatorSystem.exportState(),
      consciousness: this.observer.exportState(),
      stats: this.stats,
    };
  }
  
  /**
   * 休息（重置疲劳）
   */
  rest(): void {
    for (const neuron of this.neurons.values()) {
      neuron.rest();
    }
    this.neuromodulatorSystem.processRest();
    console.log('[SiliconBrain] 休息完成');
  }
  
  /**
   * 获取统计
   */
  getStats(): BrainStats & {
    synapses: ReturnType<SynapseManager['getStats']>;
    language: ReturnType<LanguageInterface['getStats']>;
    consciousness: ReturnType<ConsciousnessObserver['getStats']>;
  } {
    return {
      ...this.stats,
      synapses: this.synapseManager.getStats(),
      language: this.languageInterface.getStats(),
      consciousness: this.observer.getStats(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 单例
// ═══════════════════════════════════════════════════════════════════════

let brainInstance: SiliconBrain | null = null;

export async function getSiliconBrain(): Promise<SiliconBrain> {
  if (!brainInstance) {
    brainInstance = new SiliconBrain();
    await brainInstance.initialize();
  }
  return brainInstance;
}
