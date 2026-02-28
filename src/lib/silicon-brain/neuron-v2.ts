/**
 * ═══════════════════════════════════════════════════════════════════════
 * Neural Neuron V2 - 纯 JavaScript 实现
 * 
 * 每个神经元是一个小型神经网络，能够：
 * - 接收向量输入
 * - 进行非线性变换
 * - 输出向量
 * - 在线学习（改变权重）
 * 
 * 这不是"意识"，这是意识可能涌现的基质
 * ═══════════════════════════════════════════════════════════════════════
 */

import { 
  NeuronType, 
  NeuronState, 
  NeuronConfig,
  NeuralSignal 
} from './types';
import { PureNeuralNetwork, createNeuronNetwork } from './pure-neural-network';

// ─────────────────────────────────────────────────────────────────────
// 神经网络神经元 V2
// ─────────────────────────────────────────────────────────────────────

export class NeuralNeuronV2 {
  readonly id: string;
  readonly type: NeuronType;
  
  private network: PureNeuralNetwork;
  private config: NeuronConfig;
  private state: NeuronState;
  
  // 记忆缓冲 - 存储最近的输入输出模式
  private memoryBuffer: Array<{
    input: Float32Array;
    output: Float32Array;
    timestamp: number;
    reward: number;
  }> = [];
  
  // 概念存储 - 学习到的抽象表示
  private conceptStore: Map<string, Float32Array> = new Map();
  
  constructor(config: NeuronConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
    
    // 创建纯 JavaScript 神经网络
    this.network = createNeuronNetwork(
      config.inputDimension,
      config.hiddenLayers || [64, 32],
      config.outputDimension,
      config.learningRate
    );
    
    this.state = {
      activation: 0,
      fatigue: 0,
      focusVector: null,
      outputVector: null,
      lastActivatedAt: 0,
      activationCount: 0,
    };
    
    console.log(`[NeuronV2:${this.id}] 初始化完成 (${this.type})`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 前向传播
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入信号
   */
  async process(signal: NeuralSignal): Promise<Float32Array> {
    // 更新激活状态
    this.state.activation = Math.min(1, this.state.activation + signal.strength * 0.3);
    this.state.focusVector = signal.vector;
    this.state.lastActivatedAt = Date.now();
    this.state.activationCount++;
    
    // 疲劳恢复
    this.state.fatigue = Math.max(0, this.state.fatigue - 0.05);
    
    // 确保向量维度正确
    const inputVector = new Float32Array(this.config.inputDimension);
    const copyLength = Math.min(signal.vector.length, this.config.inputDimension);
    inputVector.set(signal.vector.slice(0, copyLength));
    
    // 前向传播
    const outputArray = this.network.forward(Array.from(inputVector));
    const outputVector = new Float32Array(outputArray);
    
    this.state.outputVector = outputVector;
    
    // 存入记忆缓冲
    this.memoryBuffer.push({
      input: signal.vector,
      output: outputVector,
      timestamp: Date.now(),
      reward: 0, // 初始奖励为0，后续可能更新
    });
    
    // 保持缓冲区大小
    if (this.memoryBuffer.length > 1000) {
      this.memoryBuffer.shift();
    }
    
    return outputVector;
  }
  
  /**
   * 批量处理
   */
  async processBatch(signals: NeuralSignal[]): Promise<Float32Array[]> {
    const results: Float32Array[] = [];
    
    for (const signal of signals) {
      const output = await this.process(signal);
      results.push(output);
    }
    
    return results;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 学习
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 在线学习 - 根据奖励信号更新权重
   */
  async learn(rewardSignal: number): Promise<void> {
    if (this.memoryBuffer.length < 2) return;
    
    // 使用最近的记忆进行学习
    const recentMemory = this.memoryBuffer.slice(-10);
    
    for (let i = 0; i < recentMemory.length - 1; i++) {
      const current = recentMemory[i];
      const next = recentMemory[i + 1];
      
      // 预测学习：尝试预测下一个状态
      const loss = this.network.selfLearn(
        Array.from(current.input),
        Array.from(next.input)
      );
      
      // 更新记忆中的奖励
      current.reward = rewardSignal;
    }
    
    // 强化学习：根据奖励调整
    const lastMemory = this.memoryBuffer[this.memoryBuffer.length - 1];
    this.network.reinforce(Array.from(lastMemory.input), rewardSignal);
    
    // 疲劳增加
    this.state.fatigue = Math.min(1, this.state.fatigue + 0.1);
  }
  
  /**
   * 监督学习 - 有明确目标
   */
  async learnWithTarget(
    input: Float32Array,
    target: Float32Array,
    reward: number = 1
  ): Promise<number> {
    const loss = this.network.learn(
      Array.from(input),
      Array.from(target),
      reward
    );
    
    return loss;
  }
  
  /**
   * 概念学习 - 存储重要的模式
   */
  learnConcept(name: string, pattern: Float32Array): void {
    this.conceptStore.set(name, pattern);
    console.log(`[NeuronV2:${this.id}] 学习概念: ${name}`);
  }
  
  /**
   * 概念检索
   */
  recallConcept(name: string): Float32Array | null {
    return this.conceptStore.get(name) || null;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 涌现相关
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算神经元复杂度（涌现指标之一）
   */
  getComplexity(): number {
    const stats = this.network.getStats();
    
    // 复杂度 = 训练次数 * 平均损失的倒数
    // 训练越多、损失越小，复杂度越高
    const complexity = stats.trainingCount * (1 / (stats.averageLoss + 0.001));
    
    return Math.min(1, complexity / 10000); // 归一化
  }
  
  /**
   * 获取记忆多样性
   */
  getMemoryDiversity(): number {
    if (this.memoryBuffer.length < 10) return 0;
    
    // 计算记忆向量的平均距离
    const recentMemories = this.memoryBuffer.slice(-100);
    let totalDistance = 0;
    let comparisons = 0;
    
    for (let i = 0; i < recentMemories.length; i++) {
      for (let j = i + 1; j < Math.min(i + 10, recentMemories.length); j++) {
        const dist = this.vectorDistance(
          recentMemories[i].output,
          recentMemories[j].output
        );
        totalDistance += dist;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalDistance / comparisons : 0;
  }
  
  private vectorDistance(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取状态
   */
  getState(): NeuronState & {
    memoryCount: number;
    conceptCount: number;
    complexity: number;
    diversity: number;
    networkStats: ReturnType<PureNeuralNetwork['getStats']>;
  } {
    return {
      ...this.state,
      memoryCount: this.memoryBuffer.length,
      conceptCount: this.conceptStore.size,
      complexity: this.getComplexity(),
      diversity: this.getMemoryDiversity(),
      networkStats: this.network.getStats(),
    };
  }
  
  /**
   * 导出权重（用于持久化）
   */
  exportWeights(): ReturnType<PureNeuralNetwork['getState']> {
    return this.network.getState();
  }
  
  /**
   * 导入权重
   */
  importWeights(state: ReturnType<PureNeuralNetwork['getState']>): void {
    this.network.setState(state);
    console.log(`[NeuronV2:${this.id}] 权重已恢复`);
  }
  
  /**
   * 重置
   */
  reset(): void {
    this.state = {
      activation: 0,
      fatigue: 0,
      focusVector: null,
      outputVector: null,
      lastActivatedAt: 0,
      activationCount: 0,
    };
    this.memoryBuffer = [];
    console.log(`[NeuronV2:${this.id}] 已重置`);
  }
}
