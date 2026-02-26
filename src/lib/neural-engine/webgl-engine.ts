/**
 * ═══════════════════════════════════════════════════════════════════════
 * WebGL 神经计算引擎 - WebGL Neural Computation Engine
 * 
 * 使用 TensorFlow.js WebGL 后端在浏览器 GPU 上运行
 * 无需 CUDA，利用任何现代浏览器的 WebGL 支持
 * ═══════════════════════════════════════════════════════════════════════
 */

// 注意：这是一个前端模块，只在浏览器中运行
// 使用动态导入避免 SSR 问题

import type { NeuronRole, NeuralProcessingResult } from './neural-engine';
import type { Tensor1D } from '@tensorflow/tfjs';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface WebGLEngineConfig {
  /** VSA 维度 */
  vsaDimension: number;
  
  /** 最大神经元数量 */
  maxNeurons: number;
  
  /** 学习率 */
  learningRate: number;
  
  /** 是否启用预测 */
  enablePrediction: boolean;
}

export interface WebGLEngineState {
  initialized: boolean;
  backend: string;
  gpuAvailable: boolean;
  neuronCount: number;
  conceptCount: number;
}

interface NeuronData {
  label: string;
  role: NeuronRole;
  weights: Tensor1D;
  sensitivityVector: Tensor1D;
  activation: number;
}

// ─────────────────────────────────────────────────────────────────────
// WebGL 神经引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * WebGL 神经引擎
 * 
 * 在浏览器中使用 WebGL 后端运行神经网络
 */
export class WebGLEngine {
  private config: WebGLEngineConfig;
  private tfModule: typeof import('@tensorflow/tfjs') | null = null;
  private initialized: boolean = false;
  private backend: string = 'cpu';
  
  // 神经元存储
  private neurons: Map<string, NeuronData> = new Map();
  
  // VSA 概念
  private concepts: Map<string, Tensor1D> = new Map();

  constructor(config: Partial<WebGLEngineConfig> = {}) {
    this.config = {
      vsaDimension: config.vsaDimension ?? 512,
      maxNeurons: config.maxNeurons ?? 100,
      learningRate: config.learningRate ?? 0.01,
      enablePrediction: config.enablePrediction ?? true,
      ...config,
    };
  }

  /**
   * 初始化引擎（必须在浏览器中调用）
   */
  async initialize(): Promise<WebGLEngineState> {
    if (typeof window === 'undefined') {
      throw new Error('WebGLEngine can only be initialized in browser environment');
    }

    try {
      // 动态导入 TensorFlow.js（浏览器版本）
      const tf = await import('@tensorflow/tfjs');
      this.tfModule = tf;
      
      // 尝试设置 WebGL 后端
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        this.backend = 'webgl';
        console.log('[WebGLEngine] WebGL backend initialized successfully');
      } catch (webglError) {
        // 回退到 CPU 或 WASM
        console.warn('[WebGLEngine] WebGL not available, trying WASM:', webglError);
        try {
          const wasm = await import('@tensorflow/tfjs-backend-wasm');
          await wasm.setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/wasm-out/');
          await tf.setBackend('wasm');
          await tf.ready();
          this.backend = 'wasm';
          console.log('[WebGLEngine] WASM backend initialized');
        } catch (wasmError) {
          // 最终回退到 CPU
          await tf.setBackend('cpu');
          await tf.ready();
          this.backend = 'cpu';
          console.log('[WebGLEngine] CPU backend initialized (fallback)');
        }
      }

      this.initialized = true;
      
      return this.getState();
    } catch (error) {
      console.error('[WebGLEngine] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 获取引擎状态
   */
  getState(): WebGLEngineState {
    return {
      initialized: this.initialized,
      backend: this.backend,
      gpuAvailable: this.backend === 'webgl',
      neuronCount: this.neurons.size,
      conceptCount: this.concepts.size,
    };
  }

  /**
   * 创建神经元
   */
  async createNeuron(
    label: string,
    role: NeuronRole = 'semantic'
  ): Promise<string> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const id = `neuron-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dim = this.config.vsaDimension;
    const scale = Math.sqrt(2 / dim);

    // 创建随机权重（使用 WebGL 张量）
    const weightsData = new Float32Array(dim);
    for (let i = 0; i < dim; i++) {
      weightsData[i] = (Math.random() * 2 - 1) * scale;
    }
    const weights = tf.tensor1d(weightsData) as Tensor1D;

    // 创建敏感度向量
    const sensitivityData = new Float32Array(dim);
    for (let i = 0; i < dim; i++) {
      sensitivityData[i] = (Math.random() * 2 - 1);
    }
    // 归一化
    const norm = Math.sqrt(sensitivityData.reduce((a, b) => a + b * b, 0));
    for (let i = 0; i < dim; i++) {
      sensitivityData[i] /= norm;
    }
    const sensitivityVector = tf.tensor1d(sensitivityData) as Tensor1D;

    this.neurons.set(id, {
      label,
      role,
      weights,
      sensitivityVector,
      activation: 0,
    });

    return id;
  }

  /**
   * 添加概念
   */
  async addConcept(name: string, vector?: number[]): Promise<void> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const dim = this.config.vsaDimension;
    let conceptVector: Tensor1D;

    if (vector && vector.length === dim) {
      conceptVector = tf.tensor1d(new Float32Array(vector)) as Tensor1D;
    } else {
      // 生成随机超向量
      const data = new Float32Array(dim);
      for (let i = 0; i < dim; i++) {
        data[i] = Math.random() > 0.5 ? 1 : -1;
      }
      conceptVector = tf.tensor1d(data) as Tensor1D;
    }

    this.concepts.set(name, conceptVector);
  }

  /**
   * 处理输入（GPU 加速）
   */
  async processInput(inputVector: number[]): Promise<NeuralProcessingResult> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const startTime = Date.now();
    const activations = new Map<string, number>();
    const predictionErrors = new Map<string, number>();
    const attention = new Map<string, number>();

    // 创建输入张量（在 GPU 上）
    const inputTensor = tf.tensor1d(new Float32Array(inputVector)) as Tensor1D;

    // 计算每个神经元的激活
    for (const [id, neuron] of this.neurons) {
      // 使用 GPU 计算点积
      const dot = inputTensor.dot(neuron.sensitivityVector);
      const dotValue = await dot.data();
      
      // Sigmoid 激活
      const activation = 1 / (1 + Math.exp(-dotValue[0]));
      
      activations.set(id, activation);
      predictionErrors.set(id, activation - neuron.activation);
      attention.set(id, activation);
      
      // 更新神经元激活
      neuron.activation = activation;
      
      // 释放临时张量
      dot.dispose();
    }

    // 计算注意力权重（softmax）
    const activationValues = Array.from(activations.values());
    const maxAct = Math.max(...activationValues);
    const expValues = activationValues.map(v => Math.exp(v - maxAct));
    const sumExp = expValues.reduce((a, b) => a + b, 0);
    const softmaxWeights = expValues.map(v => v / sumExp);

    let i = 0;
    for (const [id] of this.neurons) {
      attention.set(id, softmaxWeights[i++]);
    }

    // 清理输入张量
    inputTensor.dispose();

    return {
      activations,
      predictionErrors,
      surprises: [],
      attention,
      consciousContent: {
        winners: Array.from(activations.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => id),
        broadcastStrength: Math.max(...activationValues),
      },
      learningResult: {
        adjustedNeurons: Array.from(this.neurons.keys()),
        totalWeightChange: 0.01,
      },
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * VSA 绑定操作（GPU 加速）
   */
  async bind(conceptA: string, conceptB: string): Promise<number[]> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const vecA = this.concepts.get(conceptA);
    const vecB = this.concepts.get(conceptB);

    if (!vecA || !vecB) {
      throw new Error('Concept not found');
    }

    // 循环卷积（使用 FFT）
    // 简化实现：逐元素乘法（XOR 近似）
    const bound = tf.mul(vecA, vecB);
    const result = await bound.data();
    bound.dispose();

    return Array.from(result);
  }

  /**
   * VSA 捆绑操作（GPU 加速）
   */
  async bundle(...concepts: string[]): Promise<number[]> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const vectors = concepts
      .map(name => this.concepts.get(name))
      .filter((v): v is Tensor1D => v !== undefined);

    if (vectors.length === 0) {
      throw new Error('No valid concepts found');
    }

    // 逐元素相加
    let sum = vectors[0];
    for (let i = 1; i < vectors.length; i++) {
      sum = tf.add(sum, vectors[i]) as Tensor1D;
    }

    // 归一化：取符号
    const bundled = tf.sign(sum);
    const result = await bundled.data();
    
    if (vectors.length > 1) {
      bundled.dispose();
    }

    return Array.from(result);
  }

  /**
   * 相似度计算（GPU 加速）
   */
  async similarity(vecA: number[], vecB: number[]): Promise<number> {
    const tf = this.tfModule;
    if (!tf || !this.initialized) {
      throw new Error('Engine not initialized');
    }

    const tensorA = tf.tensor1d(new Float32Array(vecA)) as Tensor1D;
    const tensorB = tf.tensor1d(new Float32Array(vecB)) as Tensor1D;

    // 余弦相似度
    const dot = tensorA.dot(tensorB);
    const normA = tensorA.norm();
    const normB = tensorB.norm();
    
    const dotVal = await dot.data();
    const normAVal = await normA.data();
    const normBVal = await normB.data();

    const similarity = dotVal[0] / (normAVal[0] * normBVal[0] + 1e-8);

    tensorA.dispose();
    tensorB.dispose();
    dot.dispose();
    normA.dispose();
    normB.dispose();

    return similarity;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    for (const neuron of this.neurons.values()) {
      neuron.weights.dispose();
      neuron.sensitivityVector.dispose();
    }
    this.neurons.clear();

    for (const concept of this.concepts.values()) {
      concept.dispose();
    }
    this.concepts.clear();

    this.initialized = false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例管理
// ─────────────────────────────────────────────────────────────────────

let webglEngineInstance: WebGLEngine | null = null;

export function getWebGLEngine(config?: Partial<WebGLEngineConfig>): WebGLEngine {
  if (!webglEngineInstance) {
    webglEngineInstance = new WebGLEngine(config);
  }
  return webglEngineInstance;
}

export function resetWebGLEngine(): void {
  if (webglEngineInstance) {
    webglEngineInstance.dispose();
    webglEngineInstance = null;
  }
}
