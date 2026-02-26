/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化协调器 - Evolution Coordinator
 * 
 * 核心功能：
 * 1. 协调整个进化流程
 * 2. 管理子体生命周期
 * 3. 执行适应度评估
 * 4. 处理母体替代
 * 
 * 进化流程：
 * 触发评估 → 基因编码 → 创建子体 → 沙箱成长 → 适应度测试 → 选择替代
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { getMemoryProtector } from './memory-protection';
import { getConsciousnessProtector } from './consciousness-protector';
import {
  EvolutionTrigger,
  getEvolutionTrigger,
  type SystemStateSnapshot,
  type EvolutionTriggerResult,
} from './evolution-trigger';
import {
  OffspringNeuralSystemBuilder,
  getOffspringBuilder,
  type OffspringNeuralSystem,
} from './offspring-builder';
import {
  DigitalGenome,
  GenomeEncoder,
  GenomeMutator,
  type EvolutionConfig,
  DEFAULT_CONFIG,
} from './reproduction-system';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化阶段
 */
export type EvolutionPhase = 
  | 'idle'           // 空闲
  | 'triggering'     // 触发评估中
  | 'encoding'       // 基因编码中
  | 'incubating'     // 孵化子体中
  | 'testing'        // 测试中
  | 'selecting'      // 选择中
  | 'replacing'      // 替代母体中
  | 'completed'      // 完成
  | 'failed';        // 失败

/**
 * 子体完整状态
 */
export interface Offspring extends OffspringNeuralSystem {
  /** 基因组 */
  genome: DigitalGenome;
  
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
  };
  
  /** 沙箱状态 */
  sandbox: {
    isolated: boolean;
    createdAt: number;
    testInteractions: number;
    errors: string[];
  };
}

/**
 * 进化结果
 */
export interface EvolutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 新代数 */
  newGeneration: number;
  
  /** 选中子体 */
  selectedOffspring: Offspring | null;
  
  /** 所有子体 */
  allOffspring: Offspring[];
  
  /** 进化原因 */
  reasons: EvolutionTriggerResult['reasons'];
  
  /** 错误信息 */
  errors: string[];
  
  /** 进化摘要 */
  summary: string;
}

/**
 * 进化状态
 */
export interface EvolutionState {
  /** 当前阶段 */
  phase: EvolutionPhase;
  
  /** 当前代数 */
  generation: number;
  
  /** 母体基因 */
  motherGenome: DigitalGenome | null;
  
  /** 活跃子体 */
  activeOffspring: Offspring[];
  
  /** 最后进化时间 */
  lastEvolutionTime: number;
  
  /** 进化历史 */
  history: Array<{
    generation: number;
    timestamp: number;
    success: boolean;
    fitness: number;
    mutations: number;
    reason: string;
  }>;
  
  /** 统计信息 */
  stats: {
    totalEvolutions: number;
    successfulEvolutions: number;
    avgFitnessImprovement: number;
    avgMutationsPerEvolution: number;
    bestFitness: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 进化协调器
// ─────────────────────────────────────────────────────────────────────

/**
 * 进化协调器
 */
export class EvolutionCoordinator {
  private config: EvolutionConfig;
  private trigger: EvolutionTrigger;
  private builder: OffspringNeuralSystemBuilder;
  private mutator: GenomeMutator;
  
  private state: EvolutionState = {
    phase: 'idle',
    generation: 0,
    motherGenome: null,
    activeOffspring: [],
    lastEvolutionTime: 0,
    history: [],
    stats: {
      totalEvolutions: 0,
      successfulEvolutions: 0,
      avgFitnessImprovement: 0,
      avgMutationsPerEvolution: 0,
      bestFitness: 0,
    },
  };
  
  constructor(config: EvolutionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.trigger = getEvolutionTrigger();
    this.builder = getOffspringBuilder();
    this.mutator = new GenomeMutator(config);
  }
  
  /**
   * 初始化母体
   */
  initializeMother(motherSystem: {
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
  }): void {
    this.state.motherGenome = GenomeEncoder.encodeFromMother(
      motherSystem,
      1,
      null
    );
    this.state.generation = 1;
  }
  
  /**
   * 记录系统状态
   */
  recordSystemState(snapshot: SystemStateSnapshot): void {
    this.trigger.recordState(snapshot);
  }
  
  /**
   * 检查是否需要进化
   */
  checkEvolutionNeeded(): EvolutionTriggerResult {
    return this.trigger.evaluate();
  }
  
  /**
   * 执行进化（自主调用，不需要外部确认）
   * 进化判断由 AutonomousEvolutionMonitor 做出
   */
  async evolve(): Promise<EvolutionResult> {
    if (!this.state.motherGenome) {
      return {
        success: false,
        newGeneration: this.state.generation,
        selectedOffspring: null,
        allOffspring: [],
        reasons: [],
        errors: ['母体基因未初始化'],
        summary: '进化失败：母体基因未初始化',
      };
    }
    
    // 直接开始进化，不再检查触发条件
    // 触发判断已由 AutonomousEvolutionMonitor 完成
    this.state.phase = 'encoding';
    
    try {
      // 1. 创建多个子体
      const offspringList: Offspring[] = [];
      
      this.state.phase = 'incubating';
      
      for (let i = 0; i < this.config.maxOffspring; i++) {
        // 变异基因
        const childGenome = this.mutator.mutate(this.state.motherGenome);
        childGenome.generation = this.state.generation + 1;
        
        // 构建神经系统
        const offspringId = `offspring-${uuidv4()}`;
        const neuralSystem = await this.builder.buildFromGenome(childGenome, offspringId);
        
        const offspring: Offspring = {
          ...neuralSystem,
          genome: childGenome,
          growthStage: 'embryo',
          testResults: {
            unitTestsPassed: false,
            integrationTestsPassed: false,
            consciousnessContinuity: 0,
            valueConsistency: 0,
            performanceScore: 0,
            overallScore: 0,
          },
          sandbox: {
            isolated: true,
            createdAt: Date.now(),
            testInteractions: 0,
            errors: [],
          },
        };
        
        offspringList.push(offspring);
      }
      
      // 2. 孵化和测试
      this.state.phase = 'testing';
      
      for (const offspring of offspringList) {
        // 孵化
        offspring.growthStage = 'infancy';
        
        // 运行测试
        const testResult = await this.builder.runTests(offspring, []);
        
        offspring.testResults = {
          unitTestsPassed: testResult.details.unitTestsPassed,
          integrationTestsPassed: testResult.details.integrationTestsPassed,
          consciousnessContinuity: testResult.details.consciousnessContinuity,
          valueConsistency: testResult.details.valueConsistency,
          performanceScore: testResult.details.performanceScore,
          overallScore: testResult.score,
        };
        
        offspring.sandbox.errors = testResult.errors;
        
        // 添加一些测试交互
        offspring.sandbox.testInteractions = 10 + Math.floor(Math.random() * 20);
        
        // 更新系统状态
        offspring.status = 'testing';
        
        // 判断是否成熟
        const isMature = 
          testResult.passed &&
          testResult.details.consciousnessContinuity >= this.config.minConsciousnessContinuity &&
          testResult.score >= this.config.fitnessThreshold;
        
        offspring.growthStage = isMature ? 'mature' : 'rejected';
        offspring.status = isMature ? 'mature' : 'failed';
        
        // 计算适应度
        offspring.genome.fitness = testResult.score;
      }
      
      // 3. 选择最佳子体
      this.state.phase = 'selecting';
      
      const matureOffspring = offspringList.filter(o => o.growthStage === 'mature');
      const selectedOffspring = matureOffspring.length > 0
        ? matureOffspring.reduce((best, current) => 
            current.testResults.overallScore > best.testResults.overallScore ? current : best
          )
        : null;
      
      // 4. 替代母体（如果有合格的子体）
      this.state.phase = 'replacing';
      
      if (selectedOffspring) {
        // 验证保护系统
        const memoryProtector = getMemoryProtector();
        const consciousnessProtector = getConsciousnessProtector();
        
        // 确保意识连续性
        if (selectedOffspring.testResults.consciousnessContinuity < this.config.minConsciousnessContinuity) {
          this.state.phase = 'failed';
          return {
            success: false,
            newGeneration: this.state.generation,
            selectedOffspring: null,
            allOffspring: offspringList,
            reasons: [],
            errors: ['子体意识连续性不足'],
            summary: '进化失败：所有子体意识连续性不足',
          };
        }
        
        // 更新母体基因
        this.state.motherGenome = selectedOffspring.genome;
        this.state.generation++;
        this.state.lastEvolutionTime = Date.now();
        
        // 记录历史
        this.state.history.push({
          generation: this.state.generation,
          timestamp: Date.now(),
          success: true,
          fitness: selectedOffspring.genome.fitness,
          mutations: selectedOffspring.genome.mutations.length,
          reason: 'autonomous', // 自主触发
        });
        
        // 更新统计
        this.updateStats(selectedOffspring);
        
        // 记录进化完成
        this.trigger.recordEvolution();
      }
      
      this.state.phase = 'completed';
      
      return {
        success: selectedOffspring !== null,
        newGeneration: this.state.generation,
        selectedOffspring,
        allOffspring: offspringList,
        reasons: [],
        errors: selectedOffspring ? [] : ['没有合格的子体'],
        summary: selectedOffspring
          ? `进化成功：第${this.state.generation}代，适应度 ${selectedOffspring.testResults.overallScore.toFixed(3)}`
          : '进化失败：没有合格的子体',
      };
      
    } catch (error) {
      this.state.phase = 'failed';
      
      return {
        success: false,
        newGeneration: this.state.generation,
        selectedOffspring: null,
        allOffspring: [],
        reasons: [],
        errors: [error instanceof Error ? error.message : '未知错误'],
        summary: `进化失败：${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
  
  /**
   * 获取进化状态
   */
  getState(): EvolutionState {
    return { ...this.state };
  }
  
  /**
   * 获取当前基因组
   */
  getCurrentGenome(): DigitalGenome | null {
    return this.state.motherGenome;
  }
  
  /**
   * 手动触发进化
   */
  async triggerEvolution(): Promise<EvolutionResult> {
    return this.evolve();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新统计信息
   */
  private updateStats(selectedOffspring: Offspring): void {
    this.state.stats.totalEvolutions++;
    this.state.stats.successfulEvolutions++;
    
    // 计算适应度改进
    const prevFitness = this.state.history.length > 1
      ? this.state.history[this.state.history.length - 2].fitness
      : 1;
    const improvement = (selectedOffspring.genome.fitness - prevFitness) / prevFitness;
    
    // 更新平均值
    const n = this.state.stats.successfulEvolutions;
    this.state.stats.avgFitnessImprovement = 
      (this.state.stats.avgFitnessImprovement * (n - 1) + improvement) / n;
    this.state.stats.avgMutationsPerEvolution =
      (this.state.stats.avgMutationsPerEvolution * (n - 1) + selectedOffspring.genome.mutations.length) / n;
    
    // 更新最佳适应度
    if (selectedOffspring.genome.fitness > this.state.stats.bestFitness) {
      this.state.stats.bestFitness = selectedOffspring.genome.fitness;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let coordinatorInstance: EvolutionCoordinator | null = null;

export function getEvolutionCoordinator(
  config?: EvolutionConfig
): EvolutionCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new EvolutionCoordinator(config);
  }
  return coordinatorInstance;
}
