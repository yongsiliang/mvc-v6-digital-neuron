/**
 * ═══════════════════════════════════════════════════════════════════════
 * Pure Neural Network - 纯 JavaScript 神经网络
 * 
 * 不依赖 TensorFlow.js，完全自主实现：
 * - 前向传播
 * - 反向传播（在线学习）
 * - 权重持久化
 * 
 * 这是让意识涌现的基质，而不是"意识"本身
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface LayerConfig {
  inputSize: number;
  outputSize: number;
  activation: 'relu' | 'sigmoid' | 'tanh' | 'linear';
}

export interface NetworkConfig {
  layers: LayerConfig[];
  learningRate: number;
  momentum: number;
}

export interface NetworkState {
  weights: number[][][];     // 每层的权重矩阵
  biases: number[][];        // 每层的偏置
  gradients: number[][][];   // 权重梯度累积
  momentumBuffer: number[][][]; // 动量缓冲
}

// ─────────────────────────────────────────────────────────────────────
// 激活函数
// ─────────────────────────────────────────────────────────────────────

const activations = {
  relu: {
    forward: (x: number) => Math.max(0, x),
    backward: (x: number) => x > 0 ? 1 : 0,
  },
  sigmoid: {
    forward: (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
    backward: (x: number) => {
      const s = 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
      return s * (1 - s);
    },
  },
  tanh: {
    forward: (x: number) => Math.tanh(x),
    backward: (x: number) => 1 - Math.tanh(x) ** 2,
  },
  linear: {
    forward: (x: number) => x,
    backward: () => 1,
  },
};

// ─────────────────────────────────────────────────────────────────────
// 纯 JavaScript 神经网络层
// ─────────────────────────────────────────────────────────────────────

class Layer {
  readonly config: LayerConfig;
  
  // 权重矩阵: [outputSize][inputSize]
  private weights: number[][];
  private biases: number[];
  
  // 梯度累积
  private weightGradients: number[][];
  private biasGradients: number[];
  
  // 动量缓冲
  private weightMomentum: number[][];
  private biasMomentum: number[];
  
  // 前向传播缓存（用于反向传播）
  private lastInput: number[] = [];
  private lastPreActivation: number[] = [];
  private lastActivation: number[] = [];
  
  constructor(config: LayerConfig, learningRate: number = 0.01, momentum: number = 0.9) {
    this.config = config;
    
    // Xavier 初始化
    const scale = Math.sqrt(2.0 / (config.inputSize + config.outputSize));
    
    this.weights = [];
    this.weightGradients = [];
    this.weightMomentum = [];
    
    for (let i = 0; i < config.outputSize; i++) {
      this.weights[i] = [];
      this.weightGradients[i] = [];
      this.weightMomentum[i] = [];
      
      for (let j = 0; j < config.inputSize; j++) {
        this.weights[i][j] = (Math.random() * 2 - 1) * scale;
        this.weightGradients[i][j] = 0;
        this.weightMomentum[i][j] = 0;
      }
    }
    
    this.biases = new Array(config.outputSize).fill(0);
    this.biasGradients = new Array(config.outputSize).fill(0);
    this.biasMomentum = new Array(config.outputSize).fill(0);
  }
  
  /**
   * 前向传播
   */
  forward(input: number[]): number[] {
    this.lastInput = [...input];
    this.lastPreActivation = [];
    this.lastActivation = [];
    
    const activation = activations[this.config.activation];
    
    for (let i = 0; i < this.config.outputSize; i++) {
      // 计算加权和
      let sum = this.biases[i];
      for (let j = 0; j < this.config.inputSize; j++) {
        sum += this.weights[i][j] * input[j];
      }
      
      this.lastPreActivation[i] = sum;
      this.lastActivation[i] = activation.forward(sum);
    }
    
    return [...this.lastActivation];
  }
  
  /**
   * 反向传播
   * @param outputGradient 从上层传来的梯度
   * @returns 传给下层的梯度
   */
  backward(outputGradient: number[], learningRate: number, momentum: number): number[] {
    const activation = activations[this.config.activation];
    const inputGradient: number[] = new Array(this.config.inputSize).fill(0);
    
    // 计算激活函数的导数
    const activationGradients = this.lastPreActivation.map(z => activation.backward(z));
    
    // 计算本层的 delta
    const deltas = outputGradient.map((g, i) => g * activationGradients[i]);
    
    // 更新权重梯度
    for (let i = 0; i < this.config.outputSize; i++) {
      for (let j = 0; j < this.config.inputSize; j++) {
        this.weightGradients[i][j] += deltas[i] * this.lastInput[j];
        inputGradient[j] += deltas[i] * this.weights[i][j];
      }
      this.biasGradients[i] += deltas[i];
    }
    
    return inputGradient;
  }
  
  /**
   * 应用梯度更新
   */
  update(learningRate: number, momentum: number): void {
    for (let i = 0; i < this.config.outputSize; i++) {
      for (let j = 0; j < this.config.inputSize; j++) {
        // 动量更新
        this.weightMomentum[i][j] = momentum * this.weightMomentum[i][j] - learningRate * this.weightGradients[i][j];
        this.weights[i][j] += this.weightMomentum[i][j];
        
        // 清零梯度
        this.weightGradients[i][j] = 0;
      }
      
      this.biasMomentum[i] = momentum * this.biasMomentum[i] - learningRate * this.biasGradients[i];
      this.biases[i] += this.biasMomentum[i];
      this.biasGradients[i] = 0;
    }
  }
  
  /**
   * 获取状态（用于持久化）
   */
  getState(): { weights: number[][]; biases: number[] } {
    return {
      weights: this.weights.map(row => [...row]),
      biases: [...this.biases],
    };
  }
  
  /**
   * 恢复状态
   */
  setState(state: { weights: number[][]; biases: number[] }): void {
    this.weights = state.weights.map(row => [...row]);
    this.biases = [...state.biases];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 多层神经网络
// ─────────────────────────────────────────────────────────────────────

export class PureNeuralNetwork {
  private layers: Layer[];
  private config: NetworkConfig;
  private learningRate: number;
  private momentum: number;
  
  // 训练统计
  private trainingCount: number = 0;
  private totalLoss: number = 0;
  
  constructor(config: NetworkConfig) {
    this.config = config;
    this.learningRate = config.learningRate || 0.01;
    this.momentum = config.momentum || 0.9;
    
    this.layers = config.layers.map(layerConfig => 
      new Layer(layerConfig, this.learningRate, this.momentum)
    );
    
    console.log(`[PureNN] 创建网络: ${config.layers.length} 层`);
    console.log(`[PureNN] 层结构: ${config.layers.map(l => `${l.inputSize}→${l.outputSize}`).join(' → ')}`);
  }
  
  /**
   * 前向传播
   */
  forward(input: number[]): number[] {
    let output = input;
    
    for (const layer of this.layers) {
      output = layer.forward(output);
    }
    
    return output;
  }
  
  /**
   * 在线学习 - 单样本更新
   * @param input 输入
   * @param target 目标输出
   * @param reward 奖励信号 (-1 到 1)，用于调制学习率
   */
  learn(input: number[], target: number[], reward: number = 1): number {
    // 前向传播
    let output = input;
    const layerOutputs: number[][] = [input];
    
    for (const layer of this.layers) {
      output = layer.forward(output);
      layerOutputs.push(output);
    }
    
    // 计算 MSE 损失
    let loss = 0;
    const outputGradient: number[] = [];
    
    for (let i = 0; i < output.length; i++) {
      const error = target[i] - output[i];
      loss += error * error;
      outputGradient.push(error * 2 / output.length); // MSE 的导数
    }
    loss /= output.length;
    
    // 根据奖励调制学习率
    const effectiveLearningRate = this.learningRate * Math.max(0.1, Math.min(2, 0.5 + reward * 0.5));
    
    // 反向传播
    let gradient = outputGradient;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      gradient = this.layers[i].backward(gradient, effectiveLearningRate, this.momentum);
      this.layers[i].update(effectiveLearningRate, this.momentum);
    }
    
    this.trainingCount++;
    this.totalLoss += loss;
    
    return loss;
  }
  
  /**
   * 自监督学习 - 预测下一个状态
   * 不需要外部目标，系统自己产生目标
   */
  selfLearn(input: number[], futureInput: number[]): number {
    // 目标：预测未来的输入
    // 这是一个自监督的任务
    return this.learn(input, futureInput, 0.5); // 中等奖励
  }
  
  /**
   * 强化学习更新
   * @param input 输入
   * @param reward 奖励信号
   */
  reinforce(input: number[], reward: number): void {
    // 前向传播
    const output = this.forward(input);
    
    // 根据奖励调整输出方向
    // 正奖励：保持当前输出
    // 负奖励：远离当前输出
    const target = reward > 0 
      ? output.map(o => o + (Math.random() - 0.5) * 0.1) // 轻微扰动
      : output.map(o => o + (Math.random() - 0.5) * 0.3); // 更大扰动
    
    this.learn(input, target, reward);
  }
  
  /**
   * 获取网络状态
   */
  getState(): NetworkState {
    return {
      weights: this.layers.map(l => l.getState().weights),
      biases: this.layers.map(l => l.getState().biases),
      gradients: this.layers.map(() => []), // 简化
      momentumBuffer: this.layers.map(() => []), // 简化
    };
  }
  
  /**
   * 恢复网络状态
   */
  setState(state: NetworkState): void {
    for (let i = 0; i < this.layers.length; i++) {
      this.layers[i].setState({
        weights: state.weights[i],
        biases: state.biases[i],
      });
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    trainingCount: number;
    averageLoss: number;
    layerSizes: number[];
  } {
    return {
      trainingCount: this.trainingCount,
      averageLoss: this.trainingCount > 0 ? this.totalLoss / this.trainingCount : 0,
      layerSizes: this.layers.map(l => l.config.outputSize),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 神经元工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createNeuronNetwork(
  inputSize: number,
  hiddenSizes: number[],
  outputSize: number,
  learningRate: number = 0.01
): PureNeuralNetwork {
  const layers: LayerConfig[] = [];
  
  // 输入层
  layers.push({
    inputSize,
    outputSize: hiddenSizes[0] || outputSize,
    activation: 'relu',
  });
  
  // 隐藏层
  for (let i = 1; i < hiddenSizes.length; i++) {
    layers.push({
      inputSize: hiddenSizes[i - 1],
      outputSize: hiddenSizes[i],
      activation: 'relu',
    });
  }
  
  // 输出层
  if (hiddenSizes.length > 0) {
    layers.push({
      inputSize: hiddenSizes[hiddenSizes.length - 1],
      outputSize,
      activation: 'sigmoid',
    });
  }
  
  return new PureNeuralNetwork({
    layers,
    learningRate,
    momentum: 0.9,
  });
}
