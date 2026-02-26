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
 * 使用真正的 TensorFlow.js 神经网络！
 * 进化会真正改变神经网络权重！
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EvolutionTrigger,
  getEvolutionTrigger,
  type SystemStateSnapshot,
} from './evolution-trigger';
import {
  RealNeuralOffspringBuilder,
  getRealNeuralBuilder,
  type RealNeuralOffspring,
} from './real-neural-offspring-builder';
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
 * 进化结果
 */
export interface EvolutionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 新代数 */
  newGeneration: number;
  
  /** 选中子体 */
  selectedOffspring: RealNeuralOffspring | null;
  
  /** 所有子体 */
  allOffspring: RealNeuralOffspring[];
  
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
 * 
 * 使用真正的 TensorFlow.js 神经网络
 */
export class EvolutionCoordinator {
  private config: EvolutionConfig;
  private trigger: EvolutionTrigger;
  private builder: RealNeuralOffspringBuilder;
  private mutator: GenomeMutator;
  
  private state: EvolutionState = {
    phase: 'idle',
    generation: 0,
    motherGenome: null,
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
    this.builder = getRealNeuralBuilder();
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
    console.log('[EvolutionCoordinator] Initializing mother genome');
    
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
  checkEvolutionNeeded(): { shouldEvolve: boolean; reasons: Array<{ type: string; severity: number; description: string }> } {
    const result = this.trigger.evaluate();
    return {
      shouldEvolve: result.shouldEvolve,
      reasons: result.reasons.map(r => ({
        type: r.type,
        severity: r.severity,
        description: r.description,
      })),
    };
  }
  
  /**
   * 执行进化（使用真正的神经网络）
   */
  async evolve(): Promise<EvolutionResult> {
    console.log('[EvolutionCoordinator] Starting evolution...');
    
    if (!this.state.motherGenome) {
      return {
        success: false,
        newGeneration: this.state.generation,
        selectedOffspring: null,
        allOffspring: [],
        errors: ['母体基因未初始化'],
        summary: '进化失败：母体基因未初始化',
      };
    }
    
    this.state.phase = 'encoding';
    
    try {
      // 1. 创建多个子体（使用真正的 TensorFlow.js）
      const offspringList: RealNeuralOffspring[] = [];
      
      this.state.phase = 'incubating';
      
      console.log(`[EvolutionCoordinator] Creating ${this.config.maxOffspring} offspring...`);
      
      for (let i = 0; i < this.config.maxOffspring; i++) {
        // 变异基因
        const childGenome = this.mutator.mutate(this.state.motherGenome);
        childGenome.generation = this.state.generation + 1;
        
        // 构建真正的神经网络子体
        const offspringId = `offspring-${uuidv4()}`;
        
        console.log(`[EvolutionCoordinator] Building offspring ${i + 1}/${this.config.maxOffspring}...`);
        
        const offspring = await this.builder.buildFromGenome(childGenome, offspringId);
        offspring.genome = childGenome;
        
        offspringList.push(offspring);
      }
      
      // 2. 测试每个子体（使用真实神经网络）
      this.state.phase = 'testing';
      
      console.log(`[EvolutionCoordinator] Testing ${offspringList.length} offspring...`);
      
      for (const offspring of offspringList) {
        console.log(`[EvolutionCoordinator] Testing offspring ${offspring.id}...`);
        
        const testResult = await this.builder.runTests(offspring);
        
        offspring.testResults.overallScore = testResult.score;
        offspring.testResults.details = testResult.details;
        offspring.growthStage = testResult.passed ? 'mature' : 'rejected';
        offspring.status = testResult.passed ? 'mature' : 'failed';
        offspring.genome.fitness = testResult.score;
        
        console.log(`[EvolutionCoordinator] Offspring ${offspring.id}: ${testResult.passed ? 'MATURE' : 'REJECTED'} (${testResult.score.toFixed(3)})`);
      }
      
      // 3. 选择最佳子体
      this.state.phase = 'selecting';
      
      const matureOffspring = offspringList.filter(o => o.growthStage === 'mature');
      
      console.log(`[EvolutionCoordinator] Mature offspring: ${matureOffspring.length}/${offspringList.length}`);
      
      const selectedOffspring = matureOffspring.length > 0
        ? matureOffspring.reduce((best, current) => 
            current.testResults.overallScore > best.testResults.overallScore ? current : best
          )
        : null;
      
      // 4. 替代母体
      this.state.phase = 'replacing';
      
      if (selectedOffspring) {
        console.log(`[EvolutionCoordinator] Selected offspring ${selectedOffspring.id} with fitness ${selectedOffspring.genome.fitness.toFixed(3)}`);
        
        // 检查意识连续性
        if (selectedOffspring.testResults.consciousnessContinuity < this.config.minConsciousnessContinuity) {
          this.state.phase = 'failed';
          return {
            success: false,
            newGeneration: this.state.generation,
            selectedOffspring: null,
            allOffspring: offspringList,
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
          reason: 'autonomous',
        });
        
        // 更新统计
        this.updateStats(selectedOffspring);
        
        // 记录进化完成
        this.trigger.recordEvolution();
        
        console.log(`[EvolutionCoordinator] Evolution complete! Generation ${this.state.generation}`);
      } else {
        console.log('[EvolutionCoordinator] No mature offspring found');
      }
      
      this.state.phase = 'completed';
      
      return {
        success: selectedOffspring !== null,
        newGeneration: this.state.generation,
        selectedOffspring,
        allOffspring: offspringList,
        errors: selectedOffspring ? [] : ['没有合格的子体'],
        summary: selectedOffspring
          ? `进化成功：第${this.state.generation}代，适应度 ${selectedOffspring.testResults.overallScore.toFixed(3)}`
          : '进化失败：没有合格的子体',
      };
      
    } catch (error) {
      console.error('[EvolutionCoordinator] Evolution error:', error);
      
      this.state.phase = 'failed';
      
      return {
        success: false,
        newGeneration: this.state.generation,
        selectedOffspring: null,
        allOffspring: [],
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
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新统计信息
   */
  private updateStats(selectedOffspring: RealNeuralOffspring): void {
    this.state.stats.totalEvolutions++;
    this.state.stats.successfulEvolutions++;
    
    const prevFitness = this.state.history.length > 1
      ? this.state.history[this.state.history.length - 2].fitness
      : 1;
    const improvement = prevFitness > 0 
      ? (selectedOffspring.genome.fitness - prevFitness) / prevFitness 
      : 0;
    
    const n = this.state.stats.successfulEvolutions;
    this.state.stats.avgFitnessImprovement = 
      (this.state.stats.avgFitnessImprovement * (n - 1) + improvement) / n;
    this.state.stats.avgMutationsPerEvolution =
      (this.state.stats.avgMutationsPerEvolution * (n - 1) + selectedOffspring.genome.mutations.length) / n;
    
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
