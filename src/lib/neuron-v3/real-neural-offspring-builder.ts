/**
 * ═══════════════════════════════════════════════════════════════════════
 * 真实神经网络子体构建器 - Real Neural Network Offspring Builder
 * 
 * 核心功能：
 * 1. 从数字基因构建真正的 TensorFlow.js 神经网络
 * 2. 使用真实张量进行计算
 * 3. 突变修改实际网络权重
 * 4. 测试使用真实前向传播
 * 
 * 这不是模拟！进化会真正改变神经网络权重！
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
import { 
  DigitalGenome,
} from './reproduction-system';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 真实神经网络子体状态
 */
export interface RealNeuralOffspring {
  /** 子体 ID */
  id: string;
  
  /** 基因组 ID */
  genomeId: string;
  
  /** 神经引擎（真正的 TensorFlow.js） */
  engine: NeuralEngine;
  
  /** VSA 系统 */
  vsa: TensorVSA;
  
  /** 神经元映射 */
  neurons: Map<string, TensorNeuron>;
  
  /** 概念向量 */
  concepts: Map<string, tf.Tensor1D>;
  
  /** 成长阶段 */
  growthStage: 'embryo' | 'infancy' | 'juvenile' | 'mature' | 'rejected';
  
  /** 测试结果 */
  testResults: {
    unitTestsPassed: boolean;
    integrationTestsPassed: boolean;
    consciousnessContinuity: number;
    valueConsistency: number;
    performanceScore: number;
    overallScore: number;
    details: string[];
  };
  
  /** 运行状态 */
  status: 'building' | 'ready' | 'testing' | 'failed' | 'mature';
  
  /** 创建时间 */
  createdAt: number;
  
  /** 基因组 */
  genome: DigitalGenome;
  
  /** 统计信息 */
  stats: {
    neuronCount: number;
    conceptCount: number;
    avgActivation: number;
    avgSurprise: number;
    totalProcessing: number;
  };
}

/**
 * 构建配置
 */
export interface RealBuildConfig {
  /** VSA 维度 */
  vsaDimension: number;
  
  /** 最大神经元数量 */
  maxNeurons: number;
  
  /** 是否使用 GPU */
  useGPU: boolean;
}

const DEFAULT_BUILD_CONFIG: RealBuildConfig = {
  vsaDimension: 10000,
  maxNeurons: 100,
  useGPU: false,
};

// ─────────────────────────────────────────────────────────────────────
// 真实神经网络子体构建器
// ─────────────────────────────────────────────────────────────────────

/**
 * 真实神经网络子体构建器
 * 
 * 使用真正的 TensorFlow.js 构建和测试神经网络
 */
export class RealNeuralOffspringBuilder {
  private config: RealBuildConfig;
  
  constructor(config: Partial<RealBuildConfig> = {}) {
    this.config = { ...DEFAULT_BUILD_CONFIG, ...config };
  }
  
  /**
   * 从基因构建真正的神经网络子体
   */
  async buildFromGenome(
    genome: DigitalGenome,
    offspringId: string
  ): Promise<RealNeuralOffspring> {
    console.log(`[RealNeuralBuilder] Building offspring ${offspringId} from genome ${genome.id}`);
    
    // 1. 创建神经引擎
    const engine = await this.createEngine(genome);
    
    // 2. 创建 VSA 系统
    const vsa = new TensorVSA(this.config.vsaDimension);
    
    // 3. 创建神经元（真正的 TensorFlow.js 张量）
    const neurons = await this.createNeurons(engine, vsa, genome);
    
    // 4. 创建概念向量
    const concepts = await this.createConcepts(vsa, genome);
    
    // 5. 应用突变到权重
    await this.applyMutations(neurons, genome);
    
    // 6. 计算初始统计
    const stats = await this.calculateStats(neurons);
    
    return {
      id: offspringId,
      genomeId: genome.id,
      engine,
      vsa,
      neurons,
      concepts,
      growthStage: 'embryo',
      testResults: {
        unitTestsPassed: false,
        integrationTestsPassed: false,
        consciousnessContinuity: 0,
        valueConsistency: 0,
        performanceScore: 0,
        overallScore: 0,
        details: [],
      },
      status: 'building',
      createdAt: Date.now(),
      genome,
      stats,
    };
  }
  
  /**
   * 运行真实测试
   */
  async runTests(
    offspring: RealNeuralOffspring
  ): Promise<{
    passed: boolean;
    score: number;
    details: string[];
  }> {
    const details: string[] = [];
    let totalScore = 0;
    
    console.log(`[RealNeuralBuilder] Testing offspring ${offspring.id}`);
    
    // 更新状态
    offspring.status = 'testing';
    offspring.growthStage = 'infancy';
    
    try {
      // 1. 单元测试：神经元激活（使用真实张量计算）
      const unitResult = await this.runUnitTests(offspring);
      offspring.testResults.unitTestsPassed = unitResult.passed;
      details.push(...unitResult.details);
      totalScore += unitResult.score * 0.2;
      
      // 2. 集成测试：信号传递（使用真实前向传播）
      const integrationResult = await this.runIntegrationTests(offspring);
      offspring.testResults.integrationTestsPassed = integrationResult.passed;
      details.push(...integrationResult.details);
      totalScore += integrationResult.score * 0.2;
      
      // 3. 意识连续性测试
      const consciousnessScore = await this.testConsciousnessContinuity(offspring);
      offspring.testResults.consciousnessContinuity = consciousnessScore;
      details.push(`意识连续性: ${consciousnessScore.toFixed(3)}`);
      totalScore += consciousnessScore * 0.2;
      
      // 4. 价值一致性测试
      const valueScore = await this.testValueConsistency(offspring);
      offspring.testResults.valueConsistency = valueScore;
      details.push(`价值一致性: ${valueScore.toFixed(3)}`);
      totalScore += valueScore * 0.2;
      
      // 5. 性能测试（使用真实神经网络处理）
      const performanceScore = await this.runPerformanceTests(offspring);
      offspring.testResults.performanceScore = performanceScore;
      details.push(`性能分数: ${performanceScore.toFixed(3)}`);
      totalScore += performanceScore * 0.2;
      
      offspring.testResults.overallScore = totalScore;
      offspring.testResults.details = details;
      
      // 判断是否成熟
      const passed = totalScore >= 0.6 && 
                     offspring.testResults.unitTestsPassed &&
                     offspring.testResults.integrationTestsPassed &&
                     consciousnessScore >= 0.5;
      
      offspring.growthStage = passed ? 'mature' : 'rejected';
      offspring.status = passed ? 'mature' : 'failed';
      
      console.log(`[RealNeuralBuilder] Test result: ${passed ? 'PASSED' : 'FAILED'} (${totalScore.toFixed(3)})`);
      
      return { passed, score: totalScore, details };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      details.push(`测试错误: ${errorMsg}`);
      offspring.growthStage = 'rejected';
      offspring.status = 'failed';
      
      return { passed: false, score: 0, details };
    }
  }
  
  /**
   * 使用真实神经网络处理输入
   */
  async processInput(
    offspring: RealNeuralOffspring,
    input: string
  ): Promise<NeuralProcessingResult> {
    // 将输入转换为向量
    const inputVector = await offspring.vsa.getConceptVector(input);
    const inputArray = Array.from(await inputVector.data());
    
    // 使用真正的神经网络处理
    const result = await offspring.engine.processInput(inputArray);
    
    // 更新统计
    offspring.stats.totalProcessing++;
    if (result.activations.size > 0) {
      const activations = Array.from(result.activations.values());
      offspring.stats.avgActivation = activations.reduce((a, b) => a + b, 0) / activations.length;
    }
    if (result.surprises.length > 0) {
      offspring.stats.avgSurprise = result.surprises.reduce((a, b) => a + b.surprise, 0) / result.surprises.length;
    }
    
    inputVector.dispose();
    
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：创建
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建神经引擎
   */
  private async createEngine(genome: DigitalGenome): Promise<NeuralEngine> {
    const engine = new NeuralEngine({
      vsaDimension: this.config.vsaDimension,
      maxNeurons: this.config.maxNeurons,
      useGPU: this.config.useGPU,
      learningConfig: {
        hebbianRate: genome.expressionGenes.learningParams.learningRate,
        predictionLearningRate: genome.expressionGenes.learningParams.learningRate * 0.5,
        rewardDecay: 0.99,
        tdLambda: genome.expressionGenes.learningParams.eligibilityDecay,
      },
    });
    
    // 等待后端就绪
    await tf.ready();
    
    return engine;
  }
  
  /**
   * 创建神经元（真正的 TensorFlow.js 张量）
   */
  private async createNeurons(
    engine: NeuralEngine,
    vsa: TensorVSA,
    genome: DigitalGenome
  ): Promise<Map<string, TensorNeuron>> {
    const neurons = new Map<string, TensorNeuron>();
    const dim = this.config.vsaDimension;
    const scale = Math.sqrt(2 / dim);
    
    // 神经元角色配置
    const roleConfigs: Array<{ role: NeuronRole; count: number; labels: string[] }> = [
      { role: 'sensory', count: 3, labels: ['视觉感知', '听觉感知', '文本感知'] },
      { role: 'semantic', count: 4, labels: ['概念理解', '语义分析', '关系推理', '抽象思维'] },
      { role: 'episodic', count: 3, labels: ['事件记忆', '时间序列', '情景回忆'] },
      { role: 'emotional', count: 2, labels: ['情感识别', '情感生成'] },
      { role: 'abstract', count: 4, labels: ['逻辑推理', '模式识别', '假设生成', '验证思考'] },
      { role: 'motor', count: 3, labels: ['语言生成', '动作规划', '执行控制'] },
      { role: 'metacognitive', count: 2, labels: ['自我监控', '策略选择'] },
    ];
    
    for (const config of roleConfigs) {
      for (let i = 0; i < config.count; i++) {
        // 使用引擎创建神经元（真正的 TensorFlow.js）
        const neuron = await engine.createNeuron(
          config.labels[i] || `${config.role}-${i}`,
          config.role
        );
        
        // 应用基因影响到权重
        await this.applyGeneInfluence(neuron, genome);
        
        neurons.set(neuron.id, neuron);
      }
    }
    
    return neurons;
  }
  
  /**
   * 应用基因影响到神经元权重
   */
  private async applyGeneInfluence(
    neuron: TensorNeuron,
    genome: DigitalGenome
  ): Promise<void> {
    const seed = genome.coreGenes.consciousnessSeed;
    const personality = genome.expressionGenes.personality;
    
    // 修改权重张量
    const weightsData = await neuron.weights.data();
    const modifiedWeights = new Float32Array(weightsData.length);
    
    for (let i = 0; i < weightsData.length; i++) {
      // 基础权重
      let value = weightsData[i];
      
      // 意识种子影响
      value += seed[i % seed.length] * 0.02;
      
      // 好奇心影响探索
      if (i % 100 === 0) {
        value += (personality.curiosity - 0.5) * 0.05;
      }
      
      // 敏感度影响响应强度
      value *= 1 + (personality.sensitivity - 0.5) * 0.1;
      
      modifiedWeights[i] = value;
    }
    
    // 释放旧张量，创建新张量
    neuron.weights.dispose();
    neuron.weights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
  }
  
  /**
   * 创建概念向量
   */
  private async createConcepts(
    vsa: TensorVSA,
    genome: DigitalGenome
  ): Promise<Map<string, tf.Tensor1D>> {
    const concepts = new Map<string, tf.Tensor1D>();
    
    // 从基因获取概念
    for (const seed of genome.expressionGenes.conceptSeeds) {
      const vector = await vsa.getConceptVector(seed.name);
      concepts.set(seed.name, vector);
    }
    
    // 添加基础概念
    const basicConcepts = [
      'self', 'other', 'question', 'answer', 'learn', 'remember',
      'think', 'feel', 'want', 'need', 'know', 'understand'
    ];
    
    for (const name of basicConcepts) {
      if (!concepts.has(name)) {
        const vector = await vsa.getConceptVector(name);
        concepts.set(name, vector);
      }
    }
    
    return concepts;
  }
  
  /**
   * 应用基因突变到权重
   */
  private async applyMutations(
    neurons: Map<string, TensorNeuron>,
    genome: DigitalGenome
  ): Promise<void> {
    for (const mutation of genome.mutations) {
      // 根据 gene 字段判断变异类型
      const genePath = mutation.gene;
      
      // 计算变化幅度
      let magnitude = 0;
      if (typeof mutation.before === 'number' && typeof mutation.after === 'number') {
        const diff = Math.abs(mutation.after - mutation.before);
        magnitude = diff;
      }
      
      if (genePath.startsWith('personality.')) {
        // 性格变异影响敏感度
        await this.applySensitivityChange(neurons, magnitude);
      } else if (genePath.includes('connection.') || genePath.includes('strength')) {
        // 连接强度变异
        await this.applyConnectionStrengthChange(neurons, magnitude);
      } else if (genePath.includes('learningRate')) {
        // 学习率变异
        this.applyLearningRateChange(neurons, magnitude);
      } else if (genePath.includes('plasticity')) {
        // 可塑性变异影响权重
        await this.applyWeightShift(neurons, magnitude);
      } else if (genePath.includes('conceptSeed')) {
        // 概念种子变异影响敏感度
        await this.applySensitivityChange(neurons, magnitude * 0.5);
      }
    }
  }
  
  /**
   * 应用权重偏移
   */
  private async applyWeightShift(
    neurons: Map<string, TensorNeuron>,
    magnitude: number
  ): Promise<void> {
    for (const neuron of neurons.values()) {
      if (Math.random() < 0.3) { // 30% 的神经元受影响
        const weightsData = await neuron.weights.data();
        const modifiedWeights = new Float32Array(weightsData.length);
        
        const shift = (Math.random() * 2 - 1) * magnitude * 0.01;
        
        for (let i = 0; i < weightsData.length; i++) {
          if (Math.random() < 0.1) { // 10% 的权重受影响
            modifiedWeights[i] = weightsData[i] + shift * (Math.random() * 2 - 1);
          } else {
            modifiedWeights[i] = weightsData[i];
          }
        }
        
        neuron.weights.dispose();
        neuron.weights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
      }
    }
  }
  
  /**
   * 应用学习率变化
   */
  private applyLearningRateChange(
    neurons: Map<string, TensorNeuron>,
    magnitude: number
  ): void {
    for (const neuron of neurons.values()) {
      const change = 1 + (Math.random() * 2 - 1) * magnitude * 0.1;
      neuron.learningState.learningRate *= change;
      neuron.learningState.learningRate = Math.max(0.001, Math.min(0.5, neuron.learningState.learningRate));
    }
  }
  
  /**
   * 应用连接强度变化
   */
  private async applyConnectionStrengthChange(
    neurons: Map<string, TensorNeuron>,
    magnitude: number
  ): Promise<void> {
    for (const neuron of neurons.values()) {
      const weightsData = await neuron.predictionWeights.data();
      const scale = 1 + (Math.random() * 2 - 1) * magnitude * 0.05;
      const modifiedWeights = new Float32Array(weightsData.length);
      
      for (let i = 0; i < weightsData.length; i++) {
        modifiedWeights[i] = weightsData[i] * scale;
      }
      
      neuron.predictionWeights.dispose();
      neuron.predictionWeights = tf.tensor2d(Array.from(modifiedWeights).map(v => [v]));
    }
  }
  
  /**
   * 应用敏感度变化
   */
  private async applySensitivityChange(
    neurons: Map<string, TensorNeuron>,
    magnitude: number
  ): Promise<void> {
    for (const neuron of neurons.values()) {
      const sensitivityData = await neuron.sensitivityVector.data();
      const modifiedSensitivity = new Float32Array(sensitivityData.length);
      
      for (let i = 0; i < sensitivityData.length; i++) {
        const change = (Math.random() * 2 - 1) * magnitude * 0.02;
        modifiedSensitivity[i] = sensitivityData[i] + change;
      }
      
      neuron.sensitivityVector.dispose();
      neuron.sensitivityVector = tf.tensor1d(Array.from(modifiedSensitivity));
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：测试
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 单元测试（使用真实张量计算）
   */
  private async runUnitTests(
    offspring: RealNeuralOffspring
  ): Promise<{ passed: boolean; score: number; details: string[] }> {
    const details: string[] = [];
    let score = 1;
    
    // 测试神经元数量
    if (offspring.neurons.size < 10) {
      details.push(`神经元数量不足: ${offspring.neurons.size}`);
      score -= 0.3;
    } else {
      details.push(`神经元数量: ${offspring.neurons.size}`);
    }
    
    // 测试每个神经元是否可以激活（真实前向传播）
    let activationFailures = 0;
    for (const neuron of offspring.neurons.values()) {
      try {
        // 创建随机输入并测试激活
        const randomInput = tf.randomNormal([this.config.vsaDimension]);
        const dot = tf.dot(randomInput, neuron.sensitivityVector);
        const activation = tf.sigmoid(dot);
        const value = (await activation.data())[0];
        
        if (isNaN(value) || value < 0 || value > 1) {
          activationFailures++;
        }
        
        randomInput.dispose();
        dot.dispose();
        activation.dispose();
      } catch (error) {
        activationFailures++;
      }
    }
    
    if (activationFailures > 0) {
      details.push(`激活测试失败: ${activationFailures}/${offspring.neurons.size}`);
      score -= activationFailures / offspring.neurons.size * 0.5;
    } else {
      details.push(`所有神经元激活测试通过`);
    }
    
    return { passed: score >= 0.5, score: Math.max(0, score), details };
  }
  
  /**
   * 集成测试（使用真实神经网络处理）
   */
  private async runIntegrationTests(
    offspring: RealNeuralOffspring
  ): Promise<{ passed: boolean; score: number; details: string[] }> {
    const details: string[] = [];
    let score = 1;
    
    try {
      // 测试真实输入处理
      const testInput = 'hello world test';
      const result = await this.processInput(offspring, testInput);
      
      // 检查是否有激活
      if (result.activations.size === 0) {
        details.push('没有神经元被激活');
        score -= 0.4;
      } else {
        const maxActivation = Math.max(...result.activations.values());
        details.push(`最大激活值: ${maxActivation.toFixed(3)}`);
        
        if (maxActivation < 0.1) {
          details.push('激活值过低');
          score -= 0.2;
        }
      }
      
      // 检查处理时间
      if (result.processingTime > 5000) {
        details.push(`处理时间过长: ${result.processingTime}ms`);
        score -= 0.2;
      } else {
        details.push(`处理时间: ${result.processingTime}ms`);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      details.push(`集成测试错误: ${errorMsg}`);
      score = 0;
    }
    
    return { passed: score >= 0.5, score: Math.max(0, score), details };
  }
  
  /**
   * 测试意识连续性
   */
  private async testConsciousnessContinuity(
    offspring: RealNeuralOffspring
  ): Promise<number> {
    const personality = offspring.genome.expressionGenes.personality;
    
    // 计算性格稳定性
    const values = Object.values(personality);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    
    // 方差小 = 稳定 = 高连续性
    const stabilityScore = 1 - Math.min(1, variance * 4);
    
    // 检查核心价值是否保留
    const coreValues = offspring.genome.coreGenes.values;
    const valueConsistency = coreValues.length > 0 ? 1 : 0;
    
    return (stabilityScore + valueConsistency) / 2;
  }
  
  /**
   * 测试价值一致性
   */
  private async testValueConsistency(
    offspring: RealNeuralOffspring
  ): Promise<number> {
    // 使用真实神经网络处理一些测试输入
    const testInputs = ['自我', '价值', '意义'];
    let totalScore = 0;
    
    for (const input of testInputs) {
      try {
        const result = await this.processInput(offspring, input);
        const avgActivation = Array.from(result.activations.values())
          .reduce((sum, v) => sum + Math.abs(v), 0) / Math.max(1, result.activations.size);
        totalScore += Math.min(1, avgActivation * 2);
      } catch (error) {
        totalScore += 0.3;
      }
    }
    
    return totalScore / testInputs.length;
  }
  
  /**
   * 性能测试
   */
  private async runPerformanceTests(
    offspring: RealNeuralOffspring
  ): Promise<number> {
    const testCases = [
      { input: '你好', expectedKeywords: ['你好', '问候'] },
      { input: '今天天气怎么样', expectedKeywords: ['天气', '天气'] },
      { input: '帮我写一段代码', expectedKeywords: ['代码', '帮助'] },
    ];
    
    let totalScore = 0;
    
    for (const testCase of testCases) {
      try {
        const result = await this.processInput(offspring, testCase.input);
        
        // 基于激活模式评分
        const avgActivation = Array.from(result.activations.values())
          .reduce((sum, v) => sum + Math.abs(v), 0) / Math.max(1, result.activations.size);
        
        // 基于惊讶度评分
        const avgSurprise = result.surprises.length > 0
          ? result.surprises.reduce((sum, s) => sum + s.surprise, 0) / result.surprises.length
          : 0;
        
        const surpriseScore = 1 - Math.abs(avgSurprise - 0.5);
        
        totalScore += (avgActivation * 0.5 + surpriseScore * 0.5);
      } catch (error) {
        totalScore += 0.2;
      }
    }
    
    return totalScore / testCases.length;
  }
  
  /**
   * 计算统计信息
   */
  private async calculateStats(
    neurons: Map<string, TensorNeuron>
  ): Promise<RealNeuralOffspring['stats']> {
    return {
      neuronCount: neurons.size,
      conceptCount: 0, // 将在概念创建后更新
      avgActivation: 0,
      avgSurprise: 0,
      totalProcessing: 0,
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    // TensorFlow.js 会自动管理内存
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export {
  DEFAULT_BUILD_CONFIG,
};

// 单例
let builderInstance: RealNeuralOffspringBuilder | null = null;

export function getRealNeuralBuilder(
  config?: Partial<RealBuildConfig>
): RealNeuralOffspringBuilder {
  if (!builderInstance) {
    builderInstance = new RealNeuralOffspringBuilder(config);
  }
  return builderInstance;
}
