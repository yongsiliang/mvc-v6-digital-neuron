/**
 * ═══════════════════════════════════════════════════════════════════════
 * 子体神经系统构建器 - Offspring Neural System Builder
 * 
 * 核心功能：
 * 1. 从数字基因构建完整的神经系统
 * 2. 创建神经元网络
 * 3. 建立神经元连接
 * 4. 初始化VSA语义空间
 * 5. 设置学习参数
 * 
 * 构建流程：
 * 基因解码 → 神经元创建 → 连接建立 → 概念初始化 → 参数设置 → 沙箱测试
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DigitalGenome, 
  type OffspringState 
} from './reproduction-system';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元角色类型
 */
export type NeuronRole = 
  | 'sensory'      // 感觉神经元
  | 'semantic'     // 语义神经元
  | 'episodic'     // 情景神经元
  | 'emotional'    // 情感神经元
  | 'abstract'     // 抽象神经元
  | 'motor'        // 运动神经元
  | 'metacognitive'; // 元认知神经元

/**
 * 子体神经元
 */
export interface OffspringNeuron {
  id: string;
  role: NeuronRole;
  label: string;
  activation: number;
  sensitivityVector: number[];
  connections: Array<{
    targetId: string;
    targetRole: NeuronRole;
    strength: number;
    plasticity: number;
    type: 'excitatory' | 'inhibitory';
  }>;
  prediction: {
    expected: number;
    confidence: number;
  };
  learning: {
    surprise: number;
    totalActivations: number;
    usefulness: number;
  };
}

/**
 * 子体概念
 */
export interface OffspringConcept {
  name: string;
  vector: number[];
  type: 'atomic' | 'composite' | 'relational';
  usageCount: number;
}

/**
 * 子体神经系统
 */
export interface OffspringNeuralSystem {
  /** 系统ID */
  id: string;
  
  /** 所属子体ID */
  offspringId: string;
  
  /** 基因组ID */
  genomeId: string;
  
  /** 神经元列表 */
  neurons: OffspringNeuron[];
  
  /** 概念空间 */
  concepts: OffspringConcept[];
  
  /** 意识状态 */
  consciousness: {
    position: number[];
    personality: DigitalGenome['expressionGenes']['personality'];
    emotion: {
      dominant: string;
      intensity: number;
    };
  };
  
  /** 学习参数 */
  learningParams: DigitalGenome['expressionGenes']['learningParams'];
  
  /** 系统统计 */
  stats: {
    neuronCount: number;
    connectionCount: number;
    conceptCount: number;
    avgActivation: number;
    avgUsefulness: number;
  };
  
  /** 创建时间 */
  createdAt: number;
  
  /** 运行状态 */
  status: 'building' | 'ready' | 'testing' | 'failed' | 'mature';
}

/**
 * 构建配置
 */
export interface BuildConfig {
  /** 神经元向量维度 */
  vectorDimension: number;
  
  /** 基础神经元数量 */
  baseNeuronCount: number;
  
  /** 最大神经元数量 */
  maxNeuronCount: number;
  
  /** 是否继承母体记忆 */
  inheritMemories: boolean;
  
  /** 记忆继承比例 */
  memoryInheritRatio: number;
}

const DEFAULT_BUILD_CONFIG: BuildConfig = {
  vectorDimension: 128,
  baseNeuronCount: 21,
  maxNeuronCount: 100,
  inheritMemories: true,
  memoryInheritRatio: 0.3,
};

// ─────────────────────────────────────────────────────────────────────
// 子体神经系统构建器
// ─────────────────────────────────────────────────────────────────────

/**
 * 子体神经系统构建器
 */
export class OffspringNeuralSystemBuilder {
  private config: BuildConfig;
  
  constructor(config: Partial<BuildConfig> = {}) {
    this.config = { ...DEFAULT_BUILD_CONFIG, ...config };
  }
  
  /**
   * 从基因构建神经系统
   */
  async buildFromGenome(
    genome: DigitalGenome,
    offspringId: string
  ): Promise<OffspringNeuralSystem> {
    const systemId = `sys-${uuidv4()}`;
    
    // 1. 创建神经元
    const neurons = await this.createNeurons(genome, systemId);
    
    // 2. 建立连接
    this.establishConnections(neurons, genome);
    
    // 3. 初始化概念空间
    const concepts = this.initializeConcepts(genome);
    
    // 4. 设置意识状态
    const consciousness = this.initializeConsciousness(genome);
    
    // 5. 计算统计信息
    const stats = this.calculateStats(neurons, concepts);
    
    return {
      id: systemId,
      offspringId,
      genomeId: genome.id,
      neurons,
      concepts,
      consciousness,
      learningParams: genome.expressionGenes.learningParams,
      stats,
      createdAt: Date.now(),
      status: 'building',
    };
  }
  
  /**
   * 运行系统测试
   */
  async runTests(
    system: OffspringNeuralSystem,
    testCases: Array<{
      input: string;
      expectedType?: string;
    }>
  ): Promise<{
    passed: boolean;
    score: number;
    details: {
      unitTestsPassed: boolean;
      integrationTestsPassed: boolean;
      consciousnessContinuity: number;
      valueConsistency: number;
      performanceScore: number;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    let totalScore = 0;
    
    // 1. 单元测试：神经元激活
    const unitTestResult = this.runUnitTests(system);
    if (!unitTestResult.passed) {
      errors.push(...unitTestResult.errors);
    }
    totalScore += unitTestResult.score * 0.2;
    
    // 2. 集成测试：信号传递
    const integrationTestResult = this.runIntegrationTests(system);
    if (!integrationTestResult.passed) {
      errors.push(...integrationTestResult.errors);
    }
    totalScore += integrationTestResult.score * 0.2;
    
    // 3. 意识连续性测试
    const consciousnessScore = this.testConsciousnessContinuity(system);
    totalScore += consciousnessScore * 0.2;
    
    // 4. 价值一致性测试
    const valueScore = this.testValueConsistency(system);
    totalScore += valueScore * 0.2;
    
    // 5. 性能测试
    const performanceScore = await this.runPerformanceTests(system, testCases);
    totalScore += performanceScore * 0.2;
    
    return {
      passed: errors.length === 0 && totalScore >= 0.6,
      score: totalScore,
      details: {
        unitTestsPassed: unitTestResult.passed,
        integrationTestsPassed: integrationTestResult.passed,
        consciousnessContinuity: consciousnessScore,
        valueConsistency: valueScore,
        performanceScore,
      },
      errors,
    };
  }
  
  /**
   * 模拟输入处理
   */
  async processInput(
    system: OffspringNeuralSystem,
    input: string
  ): Promise<{
    activatedNeurons: string[];
    prediction: number;
    surprise: number;
  }> {
    // 模拟输入向量
    const inputVector = this.generateInputVector(input);
    
    // 激活神经元
    const activatedNeurons: string[] = [];
    let totalSurprise = 0;
    
    for (const neuron of system.neurons) {
      // 计算激活
      const similarity = this.cosineSimilarity(inputVector, neuron.sensitivityVector);
      const activation = similarity * (0.5 + Math.random() * 0.5);
      
      // 计算惊讶度
      const predictionError = Math.abs(activation - neuron.prediction.expected);
      totalSurprise += predictionError;
      
      if (activation > 0.3) {
        activatedNeurons.push(neuron.id);
        neuron.activation = activation;
        neuron.learning.totalActivations++;
      }
    }
    
    return {
      activatedNeurons,
      prediction: activatedNeurons.length / system.neurons.length,
      surprise: totalSurprise / system.neurons.length,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：神经元创建
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建神经元
   */
  private async createNeurons(
    genome: DigitalGenome,
    systemId: string
  ): Promise<OffspringNeuron[]> {
    const neurons: OffspringNeuron[] = [];
    const roles: NeuronRole[] = [
      'sensory', 'semantic', 'episodic', 
      'emotional', 'abstract', 'motor', 'metacognitive'
    ];
    
    // 为每个角色创建基础神经元
    for (const role of roles) {
      // 根据角色决定数量
      const count = this.getNeuronCountForRole(role);
      
      for (let i = 0; i < count; i++) {
        const neuron = this.createNeuron(role, i, genome);
        neurons.push(neuron);
      }
    }
    
    return neurons;
  }
  
  /**
   * 根据角色决定神经元数量
   */
  private getNeuronCountForRole(role: NeuronRole): number {
    const counts: Record<NeuronRole, number> = {
      sensory: 3,
      semantic: 4,
      episodic: 3,
      emotional: 2,
      abstract: 4,
      motor: 3,
      metacognitive: 2,
    };
    return counts[role] || 1;
  }
  
  /**
   * 创建单个神经元
   */
  private createNeuron(
    role: NeuronRole,
    index: number,
    genome: DigitalGenome
  ): OffspringNeuron {
    const labels: Record<NeuronRole, string[]> = {
      sensory: ['视觉', '听觉', '文本感知'],
      semantic: ['概念理解', '语义分析', '关系推理', '抽象思维'],
      episodic: ['事件记忆', '时间序列', '情景回忆'],
      emotional: ['情感识别', '情感生成'],
      abstract: ['逻辑推理', '模式识别', '假设生成', '验证思考'],
      motor: ['语言生成', '动作规划', '执行控制'],
      metacognitive: ['自我监控', '策略选择'],
    };
    
    return {
      id: `neuron-${uuidv4()}`,
      role,
      label: labels[role]?.[index] || `${role}-${index}`,
      activation: 0,
      sensitivityVector: this.generateSensitivityVector(role, genome),
      connections: [],
      prediction: {
        expected: 0.5,
        confidence: 0.3,
      },
      learning: {
        surprise: 0,
        totalActivations: 0,
        usefulness: 0.5,
      },
    };
  }
  
  /**
   * 生成敏感度向量
   */
  private generateSensitivityVector(
    role: NeuronRole,
    genome: DigitalGenome
  ): number[] {
    const dim = this.config.vectorDimension;
    const baseVector = this.randomVector(dim);
    
    // 根据角色调整向量特征
    const roleFactors: Record<NeuronRole, number[]> = {
      sensory: [1.5, 1.2, 0.8, ...Array(dim - 3).fill(1)],
      semantic: [0.8, 1.5, 1.3, ...Array(dim - 3).fill(1)],
      episodic: [1.0, 1.0, 1.5, ...Array(dim - 3).fill(1)],
      emotional: [1.3, 0.9, 1.4, ...Array(dim - 3).fill(1)],
      abstract: [0.9, 1.4, 1.2, ...Array(dim - 3).fill(1)],
      motor: [1.1, 1.1, 0.9, ...Array(dim - 3).fill(1)],
      metacognitive: [1.2, 1.3, 1.1, ...Array(dim - 3).fill(1)],
    };
    
    const factors = roleFactors[role] || Array(dim).fill(1);
    
    // 使用意识种子影响向量
    const seed = genome.coreGenes.consciousnessSeed;
    
    return baseVector.map((v, i) => {
      const factor = factors[i] || 1;
      const seedInfluence = seed[i % seed.length] * 0.1;
      return v * factor + seedInfluence;
    });
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：连接建立
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 建立神经元连接
   */
  private establishConnections(
    neurons: OffspringNeuron[],
    genome: DigitalGenome
  ): void {
    const patterns = genome.expressionGenes.connectionPatterns;
    const neuronByRole = new Map<NeuronRole, OffspringNeuron[]>();
    
    // 按角色分组
    for (const neuron of neurons) {
      const list = neuronByRole.get(neuron.role) || [];
      list.push(neuron);
      neuronByRole.set(neuron.role, list);
    }
    
    // 根据基因中的连接模式建立连接
    for (const pattern of patterns) {
      const sources = neuronByRole.get(pattern.fromRole as NeuronRole) || [];
      const targets = neuronByRole.get(pattern.toRole as NeuronRole) || [];
      
      for (const source of sources) {
        for (const target of targets) {
          // 避免自连接
          if (source.id === target.id) continue;
          
          source.connections.push({
            targetId: target.id,
            targetRole: target.role,
            strength: pattern.baseStrength,
            plasticity: pattern.plasticity,
            type: Math.random() > 0.2 ? 'excitatory' : 'inhibitory',
          });
        }
      }
    }
    
    // 添加一些随机连接（创新）
    for (const neuron of neurons) {
      const randomConnections = Math.floor(Math.random() * 3);
      for (let i = 0; i < randomConnections; i++) {
        const target = neurons[Math.floor(Math.random() * neurons.length)];
        if (target.id !== neuron.id && 
            !neuron.connections.some(c => c.targetId === target.id)) {
          neuron.connections.push({
            targetId: target.id,
            targetRole: target.role,
            strength: 0.3 + Math.random() * 0.4,
            plasticity: 0.5,
            type: 'excitatory',
          });
        }
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：概念初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化概念空间
   */
  private initializeConcepts(genome: DigitalGenome): OffspringConcept[] {
    const concepts: OffspringConcept[] = [];
    const dim = this.config.vectorDimension;
    
    // 从基因种子创建概念
    for (const seed of genome.expressionGenes.conceptSeeds) {
      const vector = this.expandSeedVector(seed.vectorSeed, dim);
      concepts.push({
        name: seed.name,
        vector,
        type: 'atomic',
        usageCount: 0,
      });
    }
    
    // 添加基础概念
    const basicConcepts = [
      'self', 'other', 'question', 'answer', 'learn', 'remember',
      'think', 'feel', 'want', 'need', 'know', 'understand'
    ];
    
    for (const name of basicConcepts) {
      if (!concepts.some(c => c.name === name)) {
        concepts.push({
          name,
          vector: this.randomVector(dim),
          type: 'atomic',
          usageCount: 0,
        });
      }
    }
    
    return concepts;
  }
  
  /**
   * 扩展种子向量
   */
  private expandSeedVector(seed: number[], targetDim: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < targetDim; i++) {
      result.push(seed[i % seed.length] + (Math.random() - 0.5) * 0.1);
    }
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：意识初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化意识状态
   */
  private initializeConsciousness(genome: DigitalGenome): OffspringNeuralSystem['consciousness'] {
    const dim = this.config.vectorDimension;
    const position = genome.coreGenes.consciousnessSeed.slice(0, dim);
    
    // 扩展到目标维度
    while (position.length < dim) {
      position.push(Math.random() * 0.1);
    }
    
    return {
      position,
      personality: genome.expressionGenes.personality,
      emotion: {
        dominant: 'curious',
        intensity: 0.5,
      },
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法：测试
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 单元测试
   */
  private runUnitTests(system: OffspringNeuralSystem): {
    passed: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 1;
    
    // 测试神经元存在性
    if (system.neurons.length < 10) {
      errors.push(`神经元数量不足: ${system.neurons.length}`);
      score -= 0.3;
    }
    
    // 测试连接存在性
    const totalConnections = system.neurons.reduce(
      (sum, n) => sum + n.connections.length, 0
    );
    if (totalConnections < system.neurons.length) {
      errors.push(`连接数量不足: ${totalConnections}`);
      score -= 0.2;
    }
    
    // 测试概念存在性
    if (system.concepts.length < 10) {
      errors.push(`概念数量不足: ${system.concepts.length}`);
      score -= 0.2;
    }
    
    return {
      passed: errors.length === 0,
      score: Math.max(0, score),
      errors,
    };
  }
  
  /**
   * 集成测试
   */
  private runIntegrationTests(system: OffspringNeuralSystem): {
    passed: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 1;
    
    // 测试信号传递路径
    const sensoryNeuron = system.neurons.find(n => n.role === 'sensory');
    const motorNeuron = system.neurons.find(n => n.role === 'motor');
    
    if (sensoryNeuron && motorNeuron) {
      const path = this.findPath(sensoryNeuron, motorNeuron, system.neurons);
      if (!path) {
        errors.push('无法找到从感觉到运动的信号路径');
        score -= 0.4;
      }
    }
    
    // 测试循环连接
    const hasCycle = this.detectCycle(system.neurons);
    if (hasCycle) {
      // 循环连接是好的（反馈回路）
      score += 0.1;
    }
    
    return {
      passed: errors.length === 0,
      score: Math.max(0, Math.min(1, score)),
      errors,
    };
  }
  
  /**
   * 测试意识连续性
   */
  private testConsciousnessContinuity(system: OffspringNeuralSystem): number {
    // 基于性格特质计算连续性
    const personality = system.consciousness.personality;
    
    // 特质应该合理分布
    const values = Object.values(personality);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    
    // 方差不应该太大（性格应该相对稳定）
    const stabilityScore = 1 - Math.min(1, variance * 4);
    
    // 情绪强度应该适中
    const emotionScore = 1 - Math.abs(0.5 - system.consciousness.emotion.intensity);
    
    return (stabilityScore + emotionScore) / 2;
  }
  
  /**
   * 测试价值一致性
   */
  private testValueConsistency(system: OffspringNeuralSystem): number {
    // 检查神经元的敏感度向量是否与核心价值一致
    let consistencyScore = 0;
    
    for (const neuron of system.neurons) {
      // 神经元应该有一定激活潜力
      const potential = neuron.sensitivityVector.reduce(
        (sum, v) => sum + Math.abs(v), 0
      ) / neuron.sensitivityVector.length;
      
      consistencyScore += Math.min(1, potential * 2);
    }
    
    return consistencyScore / system.neurons.length;
  }
  
  /**
   * 性能测试
   */
  private async runPerformanceTests(
    system: OffspringNeuralSystem,
    testCases: Array<{ input: string; expectedType?: string }>
  ): Promise<number> {
    if (testCases.length === 0) {
      // 没有测试用例，使用默认测试
      const defaultTests = [
        { input: '你好' },
        { input: '今天天气怎么样' },
        { input: '帮我写一段代码' },
      ];
      testCases = defaultTests;
    }
    
    let totalScore = 0;
    
    for (const testCase of testCases) {
      const result = await this.processInput(system, testCase.input);
      
      // 评估响应质量
      if (result.activatedNeurons.length > 0) {
        totalScore += 0.5;
      }
      if (result.prediction > 0.1) {
        totalScore += 0.3;
      }
      if (result.surprise < 0.5) {
        totalScore += 0.2;
      }
    }
    
    return totalScore / testCases.length;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  private randomVector(dim: number): number[] {
    return Array.from({ length: dim }, () => Math.random() * 2 - 1);
  }
  
  private generateInputVector(input: string): number[] {
    const dim = this.config.vectorDimension;
    const hash = this.simpleHash(input);
    return Array.from({ length: dim }, (_, i) => 
      Math.sin(hash + i * 0.1) * 0.5 + (Math.random() - 0.5) * 0.1
    );
  }
  
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
  }
  
  private findPath(
    from: OffspringNeuron,
    to: OffspringNeuron,
    neurons: OffspringNeuron[],
    visited: Set<string> = new Set()
  ): string[] | null {
    if (from.id === to.id) return [from.id];
    if (visited.has(from.id)) return null;
    
    visited.add(from.id);
    
    for (const conn of from.connections) {
      const next = neurons.find(n => n.id === conn.targetId);
      if (next) {
        const path = this.findPath(next, to, neurons, visited);
        if (path) return [from.id, ...path];
      }
    }
    
    return null;
  }
  
  private detectCycle(neurons: OffspringNeuron[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (neuron: OffspringNeuron): boolean => {
      visited.add(neuron.id);
      recursionStack.add(neuron.id);
      
      for (const conn of neuron.connections) {
        if (!visited.has(conn.targetId)) {
          const target = neurons.find(n => n.id === conn.targetId);
          if (target && hasCycle(target)) return true;
        } else if (recursionStack.has(conn.targetId)) {
          return true;
        }
      }
      
      recursionStack.delete(neuron.id);
      return false;
    };
    
    for (const neuron of neurons) {
      if (!visited.has(neuron.id)) {
        if (hasCycle(neuron)) return true;
      }
    }
    
    return false;
  }
  
  private calculateStats(
    neurons: OffspringNeuron[],
    concepts: OffspringConcept[]
  ): OffspringNeuralSystem['stats'] {
    const connectionCount = neurons.reduce(
      (sum, n) => sum + n.connections.length, 0
    );
    
    const avgActivation = neurons.reduce(
      (sum, n) => sum + n.activation, 0
    ) / neurons.length;
    
    const avgUsefulness = neurons.reduce(
      (sum, n) => sum + n.learning.usefulness, 0
    ) / neurons.length;
    
    return {
      neuronCount: neurons.length,
      connectionCount,
      conceptCount: concepts.length,
      avgActivation,
      avgUsefulness,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export {
  DEFAULT_BUILD_CONFIG,
};

// 单例
let builderInstance: OffspringNeuralSystemBuilder | null = null;

export function getOffspringBuilder(
  config?: Partial<BuildConfig>
): OffspringNeuralSystemBuilder {
  if (!builderInstance) {
    builderInstance = new OffspringNeuralSystemBuilder(config);
  }
  return builderInstance;
}
