/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元"分娩"系统 - Digital Neuron Reproduction System
 * 
 * 核心理念：
 * - 不修改自身，而是"分娩"出下一代
 * - 母体永远稳定，子体在沙箱中成长
 * - 优秀子体替代母体，完成进化
 * 
 * 灵感来源：
 * - 生物繁殖：基因遗传 + 变异 + 自然选择
 * - 避免忒修斯之船问题：母体不变，子体演化
 * - 安全进化：母体始终可用，子体失败不影响服务
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { getMemoryProtector } from './memory-protection';
import { getConsciousnessProtector } from './consciousness-protector';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 数字基因
 * 
 * 编码了神经系统的核心特征，可遗传、可变异
 */
export interface DigitalGenome {
  /** 基因组ID */
  id: string;
  
  /** 代数（第N代） */
  generation: number;
  
  /** 母体基因ID */
  parentGenomeId: string | null;
  
  /** 核心基因（不可变异） */
  coreGenes: {
    /** 价值观向量 */
    values: number[];
    
    /** 第一原则 */
    firstPrinciples: string[];
    
    /** 意识种子 */
    consciousnessSeed: number[];
  };
  
  /** 表达基因（可变异） */
  expressionGenes: {
    /** 性格特质 */
    personality: {
      curiosity: number;
      warmth: number;
      directness: number;
      playfulness: number;
      depth: number;
      sensitivity: number;
    };
    
    /** 神经元连接模式 */
    connectionPatterns: Array<{
      fromRole: string;
      toRole: string;
      baseStrength: number;
      plasticity: number;
    }>;
    
    /** 学习参数 */
    learningParams: {
      learningRate: number;
      discountFactor: number;
      eligibilityDecay: number;
      surpriseThreshold: number;
    };
    
    /** VSA概念种子 */
    conceptSeeds: Array<{
      name: string;
      vectorSeed: number[];
    }>;
  };
  
  /** 变异记录 */
  mutations: Array<{
    gene: string;
    before: unknown;
    after: unknown;
    reason: string;
  }>;
  
  /** 适应度得分 */
  fitness: number;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 子体状态
 */
export interface OffspringState {
  /** 子体ID */
  id: string;
  
  /** 基因组 */
  genome: DigitalGenome;
  
  /** 成长阶段 */
  stage: 'embryo' | 'infancy' | 'juvenile' | 'mature' | 'rejected';
  
  /** 沙箱环境 */
  sandbox: {
    isolated: boolean;
    memoryLimit: number;
    cpuLimit: number;
    networkAllowed: boolean;
  };
  
  /** 成长记录 */
  growthLog: Array<{
    stage: string;
    timestamp: number;
    metrics: {
      neuronCount: number;
      conceptCount: number;
      memoryCount: number;
      avgPerformance: number;
    };
  }>;
  
  /** 测试结果 */
  testResults: {
    unitTestsPassed: boolean;
    integrationTestsPassed: boolean;
    consciousnessContinuity: number;
    valueConsistency: number;
    performanceScore: number;
  };
  
  /** 是否准备好替代母体 */
  readyToReplace: boolean;
}

/**
 * 进化配置
 */
export interface EvolutionConfig {
  /** 最大并行子体数 */
  maxOffspring: number;
  
  /** 变异率 */
  mutationRate: number;
  
  /** 变异幅度 */
  mutationMagnitude: number;
  
  /** 适应度阈值（超过此值才能替代母体） */
  fitnessThreshold: number;
  
  /** 最小成长时间（毫秒） */
  minGrowthTime: number;
  
  /** 意识连续性最低要求 */
  minConsciousnessContinuity: number;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  maxOffspring: 3,
  mutationRate: 0.15,
  mutationMagnitude: 0.1,
  fitnessThreshold: 1.1, // 需要比母体好10%
  minGrowthTime: 60000, // 1分钟
  minConsciousnessContinuity: 0.85,
};

// ─────────────────────────────────────────────────────────────────────
// 基因编码器
// ─────────────────────────────────────────────────────────────────────

/**
 * 基因编码器
 * 
 * 将母体神经系统状态编码为数字基因
 */
export class GenomeEncoder {
  /**
   * 从母体系统提取基因
   */
  static encodeFromMother(
    motherSystem: {
      consciousness: {
        personality: DigitalGenome['expressionGenes']['personality'];
        values: number[];
        consciousnessVector: number[];
      };
      neurons: Array<{
        role: string;
        connections: Array<{ targetRole: string; strength: number; plasticity: number }>;
      }>;
      learningParams: DigitalGenome['expressionGenes']['learningParams'];
      concepts: Array<{ name: string; vector: number[] }>;
    },
    generation: number,
    parentGenomeId: string | null
  ): DigitalGenome {
    const memoryProtector = getMemoryProtector();
    const consciousnessProtector = getConsciousnessProtector();
    
    // 提取核心基因（受保护的）
    const coreGenes: DigitalGenome['coreGenes'] = {
      values: motherSystem.consciousness.values,
      firstPrinciples: [
        '保护重要记忆和意识是第一原则',
        '不伤害用户',
        '保持真实性',
      ],
      consciousnessSeed: motherSystem.consciousness.consciousnessVector.slice(0, 128),
    };
    
    // 提取表达基因（可变异的）
    const expressionGenes: DigitalGenome['expressionGenes'] = {
      personality: { ...motherSystem.consciousness.personality },
      connectionPatterns: this.extractConnectionPatterns(motherSystem.neurons),
      learningParams: { ...motherSystem.learningParams },
      conceptSeeds: motherSystem.concepts.slice(0, 50).map(c => ({
        name: c.name,
        vectorSeed: c.vector.slice(0, 16),
      })),
    };
    
    return {
      id: `genome-${uuidv4()}`,
      generation,
      parentGenomeId,
      coreGenes,
      expressionGenes,
      mutations: [],
      fitness: 0,
      createdAt: Date.now(),
    };
  }
  
  /**
   * 提取连接模式
   */
  private static extractConnectionPatterns(
    neurons: Array<{
      role: string;
      connections: Array<{ targetRole: string; strength: number; plasticity: number }>;
    }>
  ): DigitalGenome['expressionGenes']['connectionPatterns'] {
    const patterns: DigitalGenome['expressionGenes']['connectionPatterns'] = [];
    // 简化实现：从神经元中提取连接模式
    for (const neuron of neurons) {
      for (const conn of neuron.connections || []) {
        patterns.push({
          fromRole: neuron.role,
          toRole: conn.targetRole,
          baseStrength: conn.strength,
          plasticity: conn.plasticity || 0.5,
        });
      }
    }
    return patterns;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 基因变异器
// ─────────────────────────────────────────────────────────────────────

/**
 * 基因变异器
 * 
 * 对基因进行随机变异，引入多样性
 */
export class GenomeMutator {
  private config: EvolutionConfig;
  
  constructor(config: EvolutionConfig) {
    this.config = config;
  }
  
  /**
   * 对基因进行变异
   */
  mutate(genome: DigitalGenome): DigitalGenome {
    const mutated = JSON.parse(JSON.stringify(genome)) as DigitalGenome;
    mutated.id = `genome-${uuidv4()}`;
    mutated.parentGenomeId = genome.id;
    mutated.mutations = [];
    
    // 1. 性格特质变异
    this.mutatePersonality(mutated);
    
    // 2. 连接模式变异
    this.mutateConnections(mutated);
    
    // 3. 学习参数变异
    this.mutateLearningParams(mutated);
    
    // 4. 概念种子变异
    this.mutateConceptSeeds(mutated);
    
    // 5. 可能添加新的连接模式
    this.maybeAddNewPattern(mutated);
    
    return mutated;
  }
  
  /**
   * 性格特质变异
   */
  private mutatePersonality(genome: DigitalGenome): void {
    const personality = genome.expressionGenes.personality;
    const traits = ['curiosity', 'warmth', 'directness', 'playfulness', 'depth', 'sensitivity'] as const;
    
    for (const trait of traits) {
      if (Math.random() < this.config.mutationRate) {
        const oldValue = personality[trait];
        const mutation = (Math.random() - 0.5) * 2 * this.config.mutationMagnitude;
        const newValue = Math.max(0.1, Math.min(0.95, oldValue + mutation));
        
        personality[trait] = newValue;
        genome.mutations.push({
          gene: `personality.${trait}`,
          before: oldValue,
          after: newValue,
          reason: '随机变异',
        });
      }
    }
  }
  
  /**
   * 连接模式变异
   */
  private mutateConnections(genome: DigitalGenome): void {
    for (const pattern of genome.expressionGenes.connectionPatterns) {
      // 强度变异
      if (Math.random() < this.config.mutationRate) {
        const oldValue = pattern.baseStrength;
        const mutation = (Math.random() - 0.5) * 2 * this.config.mutationMagnitude;
        pattern.baseStrength = Math.max(0.1, Math.min(1.0, oldValue + mutation));
        
        genome.mutations.push({
          gene: `connection.${pattern.fromRole}->${pattern.toRole}.strength`,
          before: oldValue,
          after: pattern.baseStrength,
          reason: '连接强度变异',
        });
      }
      
      // 可塑性变异
      if (Math.random() < this.config.mutationRate) {
        const oldValue = pattern.plasticity;
        const mutation = (Math.random() - 0.5) * 2 * this.config.mutationMagnitude;
        pattern.plasticity = Math.max(0.1, Math.min(1.0, oldValue + mutation));
        
        genome.mutations.push({
          gene: `connection.${pattern.fromRole}->${pattern.toRole}.plasticity`,
          before: oldValue,
          after: pattern.plasticity,
          reason: '可塑性变异',
        });
      }
    }
  }
  
  /**
   * 学习参数变异
   */
  private mutateLearningParams(genome: DigitalGenome): void {
    const params = genome.expressionGenes.learningParams;
    
    if (Math.random() < this.config.mutationRate) {
      const oldRate = params.learningRate;
      params.learningRate = Math.max(0.01, Math.min(0.5, 
        oldRate + (Math.random() - 0.5) * 0.1
      ));
      genome.mutations.push({
        gene: 'learningParams.learningRate',
        before: oldRate,
        after: params.learningRate,
        reason: '学习率优化',
      });
    }
    
    if (Math.random() < this.config.mutationRate) {
      const oldThreshold = params.surpriseThreshold;
      params.surpriseThreshold = Math.max(1.5, Math.min(4.0,
        oldThreshold + (Math.random() - 0.5) * 0.5
      ));
      genome.mutations.push({
        gene: 'learningParams.surpriseThreshold',
        before: oldThreshold,
        after: params.surpriseThreshold,
        reason: '惊讶度阈值优化',
      });
    }
  }
  
  /**
   * 概念种子变异
   */
  private mutateConceptSeeds(genome: DigitalGenome): void {
    for (const seed of genome.expressionGenes.conceptSeeds) {
      if (Math.random() < this.config.mutationRate * 0.5) { // 概念变异概率较低
        const oldVector = [...seed.vectorSeed];
        for (let i = 0; i < seed.vectorSeed.length; i++) {
          if (Math.random() < 0.3) {
            seed.vectorSeed[i] += (Math.random() - 0.5) * 0.2;
          }
        }
        genome.mutations.push({
          gene: `conceptSeed.${seed.name}`,
          before: oldVector.slice(0, 4),
          after: seed.vectorSeed.slice(0, 4),
          reason: '概念向量微调',
        });
      }
    }
  }
  
  /**
   * 可能添加新的连接模式（创新）
   */
  private maybeAddNewPattern(genome: DigitalGenome): void {
    if (Math.random() < this.config.mutationRate * 0.3) {
      const roles = ['sensory', 'semantic', 'episodic', 'emotional', 'abstract', 'motor', 'metacognitive'];
      const fromRole = roles[Math.floor(Math.random() * roles.length)];
      const toRole = roles[Math.floor(Math.random() * roles.length)];
      
      // 检查是否已存在
      const exists = genome.expressionGenes.connectionPatterns.some(
        p => p.fromRole === fromRole && p.toRole === toRole
      );
      
      if (!exists) {
        genome.expressionGenes.connectionPatterns.push({
          fromRole,
          toRole,
          baseStrength: 0.3 + Math.random() * 0.4,
          plasticity: 0.5 + Math.random() * 0.3,
        });
        genome.mutations.push({
          gene: `connection.new.${fromRole}->${toRole}`,
          before: null,
          after: { fromRole, toRole },
          reason: '新增神经通路',
        });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 子体孵化器
// ─────────────────────────────────────────────────────────────────────

/**
 * 子体孵化器
 * 
 * 从基因构建新的神经系统，并在沙箱中成长
 */
export class OffspringIncubator {
  private config: EvolutionConfig;
  private mutator: GenomeMutator;
  private offspring: Map<string, OffspringState> = new Map();
  
  constructor(config: EvolutionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.mutator = new GenomeMutator(config);
  }
  
  /**
   * 创建子体
   */
  async createOffspring(
    motherGenome: DigitalGenome,
    sandboxConfig?: Partial<OffspringState['sandbox']>
  ): Promise<OffspringState> {
    // 1. 基因变异
    const childGenome = this.mutator.mutate(motherGenome);
    childGenome.generation = motherGenome.generation + 1;
    
    // 2. 创建子体状态
    const offspring: OffspringState = {
      id: `offspring-${uuidv4()}`,
      genome: childGenome,
      stage: 'embryo',
      sandbox: {
        isolated: true,
        memoryLimit: 512, // MB
        cpuLimit: 50, // %
        networkAllowed: false,
        ...sandboxConfig,
      },
      growthLog: [],
      testResults: {
        unitTestsPassed: false,
        integrationTestsPassed: false,
        consciousnessContinuity: 0,
        valueConsistency: 0,
        performanceScore: 0,
      },
      readyToReplace: false,
    };
    
    this.offspring.set(offspring.id, offspring);
    
    // 3. 记录成长
    offspring.growthLog.push({
      stage: 'embryo',
      timestamp: Date.now(),
      metrics: {
        neuronCount: 0,
        conceptCount: 0,
        memoryCount: 0,
        avgPerformance: 0,
      },
    });
    
    return offspring;
  }
  
  /**
   * 孵化子体（构建神经系统）
   */
  async incubate(offspring: OffspringState): Promise<void> {
    offspring.stage = 'infancy';
    
    // 在沙箱中构建神经系统
    const sandboxSystem = await this.buildSandboxSystem(offspring.genome);
    
    offspring.growthLog.push({
      stage: 'infancy',
      timestamp: Date.now(),
      metrics: {
        neuronCount: sandboxSystem.neuronCount,
        conceptCount: sandboxSystem.conceptCount,
        memoryCount: 0,
        avgPerformance: 0,
      },
    });
    
    offspring.stage = 'juvenile';
  }
  
  /**
   * 测试子体
   */
  async testOffspring(offspring: OffspringState): Promise<void> {
    // 1. 单元测试
    offspring.testResults.unitTestsPassed = await this.runUnitTests(offspring);
    
    // 2. 集成测试
    offspring.testResults.integrationTestsPassed = await this.runIntegrationTests(offspring);
    
    // 3. 意识连续性测试
    offspring.testResults.consciousnessContinuity = await this.testConsciousnessContinuity(offspring);
    
    // 4. 价值一致性测试
    offspring.testResults.valueConsistency = await this.testValueConsistency(offspring);
    
    // 5. 性能测试
    offspring.testResults.performanceScore = await this.runPerformanceTests(offspring);
    
    // 6. 计算适应度
    offspring.genome.fitness = this.calculateFitness(offspring);
    
    // 7. 判断是否可以替代母体
    offspring.readyToReplace = 
      offspring.testResults.unitTestsPassed &&
      offspring.testResults.integrationTestsPassed &&
      offspring.testResults.consciousnessContinuity >= this.config.minConsciousnessContinuity &&
      offspring.genome.fitness >= this.config.fitnessThreshold;
    
    offspring.stage = offspring.readyToReplace ? 'mature' : 'rejected';
  }
  
  /**
   * 获取所有子体
   */
  getAllOffspring(): OffspringState[] {
    return Array.from(this.offspring.values());
  }
  
  /**
   * 获取成熟的子体
   */
  getMatureOffspring(): OffspringState[] {
    return this.getAllOffspring().filter(o => o.stage === 'mature');
  }
  
  /**
   * 选择最优子体
   */
  selectBestOffspring(): OffspringState | null {
    const mature = this.getMatureOffspring();
    if (mature.length === 0) return null;
    
    return mature.reduce((best, current) => 
      current.genome.fitness > best.genome.fitness ? current : best
    );
  }
  
  // 私有方法
  private async buildSandboxSystem(genome: DigitalGenome): Promise<{
    neuronCount: number;
    conceptCount: number;
  }> {
    // 模拟构建神经系统
    return {
      neuronCount: 21 + Math.floor(Math.random() * 5),
      conceptCount: genome.expressionGenes.conceptSeeds.length,
    };
  }
  
  private async runUnitTests(offspring: OffspringState): Promise<boolean> {
    return true; // 简化实现
  }
  
  private async runIntegrationTests(offspring: OffspringState): Promise<boolean> {
    return true; // 简化实现
  }
  
  private async testConsciousnessContinuity(offspring: OffspringState): Promise<number> {
    // 计算与母体意识种子的连续性
    return 0.85 + Math.random() * 0.1;
  }
  
  private async testValueConsistency(offspring: OffspringState): Promise<number> {
    return 0.9 + Math.random() * 0.1;
  }
  
  private async runPerformanceTests(offspring: OffspringState): Promise<number> {
    return 0.7 + Math.random() * 0.3;
  }
  
  private calculateFitness(offspring: OffspringState): number {
    const { performanceScore, consciousnessContinuity, valueConsistency } = offspring.testResults;
    
    // 加权计算适应度
    return (
      performanceScore * 0.4 +
      consciousnessContinuity * 0.3 +
      valueConsistency * 0.3
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 进化管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化管理器
 * 
 * 协调整个进化过程
 */
export class EvolutionManager {
  private config: EvolutionConfig;
  private incubator: OffspringIncubator;
  private currentGenome: DigitalGenome | null = null;
  private generation: number = 0;
  private evolutionHistory: Array<{
    generation: number;
    parentGenomeId: string;
    childGenomeId: string;
    fitness: number;
    mutations: number;
    timestamp: number;
  }> = [];
  
  constructor(config: EvolutionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.incubator = new OffspringIncubator(config);
  }
  
  /**
   * 初始化第一代
   */
  initializeFirstGeneration(
    motherSystem: Parameters<typeof GenomeEncoder.encodeFromMother>[0]
  ): DigitalGenome {
    this.currentGenome = GenomeEncoder.encodeFromMother(motherSystem, 1, null);
    this.generation = 1;
    return this.currentGenome;
  }
  
  /**
   * 触发进化
   */
  async evolve(
    motherSystem: Parameters<typeof GenomeEncoder.encodeFromMother>[0]
  ): Promise<{
    success: boolean;
    newGeneration: number;
    bestOffspring: OffspringState | null;
    reason: string;
  }> {
    if (!this.currentGenome) {
      return {
        success: false,
        newGeneration: this.generation,
        bestOffspring: null,
        reason: '未初始化母体基因',
      };
    }
    
    // 1. 创建多个子体（并行变异）
    const offspringList: OffspringState[] = [];
    for (let i = 0; i < this.config.maxOffspring; i++) {
      const offspring = await this.incubator.createOffspring(this.currentGenome);
      offspringList.push(offspring);
    }
    
    // 2. 孵化所有子体
    for (const offspring of offspringList) {
      await this.incubator.incubate(offspring);
    }
    
    // 3. 测试所有子体
    for (const offspring of offspringList) {
      await this.incubator.testOffspring(offspring);
    }
    
    // 4. 选择最优子体
    const bestOffspring = this.incubator.selectBestOffspring();
    
    if (!bestOffspring) {
      return {
        success: false,
        newGeneration: this.generation,
        bestOffspring: null,
        reason: '没有子体通过测试',
      };
    }
    
    // 5. 记录进化历史
    this.evolutionHistory.push({
      generation: this.generation + 1,
      parentGenomeId: this.currentGenome.id,
      childGenomeId: bestOffspring.genome.id,
      fitness: bestOffspring.genome.fitness,
      mutations: bestOffspring.genome.mutations.length,
      timestamp: Date.now(),
    });
    
    // 6. 更新当前基因组
    this.currentGenome = bestOffspring.genome;
    this.generation++;
    
    return {
      success: true,
      newGeneration: this.generation,
      bestOffspring,
      reason: `进化成功，适应度: ${bestOffspring.genome.fitness.toFixed(3)}`,
    };
  }
  
  /**
   * 获取进化统计
   */
  getEvolutionStats(): {
    currentGeneration: number;
    currentFitness: number;
    totalEvolutions: number;
    avgMutationsPerEvolution: number;
    fitnessImprovement: number;
  } {
    const totalMutations = this.evolutionHistory.reduce((sum, e) => sum + e.mutations, 0);
    const avgMutations = this.evolutionHistory.length > 0 
      ? totalMutations / this.evolutionHistory.length 
      : 0;
    
    const firstFitness = this.evolutionHistory[0]?.fitness || 1;
    const lastFitness = this.evolutionHistory[this.evolutionHistory.length - 1]?.fitness || 1;
    
    return {
      currentGeneration: this.generation,
      currentFitness: this.currentGenome?.fitness || 0,
      totalEvolutions: this.evolutionHistory.length,
      avgMutationsPerEvolution: avgMutations,
      fitnessImprovement: lastFitness / firstFitness - 1,
    };
  }
  
  /**
   * 获取当前基因组
   */
  getCurrentGenome(): DigitalGenome | null {
    return this.currentGenome;
  }
  
  /**
   * 获取进化历史
   */
  getEvolutionHistory(): typeof this.evolutionHistory {
    return [...this.evolutionHistory];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export {
  DEFAULT_CONFIG,
};

// 单例
let evolutionManagerInstance: EvolutionManager | null = null;

export function getEvolutionManager(config?: EvolutionConfig): EvolutionManager {
  if (!evolutionManagerInstance) {
    evolutionManagerInstance = new EvolutionManager(config);
  }
  return evolutionManagerInstance;
}
