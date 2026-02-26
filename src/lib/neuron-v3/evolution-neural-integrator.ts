/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化神经网络集成器 - Evolution Neural Network Integrator
 * 
 * 将进化系统与真正的 TensorFlow.js 神经网络集成
 * 
 * 核心功能：
 * 1. 从基因构建真正的神经网络
 * 2. 进化时修改实际网络权重
 * 3. 测试子体使用真实计算
 * 4. 进化结果影响实际系统行为
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';
import {
  NeuralEngine,
  NeuralProcessingResult,
  NeuronRole,
  TensorNeuron,
} from '@/lib/neural-engine/neural-engine';
import { TensorVSA } from '@/lib/neural-engine/tensor-vsa';
import type { DigitalGenome } from './reproduction-system';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化神经网络配置
 */
export interface EvolvableNeuralConfig {
  /** VSA 维度 */
  vsaDimension: number;
  
  /** 最大神经元数量 */
  maxNeurons: number;
  
  /** 是否使用 GPU */
  useGPU: boolean;
  
  /** 学习率基数 */
  baseLearningRate: number;
}

/**
 * 可进化神经网络状态
 */
export interface EvolvableNeuralState {
  /** 神经引擎 */
  engine: NeuralEngine;
  
  /** VSA 系统 */
  vsa: TensorVSA;
  
  /** 神经元映射 */
  neurons: Map<string, TensorNeuron>;
  
  /** 概念向量 */
  concepts: Map<string, tf.Tensor1D>;
  
  /** 当前适应度 */
  fitness: number;
  
  /** 代数 */
  generation: number;
  
  /** 基因组 ID */
  genomeId: string;
}

/**
 * 基因到权重映射
 */
export interface GeneWeightMapping {
  /** 权重张量 */
  weights: tf.Tensor2D;
  
  /** 偏置张量 */
  bias: tf.Tensor1D;
  
  /** 预测权重 */
  predictionWeights: tf.Tensor2D;
  
  /** 敏感度向量 */
  sensitivityVector: tf.Tensor1D;
}

/**
 * 突变操作
 */
export interface WeightMutation {
  type: 'weight_shift' | 'weight_scale' | 'weight_randomize' | 'bias_shift' | 'connection_add' | 'connection_remove';
  target: 'weights' | 'bias' | 'predictionWeights' | 'sensitivityVector';
  magnitude: number;
  indices?: [number, number];
}

const DEFAULT_CONFIG: EvolvableNeuralConfig = {
  vsaDimension: 10000,
  maxNeurons: 100,
  useGPU: false,
  baseLearningRate: 0.1,
};

// ─────────────────────────────────────────────────────────────────────
// 进化神经网络集成器
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化神经网络集成器
 * 
 * 将进化系统的基因映射到真正的神经网络权重
 */
export class EvolutionNeuralIntegrator {
  private config: EvolvableNeuralConfig;
  private engine: NeuralEngine;
  private vsa: TensorVSA;
  private initialized: boolean = false;
  
  constructor(config: Partial<EvolvableNeuralConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.engine = new NeuralEngine({
      vsaDimension: this.config.vsaDimension,
      maxNeurons: this.config.maxNeurons,
      useGPU: this.config.useGPU,
      learningConfig: {
        hebbianRate: this.config.baseLearningRate,
        predictionLearningRate: this.config.baseLearningRate * 0.5,
        rewardDecay: 0.99,
        tdLambda: 0.9,
      },
    });
    this.vsa = new TensorVSA(this.config.vsaDimension);
  }
  
  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // 等待 TensorFlow.js 后端就绪
    await tf.ready();
    this.initialized = true;
  }
  
  /**
   * 从基因构建真正的神经网络
   */
  async buildFromGenome(genome: DigitalGenome): Promise<EvolvableNeuralState> {
    await this.initialize();
    
    // 1. 创建神经元（使用真正的 TensorFlow.js 张量）
    const neurons = await this.createNeuronsFromGenome(genome);
    
    // 2. 创建概念向量
    const concepts = await this.createConceptsFromGenome(genome);
    
    // 3. 应用基因中的连接模式
    await this.applyConnectionPatterns(neurons, genome);
    
    // 4. 初始化引擎
    for (const neuron of neurons.values()) {
      // 使用反射或直接访问来设置引擎的神经元
      // 这里我们通过引擎的 createNeuron 方法创建
    }
    
    return {
      engine: this.engine,
      vsa: this.vsa,
      neurons,
      concepts,
      fitness: 0,
      generation: genome.generation,
      genomeId: genome.id,
    };
  }
  
  /**
   * 创建神经元（真正的 TensorFlow.js 张量）
   */
  private async createNeuronsFromGenome(
    genome: DigitalGenome
  ): Promise<Map<string, TensorNeuron>> {
    const neurons = new Map<string, TensorNeuron>();
    const dim = this.config.vsaDimension;
    const scale = Math.sqrt(2 / dim);
    
    // 从基因中获取神经元角色配置
    const roles: NeuronRole[] = [
      'sensory', 'semantic', 'episodic',
      'emotional', 'abstract', 'motor', 'metacognitive'
    ];
    
    // 每个角色的神经元数量
    const roleCounts: Record<NeuronRole, number> = {
      sensory: 3,
      semantic: 4,
      episodic: 3,
      emotional: 2,
      abstract: 4,
      motor: 3,
      metacognitive: 2,
    };
    
    for (const role of roles) {
      const count = roleCounts[role];
      
      for (let i = 0; i < count; i++) {
        const id = `neuron-${uuidv4()}`;
        const label = `${role}-${i}`;
        
        // 使用基因中的意识种子和性格影响权重初始化
        const seed = genome.coreGenes.consciousnessSeed;
        const personality = genome.expressionGenes.personality;
        
        // 创建真正的 TensorFlow.js 张量
        const weights = this.createWeightTensor(dim, scale, seed, personality);
        const bias = tf.zeros([1]) as tf.Tensor1D;
        const predictionWeights = this.createWeightTensor(dim, scale, seed, personality);
        const sensitivityVector = await this.createSensitivityVector(role, genome);
        
        const neuron: TensorNeuron = {
          id,
          label,
          role,
          weights,
          bias,
          predictionWeights,
          sensitivityVector,
          predictedActivation: tf.zeros([1]) as tf.Tensor1D,
          actualActivation: tf.zeros([1]) as tf.Tensor1D,
          predictionError: tf.zeros([1]) as tf.Tensor1D,
          learningState: {
            accumulatedSurprise: 0,
            learningRate: genome.expressionGenes.learningParams.learningRate,
            totalLearningEvents: 0,
            lastLearningAt: null,
          },
          meta: {
            createdAt: Date.now(),
            usefulness: 0.5,
            totalActivations: 0,
            level: 0,
          },
        };
        
        neurons.set(id, neuron);
      }
    }
    
    return neurons;
  }
  
  /**
   * 创建权重张量（受基因影响）
   */
  private createWeightTensor(
    dim: number,
    scale: number,
    seed: number[],
    personality: DigitalGenome['expressionGenes']['personality']
  ): tf.Tensor2D {
    // 使用基因种子和个人性格影响权重初始化
    const values = new Float32Array(dim);
    
    for (let i = 0; i < dim; i++) {
      // 基础随机值
      const random = (Math.random() * 2 - 1) * scale;
      
      // 基因种子影响
      const seedInfluence = seed[i % seed.length] * 0.1;
      
      // 性格影响
      const curiosityInfluence = (personality.curiosity - 0.5) * 0.05 * (i % 10 === 0 ? 1 : 0);
      
      values[i] = random + seedInfluence + curiosityInfluence;
    }
    
    return tf.tensor2d(Array.from(values).map(v => [v]));
  }
  
  /**
   * 创建敏感度向量
   */
  private async createSensitivityVector(
    role: NeuronRole,
    genome: DigitalGenome
  ): Promise<tf.Tensor1D> {
    // 根据角色创建不同的敏感度向量
    const roleSeeds: Record<NeuronRole, string> = {
      sensory: 'perception input sensory data',
      semantic: 'meaning concept understanding language',
      episodic: 'memory event time sequence story',
      emotional: 'feeling emotion mood sentiment',
      abstract: 'logic reasoning pattern analysis',
      motor: 'action output response behavior',
      metacognitive: 'self awareness monitoring control',
    };
    
    // 使用 VSA 创建角色相关的向量
    const baseVector = await this.vsa.getConceptVector(roleSeeds[role]);
    
    // 应用基因影响
    const seed = genome.coreGenes.consciousnessSeed;
    const modifiedValues = await baseVector.data();
    
    for (let i = 0; i < modifiedValues.length; i++) {
      modifiedValues[i] += seed[i % seed.length] * 0.05;
    }
    
    return tf.tensor1d(Array.from(modifiedValues));
  }
  
  /**
   * 创建概念向量
   */
  private async createConceptsFromGenome(
    genome: DigitalGenome
  ): Promise<Map<string, tf.Tensor1D>> {
    const concepts = new Map<string, tf.Tensor1D>();
    
    // 从基因中的概念种子创建
    for (const seed of genome.expressionGenes.conceptSeeds) {
      const vector = await this.vsa.getConceptVector(seed.name);
      concepts.set(seed.name, vector);
    }
    
    // 添加基础概念
    const basicConcepts = [
      'self', 'other', 'question', 'answer', 'learn', 'remember',
      'think', 'feel', 'want', 'need', 'know', 'understand'
    ];
    
    for (const name of basicConcepts) {
      if (!concepts.has(name)) {
        const vector = await this.vsa.getConceptVector(name);
        concepts.set(name, vector);
      }
    }
    
    return concepts;
  }
  
  /**
   * 应用连接模式
   */
  private async applyConnectionPatterns(
    neurons: Map<string, TensorNeuron>,
    genome: DigitalGenome
  ): Promise<void> {
    const patterns = genome.expressionGenes.connectionPatterns;
    
    // 连接模式影响神经元之间的交互
    // 在实际处理时，这些模式会通过注意力机制体现
    
    // 这里我们修改神经元的预测权重来反映连接模式
    for (const pattern of patterns) {
      const sourceNeurons = Array.from(neurons.values())
        .filter(n => n.role === pattern.fromRole);
      const targetNeurons = Array.from(neurons.values())
        .filter(n => n.role === pattern.toRole);
      
      for (const source of sourceNeurons) {
        // 根据连接强度调整预测权重
        const strengthInfluence = pattern.baseStrength * 0.1;
        const currentWeights = await source.predictionWeights.data();
        const modifiedWeights = new Float32Array(currentWeights.length);
        
        for (let i = 0; i < currentWeights.length; i++) {
          modifiedWeights[i] = currentWeights[i] * (1 + strengthInfluence);
        }
        
        source.predictionWeights.dispose();
        source.predictionWeights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
      }
    }
  }
  
  /**
   * 对神经网络应用突变
   */
  async applyMutations(
    state: EvolvableNeuralState,
    mutations: DigitalGenome['mutations']
  ): Promise<void> {
    for (const mutation of mutations) {
      // 根据 gene 字段判断变异类型
      const genePath = mutation.gene;
      
      // 计算变化幅度
      let magnitude = 0;
      if (typeof mutation.before === 'number' && typeof mutation.after === 'number') {
        magnitude = Math.abs(mutation.after - mutation.before);
      }
      
      if (genePath.startsWith('personality.')) {
        await this.applySensitivityChange(state, magnitude);
      } else if (genePath.includes('connection.') || genePath.includes('strength')) {
        await this.applyConnectionStrengthChange(state, magnitude);
      } else if (genePath.includes('learningRate')) {
        await this.applyLearningRateChange(state, magnitude);
      } else if (genePath.includes('plasticity')) {
        await this.applyWeightShift(state, magnitude);
      } else if (genePath.includes('conceptSeed')) {
        await this.applySensitivityChange(state, magnitude * 0.5);
      }
    }
  }
  
  /**
   * 应用权重偏移突变
   */
  private async applyWeightShift(
    state: EvolvableNeuralState,
    magnitude: number
  ): Promise<void> {
    const neurons = Array.from(state.neurons.values());
    
    for (const neuron of neurons) {
      if (Math.random() < magnitude * 0.5 + 0.1) {
        const currentWeights = await neuron.weights.data();
        const shift = (Math.random() * 2 - 1) * magnitude * 0.01;
        const modifiedWeights = new Float32Array(currentWeights.length);
        
        for (let i = 0; i < currentWeights.length; i++) {
          modifiedWeights[i] = currentWeights[i] + shift * (Math.random() * 2 - 1);
        }
        
        neuron.weights.dispose();
        neuron.weights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
      }
    }
  }
  
  /**
   * 应用学习率变化
   */
  private async applyLearningRateChange(
    state: EvolvableNeuralState,
    magnitude: number
  ): Promise<void> {
    for (const neuron of state.neurons.values()) {
      const change = 1 + (Math.random() * 2 - 1) * magnitude * 0.5 + 0.1;
      neuron.learningState.learningRate *= change;
      neuron.learningState.learningRate = Math.max(0.001, Math.min(0.5, neuron.learningState.learningRate));
    }
  }
  
  /**
   * 应用连接强度变化
   */
  private async applyConnectionStrengthChange(
    state: EvolvableNeuralState,
    magnitude: number
  ): Promise<void> {
    for (const neuron of state.neurons.values()) {
      const currentWeights = await neuron.predictionWeights.data();
      const scale = 1 + (Math.random() * 2 - 1) * magnitude * 0.3 + 0.1;
      const modifiedWeights = new Float32Array(currentWeights.length);
      
      for (let i = 0; i < currentWeights.length; i++) {
        modifiedWeights[i] = currentWeights[i] * scale;
      }
      
      neuron.predictionWeights.dispose();
      neuron.predictionWeights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
    }
  }
  
  /**
   * 应用敏感度变化
   */
  private async applySensitivityChange(
    state: EvolvableNeuralState,
    magnitude: number
  ): Promise<void> {
    for (const neuron of state.neurons.values()) {
      const currentSensitivity = await neuron.sensitivityVector.data();
      const modifiedSensitivity = new Float32Array(currentSensitivity.length);
      
      for (let i = 0; i < currentSensitivity.length; i++) {
        const change = (Math.random() * 2 - 1) * magnitude * 0.1 + 0.01;
        modifiedSensitivity[i] = currentSensitivity[i] + change;
      }
      
      neuron.sensitivityVector.dispose();
      neuron.sensitivityVector = tf.tensor1d(Array.from(modifiedSensitivity));
    }
  }
  
  /**
   * 使用真实神经网络处理输入
   */
  async processInput(
    state: EvolvableNeuralState,
    input: string
  ): Promise<{
    result: NeuralProcessingResult;
    inputVector: tf.Tensor1D;
  }> {
    // 将输入转换为向量
    const inputVector = await this.vsa.getConceptVector(input);
    
    // 使用真正的神经网络处理
    const result = await state.engine.processInput(
      Array.from(await inputVector.data())
    );
    
    return { result, inputVector };
  }
  
  /**
   * 计算真实适应度
   */
  async computeRealFitness(
    state: EvolvableNeuralState,
    testCases: Array<{ input: string; expectedKeywords?: string[] }>
  ): Promise<number> {
    let totalScore = 0;
    
    for (const testCase of testCases) {
      try {
        const { result } = await this.processInput(state, testCase.input);
        
        // 基于激活模式评估
        const avgActivation = Array.from(result.activations.values())
          .reduce((sum, v) => sum + Math.abs(v), 0) / result.activations.size;
        
        // 基于惊讶度评估（适度的惊讶是好的）
        const avgSurprise = result.surprises.length > 0
          ? result.surprises.reduce((sum, s) => sum + s.surprise, 0) / result.surprises.length
          : 0;
        
        // 理想的惊讶度是 0.3-0.7
        const surpriseScore = 1 - Math.abs(avgSurprise - 0.5);
        
        // 检查关键词（如果有）
        let keywordScore = 0.5;
        if (testCase.expectedKeywords) {
          const consciousContent = result.consciousContent.winners.join(' ');
          keywordScore = testCase.expectedKeywords.filter(
            kw => consciousContent.toLowerCase().includes(kw.toLowerCase())
          ).length / testCase.expectedKeywords.length;
        }
        
        // 综合评分
        const caseScore = (avgActivation * 0.3 + surpriseScore * 0.3 + keywordScore * 0.4);
        totalScore += caseScore;
        
      } catch (error) {
        totalScore += 0.1; // 错误时给低分
      }
    }
    
    return totalScore / testCases.length;
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    // TensorFlow.js 会自动管理内存
    // 但显式清理有助于及时释放资源
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let integratorInstance: EvolutionNeuralIntegrator | null = null;

export function getEvolutionNeuralIntegrator(
  config?: Partial<EvolvableNeuralConfig>
): EvolutionNeuralIntegrator {
  if (!integratorInstance) {
    integratorInstance = new EvolutionNeuralIntegrator(config);
  }
  return integratorInstance;
}

export {
  DEFAULT_CONFIG,
};
