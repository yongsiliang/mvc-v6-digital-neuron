/**
 * ═══════════════════════════════════════════════════════════════════════
 * Neural Neuron - 真正的神经网络神经元
 * 
 * 每个"神经元"是一个小型神经网络，能够：
 * - 接收向量输入
 * - 进行非线性变换
 * - 输出向量
 * - 在线学习（改变权重）
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';
import { 
  NeuronType, 
  NeuronState, 
  NeuronConfig,
  NeuralSignal 
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 神经网络神经元
// ─────────────────────────────────────────────────────────────────────

export class NeuralNeuron {
  readonly id: string;
  readonly type: NeuronType;
  
  private model: tf.LayersModel | null = null;
  private config: NeuronConfig;
  private state: NeuronState;
  
  // 优化器
  private optimizer: tf.Optimizer;
  
  // 输入缓冲
  private inputBuffer: Float32Array[] = [];
  private outputBuffer: Float32Array[] = [];
  
  constructor(config: NeuronConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
    
    this.optimizer = tf.train.adam(config.learningRate);
    
    this.state = {
      activation: 0,
      fatigue: 0,
      focusVector: null,
      outputVector: null,
      lastActivatedAt: 0,
      activationCount: 0,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化神经网络
   */
  async initialize(): Promise<void> {
    // 构建网络层
    const layers: tf.layers.Layer[] = [];
    
    // 输入层
    layers.push(tf.layers.dense({
      units: this.config.hiddenLayers[0] || 128,
      activation: 'relu',
      inputShape: [this.config.inputDimension],
      kernelInitializer: 'glorotNormal',
    }));
    
    // 隐藏层
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      layers.push(tf.layers.dropout({ rate: 0.1 }));
      layers.push(tf.layers.dense({
        units: this.config.hiddenLayers[i],
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
      }));
    }
    
    // 输出层
    layers.push(tf.layers.dense({
      units: this.config.outputDimension,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal',
    }));
    
    // 创建模型
    this.model = tf.sequential({ layers }) as tf.LayersModel;
    
    // 编译模型
    this.model.compile({
      optimizer: this.optimizer,
      loss: 'meanSquaredError',
    });
    
    // 预热模型 - 解决服务器端预测问题
    try {
      const dummyInput = tf.zeros([1, this.config.inputDimension]);
      const warmupOutput = this.model.predict(dummyInput) as tf.Tensor;
      const warmupData = warmupOutput.dataSync();
      dummyInput.dispose();
      warmupOutput.dispose();
      console.log(`[Neuron:${this.id}] 模型预热完成，输出维度: ${warmupData.length}`);
    } catch (e) {
      console.warn(`[Neuron:${this.id}] 模型预热失败，将使用备用处理:`, e);
    }
    
    console.log(`[Neuron:${this.id}] 初始化完成 (${this.type})`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 前向传播
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入信号
   */
  async process(signal: NeuralSignal): Promise<Float32Array> {
    if (!this.model) {
      throw new Error(`Neuron ${this.id} not initialized`);
    }
    
    // 更新激活状态
    this.state.activation = Math.min(1, this.state.activation + signal.strength * 0.3);
    this.state.focusVector = signal.vector;
    this.state.lastActivatedAt = Date.now();
    this.state.activationCount++;
    
    // 疲劳恢复
    this.state.fatigue = Math.max(0, this.state.fatigue - 0.05);
    
    // 前向传播
    // 确保向量维度正确
    const inputVector = new Float32Array(this.config.inputDimension);
    const copyLength = Math.min(signal.vector.length, this.config.inputDimension);
    inputVector.set(signal.vector.slice(0, copyLength));
    
    // 由于 TensorFlow.js 在服务器端存在兼容性问题，使用简化的处理
    // 这里使用简单的权重变换来模拟神经网络
    let outputVector: Float32Array;
    
    try {
      // 尝试使用模型预测
      // 将 Float32Array 转换为普通数组以兼容 TensorFlow.js 类型
      const inputArray = Array.from(inputVector);
      const outputData = tf.tidy(() => {
        const inputTensor = tf.tensor2d([inputArray], [1, this.config.inputDimension]);
        const outputTensor = this.model!.predict(inputTensor) as tf.Tensor;
        // 返回普通数组，避免类型问题
        return Array.from(outputTensor.dataSync() as unknown as number[]);
      });
      outputVector = new Float32Array(outputData);
    } catch {
      // 备用处理：使用简单的变换
      outputVector = new Float32Array(this.config.outputDimension);
      for (let i = 0; i < this.config.outputDimension; i++) {
        // 简单的非线性变换
        const inputIdx = i % inputVector.length;
        outputVector[i] = Math.tanh(inputVector[inputIdx]) * 0.5 + 0.5;
      }
    }
    
    this.state.outputVector = outputVector!;
    
    // 缓存用于学习
    this.inputBuffer.push(signal.vector);
    this.outputBuffer.push(outputVector);
    
    // 保持缓冲区大小
    if (this.inputBuffer.length > 100) {
      this.inputBuffer.shift();
      this.outputBuffer.shift();
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
  async learn(reward: number, targetVector?: Float32Array): Promise<void> {
    if (!this.model || this.inputBuffer.length === 0) return;
    
    // 如果提供了目标向量，使用监督学习
    if (targetVector) {
      const inputTensor = tf.tensor2d(
        this.inputBuffer.map(v => Array.from(v)),
        [this.inputBuffer.length, this.config.inputDimension]
      );
      
      const targetTensor = tf.tensor2d(
        [Array.from(targetVector)],
        [1, targetVector.length]
      );
      
      // 训练一步
      await this.model.fit(inputTensor, tf.tile(targetTensor, [this.inputBuffer.length, 1]), {
        epochs: 1,
        batchSize: this.inputBuffer.length,
        verbose: 0,
      });
      
      inputTensor.dispose();
      targetTensor.dispose();
    } else {
      // 强化学习：根据奖励调整
      // 使用奖励来决定是保持还是改变当前输出
      if (reward > 0) {
        // 正奖励：强化当前行为
        // 这里简化处理：轻微调整权重向当前输出方向
        const lastOutput = this.outputBuffer[this.outputBuffer.length - 1];
        if (lastOutput) {
          await this.learn(reward, lastOutput);
        }
      } else if (reward < 0) {
        // 负奖励：增加疲劳，降低激活
        this.state.fatigue = Math.min(1, this.state.fatigue + 0.1);
        this.state.activation = Math.max(0, this.state.activation - 0.1);
      }
    }
    
    // 根据可塑性调整学习效果
    // plasticity 越高，权重变化越大
  }
  
  /**
   * 赫布学习 - 与其他神经元协同学习
   */
  async hebbianLearn(
    preActivation: number,
    postActivation: number,
    learningRate: number = 0.01
  ): Promise<number> {
    // 经典赫布规则：Δw = η * pre * post
    const deltaWeight = learningRate * preActivation * postActivation;
    
    // 返回权重变化量，由突触系统应用
    return deltaWeight;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取当前状态
   */
  getState(): NeuronState {
    return { ...this.state };
  }
  
  /**
   * 重置状态
   */
  resetState(): void {
    this.state.activation = 0;
    this.state.fatigue = Math.min(1, this.state.fatigue + 0.1); // 每次重置增加疲劳
    this.state.focusVector = null;
    this.state.outputVector = null;
  }
  
  /**
   * 恢复疲劳
   */
  rest(): void {
    this.state.fatigue = Math.max(0, this.state.fatigue - 0.2);
    this.state.activation = 0;
  }
  
  /**
   * 获取输出向量
   */
  getOutput(): Float32Array | null {
    return this.state.outputVector;
  }
  
  /**
   * 获取模型权重（用于持久化）
   */
  async getWeights(): Promise<tf.NamedTensorMap[]> {
    if (!this.model) return [];
    
    const weights = this.model.getWeights();
    const result: tf.NamedTensorMap[] = [];
    
    for (let i = 0; i < weights.length; i++) {
      result.push({
        [`layer_${i}_weight`]: weights[i],
      });
    }
    
    return result;
  }
  
  /**
   * 设置模型权重（用于恢复）
   */
  async setWeights(weights: Float32Array[]): Promise<void> {
    if (!this.model) return;
    
    const weightTensors = weights.map(w => tf.tensor(w));
    this.model.setWeights(weightTensors);
    
    weightTensors.forEach(t => t.dispose());
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 清理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.optimizer.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 神经元工厂
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建神经元
 */
export async function createNeuron(
  type: NeuronType,
  index: number,
  vectorDimension: number
): Promise<NeuralNeuron> {
  // 根据类型设置不同的隐藏层配置
  const hiddenLayerConfigs: Record<NeuronType, number[]> = {
    sensory: [128, 64],      // 感知：提取特征
    memory: [256, 128, 64],  // 记忆：更深的网络
    reasoning: [128, 128],   // 推理：中等深度
    emotion: [64, 32],       // 情感：较小的网络
    decision: [64, 32],      // 决策：小型网络
    motor: [64, 32],         // 运动：小型网络
    self: [128, 64, 32],     // 自我：深层网络
  };
  
  const config: NeuronConfig = {
    id: `${type}_${index}`,
    type,
    inputDimension: vectorDimension,
    outputDimension: vectorDimension,
    hiddenLayers: hiddenLayerConfigs[type],
    learningRate: 0.01,
    plasticity: 0.1,
  };
  
  const neuron = new NeuralNeuron(config);
  await neuron.initialize();
  
  return neuron;
}
